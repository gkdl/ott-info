# 신고 24시간 내 처리 — 어드민 흐름 설계

## 1. 신고 처리 흐름

```
유저 신고
  └─▶ reports 테이블 INSERT (status = 'pending')
        └─▶ [자동 트리거] 누적 신고 N건 도달 시 Slack/이메일 알림 발송
                └─▶ 운영자 검토 (24시간 이내)
                      ├─▶ 위반 확인: reviews.is_hidden = true 처리 + status = 'reviewed'
                      └─▶ 이상 없음: status = 'dismissed'
```

## 2. DB 추가 컬럼

```sql
-- reviews 테이블에 숨김 컬럼 추가
ALTER TABLE reviews ADD COLUMN is_hidden boolean NOT NULL DEFAULT false;

-- reports 누적 카운트 뷰 (운영자 대시보드용)
CREATE VIEW pending_reports_summary AS
SELECT
  r.review_id,
  rv.content_title,
  rv.comment,
  rv.user_id AS author_id,
  COUNT(*)   AS report_count,
  MIN(r.created_at) AS first_reported_at
FROM reports r
JOIN reviews rv ON rv.id = r.review_id
WHERE r.status = 'pending'
GROUP BY r.review_id, rv.content_title, rv.comment, rv.user_id
ORDER BY report_count DESC, first_reported_at ASC;
```

## 3. 자동 알림 트리거 (Supabase Edge Function + pg_notify)

```sql
-- 신고 3건 누적 시 pg_notify → Edge Function 수신 후 Slack 웹훅 호출
CREATE OR REPLACE FUNCTION notify_high_report_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM reports
  WHERE review_id = NEW.review_id AND status = 'pending';

  IF cnt >= 3 THEN
    PERFORM pg_notify(
      'high_report',
      json_build_object('review_id', NEW.review_id, 'count', cnt)::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_high_report
  AFTER INSERT ON reports
  FOR EACH ROW EXECUTE FUNCTION notify_high_report_count();
```

## 4. 운영자 처리 Edge Function (supabase/functions/admin-moderate)

```typescript
// POST { review_id, action: 'hide' | 'dismiss' }
// Authorization: Bearer <service_role_jwt> 또는 별도 admin secret 헤더

Deno.serve(async (req) => {
  // 1. admin secret 검증
  const adminSecret = req.headers.get("x-admin-secret");
  if (adminSecret !== Deno.env.get("ADMIN_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { review_id, action } = await req.json();
  const adminClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (action === "hide") {
    // 리뷰 숨김
    await adminClient.from("reviews")
      .update({ is_hidden: true })
      .eq("id", review_id);
    // 관련 신고 reviewed 처리
    await adminClient.from("reports")
      .update({ status: "reviewed" })
      .eq("review_id", review_id)
      .eq("status", "pending");
  } else {
    // 신고 기각
    await adminClient.from("reports")
      .update({ status: "dismissed" })
      .eq("review_id", review_id)
      .eq("status", "pending");
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});
```

## 5. 클라이언트 숨김 반영

```typescript
// fetchReviews RPC에서 is_hidden = false 조건 추가
// get_reviews_excluding_blocked 함수 내부:
WHERE r.is_hidden = false
  AND r.user_id NOT IN (SELECT blocked_user_id FROM blocks WHERE blocker_id = auth.uid())
```

## 6. 운영 대시보드 (간이)

Supabase Table Editor 또는 별도 내부 웹페이지에서:
- `pending_reports_summary` 뷰 조회
- 신고 누적 리뷰 내용 확인
- `admin-moderate` Edge Function 호출 버튼 (hide / dismiss)
- 처리 시각 자동 기록 (`reports.updated_at`)
