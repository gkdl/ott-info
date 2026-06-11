-- ═══════════════════════════════════════════════════════════════════════════
-- 003 · 트리거
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── updated_at 자동 갱신 (공통 함수) ───────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── review_likes 변경 시 reviews.like_count 증감 ───────────────────────────
-- 좋아요 순 정렬·피드 N+1 쿼리 방지를 위해 카운트를 컬럼에 직접 유지.
-- 매 조회마다 COUNT 집계하는 대신 INSERT/DELETE 시 즉시 증감.
CREATE OR REPLACE FUNCTION public.update_review_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.reviews
    SET like_count = like_count + 1
    WHERE id = NEW.review_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.reviews
    SET like_count = GREATEST(like_count - 1, 0)  -- 음수 방지
    WHERE id = OLD.review_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_review_like_count
  AFTER INSERT OR DELETE ON public.review_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_review_like_count();

-- ─── 신규 유저 프로필 자동 생성 ─────────────────────────────────────────────
-- Supabase Auth에서 유저 생성 시 자동으로 profiles 행 삽입.
-- 카카오 user_metadata에서 nickname, avatar_url 추출.
-- 클라이언트에서 upsert를 별도로 호출하지 않아도 되지만
-- 클라이언트 upsert가 더 빠른 경우를 대비해 ON CONFLICT DO NOTHING으로 처리.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nickname text;
  v_avatar   text;
BEGIN
  v_nickname := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    '사용자'
  );
  v_avatar := NEW.raw_user_meta_data->>'avatar_url';

  INSERT INTO public.profiles (id, nickname, avatar_url)
  VALUES (NEW.id, v_nickname, v_avatar)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── 욕설·스팸 DB 2차 필터 (트리거) ─────────────────────────────────────────
-- 클라이언트 1차 필터(contentFilter.ts)를 통과해도 DB에서 재검증.
-- 간단한 패턴만 포함. 실무에서는 pg_trgm + 별도 금칙어 테이블로 확장 가능.
CREATE TABLE IF NOT EXISTS public.blocked_words (
  word TEXT PRIMARY KEY
);

-- 기본 금칙어 샘플 삽입 (실제 서비스에서는 더 광범위하게 관리)
INSERT INTO public.blocked_words (word) VALUES
  ('시발'), ('씨발'), ('병신'), ('개새끼'), ('지랄'), ('미친놈'), ('fuck'), ('shit')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.check_review_content()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  bad_word TEXT;
BEGIN
  -- 금칙어 테이블 순회
  SELECT word INTO bad_word
  FROM public.blocked_words
  WHERE position(lower(word) IN lower(NEW.comment)) > 0
  LIMIT 1;

  IF FOUND THEN
    RAISE EXCEPTION 'CONTENT_FILTERED: 부적절한 표현이 포함되어 있습니다.'
      USING ERRCODE = 'P0001';
  END IF;

  -- 반복 문자 스팸 감지 (같은 문자 10회 이상 연속)
  IF NEW.comment ~ '(.)\1{9,}' THEN
    RAISE EXCEPTION 'CONTENT_FILTERED: 스팸으로 감지된 내용이 포함되어 있습니다.'
      USING ERRCODE = 'P0001';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_review_content_filter
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.check_review_content();

-- ─── 신고 누적 알림 트리거 ───────────────────────────────────────────────────
-- 특정 리뷰의 pending 신고가 3건 이상이면 pg_notify 발송.
-- Supabase Realtime 또는 별도 worker가 수신 후 Slack/이메일 알림 처리.
CREATE OR REPLACE FUNCTION public.notify_high_report_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  cnt int;
BEGIN
  SELECT COUNT(*) INTO cnt
  FROM public.reports
  WHERE review_id = NEW.review_id AND status = 'pending';

  IF cnt >= 3 THEN
    PERFORM pg_notify(
      'high_report',
      json_build_object(
        'review_id', NEW.review_id,
        'count',     cnt,
        'ts',        now()
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_high_report
  AFTER INSERT ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_high_report_count();
