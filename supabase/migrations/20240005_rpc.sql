-- ═══════════════════════════════════════════════════════════════════════════
-- 005 · RPC 함수 (SECURITY DEFINER — 차단 유저 제외 조회)
-- ═══════════════════════════════════════════════════════════════════════════
-- 설계 이유:
--   차단 유저 필터를 RLS SELECT 정책에 직접 삽입하면
--   모든 reviews SELECT마다 blocks 테이블을 스캔해야 하고
--   RLS 정책 안에서 서브쿼리 인덱스 활용이 제한됨.
--   SECURITY DEFINER 함수로 분리하면:
--     ① 호출 시에만 실행 (불필요한 스캔 없음)
--     ② 내부에서 최적화된 쿼리와 인덱스 힌트 직접 제어 가능
--     ③ 정책과 비즈니스 로직 분리로 유지보수 용이

-- ─── 리뷰 목록 (차단 유저 제외, 정렬·페이지네이션) ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_reviews_excluding_blocked(
  p_content_id   TEXT,
  p_content_type TEXT,
  p_sort         TEXT,    -- 'latest' | 'likes' | 'rating_high' | 'rating_low'
  p_limit        INT  DEFAULT 10,
  p_offset       INT  DEFAULT 0
)
RETURNS TABLE (
  id            BIGINT,
  user_id       UUID,
  content_id    TEXT,
  content_type  TEXT,
  content_title TEXT,
  poster_path   TEXT,
  rating        INT,
  comment       TEXT,
  like_count    INT,
  is_hidden     BOOLEAN,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ,
  profile       JSON,
  is_liked_by_me BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    r.content_id,
    r.content_type,
    r.content_title,
    r.poster_path,
    r.rating,
    r.comment,
    r.like_count,
    r.is_hidden,
    r.created_at,
    r.updated_at,
    json_build_object(
      'nickname',   p.nickname,
      'avatar_url', p.avatar_url
    ) AS profile,
    CASE
      WHEN v_user_id IS NULL THEN false
      ELSE EXISTS (
        SELECT 1 FROM public.review_likes rl
        WHERE rl.review_id = r.id AND rl.user_id = v_user_id
      )
    END AS is_liked_by_me
  FROM public.reviews r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.content_id   = p_content_id
    AND r.content_type = p_content_type
    AND r.is_hidden    = false
    -- 차단한 유저 제외
    AND (
      v_user_id IS NULL
      OR r.user_id NOT IN (
        SELECT b.blocked_user_id
        FROM public.blocks b
        WHERE b.blocker_id = v_user_id
      )
    )
  ORDER BY
    CASE WHEN p_sort = 'latest'      THEN r.created_at          END DESC,
    CASE WHEN p_sort = 'likes'       THEN r.like_count           END DESC,
    CASE WHEN p_sort = 'rating_high' THEN r.rating               END DESC,
    CASE WHEN p_sort = 'rating_low'  THEN r.rating               END ASC,
    r.created_at DESC   -- 동점 시 최신순 보조 정렬
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

-- ─── 커뮤니티 피드 (홈 화면, 차단 유저 제외) ─────────────────────────────────
-- 최근 좋아요가 많은 리뷰 우선, 차단 유저 제외
CREATE OR REPLACE FUNCTION public.get_community_feed_excluding_blocked(
  p_limit INT DEFAULT 4
)
RETURNS TABLE (
  id            BIGINT,
  user_id       UUID,
  content_id    TEXT,
  content_type  TEXT,
  content_title TEXT,
  poster_path   TEXT,
  rating        INT,
  comment       TEXT,
  like_count    INT,
  is_hidden     BOOLEAN,
  created_at    TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ,
  profile       JSON,
  is_liked_by_me BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.user_id,
    r.content_id,
    r.content_type,
    r.content_title,
    r.poster_path,
    r.rating,
    r.comment,
    r.like_count,
    r.is_hidden,
    r.created_at,
    r.updated_at,
    json_build_object(
      'nickname',   p.nickname,
      'avatar_url', p.avatar_url
    ) AS profile,
    false AS is_liked_by_me   -- 피드에서는 좋아요 여부 불필요
  FROM public.reviews r
  JOIN public.profiles p ON p.id = r.user_id
  WHERE r.is_hidden = false
    AND r.created_at >= now() - INTERVAL '7 days'   -- 최근 7일 리뷰
    AND (
      v_user_id IS NULL
      OR r.user_id NOT IN (
        SELECT b.blocked_user_id
        FROM public.blocks b
        WHERE b.blocker_id = v_user_id
      )
    )
  ORDER BY r.like_count DESC, r.created_at DESC
  LIMIT p_limit;
END;
$$;

-- ─── 운영자 신고 처리 뷰 ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.pending_reports_summary AS
SELECT
  r.review_id,
  rv.content_title,
  rv.comment,
  rv.user_id        AS author_id,
  p.nickname        AS author_nickname,
  COUNT(*)          AS report_count,
  MIN(r.created_at) AS first_reported_at,
  array_agg(DISTINCT r.reason ORDER BY r.reason) AS reasons
FROM public.reports r
JOIN public.reviews  rv ON rv.id = r.review_id
JOIN public.profiles p  ON p.id  = rv.user_id
WHERE r.status = 'pending'
GROUP BY r.review_id, rv.content_title, rv.comment, rv.user_id, p.nickname
ORDER BY report_count DESC, first_reported_at ASC;

-- 뷰에 RLS 적용 (service_role만 접근 가능하도록 직접 정책 부여 불가,
-- 대신 anon/authenticated에서 이 뷰를 SELECT하지 못하도록 REVOKE)
REVOKE SELECT ON public.pending_reports_summary FROM anon, authenticated;
