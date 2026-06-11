-- ─── 답글(대댓글) 지원 ────────────────────────────────────────────────────────

-- 1. reviews 테이블에 parent_id / reply_count 추가
ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES reviews(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reply_count INTEGER NOT NULL DEFAULT 0;

-- 2. rating CHECK 완화: 답글(parent_id IS NOT NULL)은 별점 불필요
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_rating_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_rating_check
  CHECK (parent_id IS NOT NULL OR (rating >= 1 AND rating <= 5));

-- 3. 답글 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_reviews_parent_id
  ON reviews(parent_id) WHERE parent_id IS NOT NULL;

-- 4. reply_count 자동 증감 트리거
CREATE OR REPLACE FUNCTION update_review_reply_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_id IS NOT NULL THEN
    UPDATE reviews SET reply_count = reply_count + 1 WHERE id = NEW.parent_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_id IS NOT NULL THEN
    UPDATE reviews SET reply_count = GREATEST(reply_count - 1, 0) WHERE id = OLD.parent_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_reply_count ON reviews;
CREATE TRIGGER trg_update_reply_count
AFTER INSERT OR DELETE ON reviews
FOR EACH ROW EXECUTE FUNCTION update_review_reply_count();

-- 5. 기존 get_reviews_excluding_blocked RPC — 최상위 리뷰만 반환하도록 수정
CREATE OR REPLACE FUNCTION get_reviews_excluding_blocked(
  p_content_id   TEXT,
  p_content_type TEXT,
  p_sort         TEXT,
  p_limit        INTEGER,
  p_offset       INTEGER
)
RETURNS TABLE (
  id             BIGINT,
  user_id        UUID,
  content_id     TEXT,
  content_type   TEXT,
  content_title  TEXT,
  poster_path    TEXT,
  rating         INTEGER,
  comment        TEXT,
  like_count     INTEGER,
  reply_count    INTEGER,
  parent_id      BIGINT,
  is_hidden      BOOLEAN,
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ,
  profile        JSON,
  is_liked_by_me BOOLEAN
)
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id, r.user_id, r.content_id, r.content_type,
    r.content_title, r.poster_path, r.rating, r.comment,
    r.like_count, r.reply_count, r.parent_id, r.is_hidden,
    r.created_at, r.updated_at,
    json_build_object('nickname', p.nickname, 'avatar_url', p.avatar_url) AS profile,
    EXISTS (
      SELECT 1 FROM review_likes rl
      WHERE rl.review_id = r.id AND rl.user_id = auth.uid()
    ) AS is_liked_by_me
  FROM reviews r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.content_id     = p_content_id
    AND r.content_type   = p_content_type
    AND r.is_hidden       = false
    AND r.parent_id      IS NULL                          -- 최상위 리뷰만
    AND r.user_id NOT IN (
      SELECT blocked_user_id FROM blocks WHERE blocker_id = auth.uid()
    )
  ORDER BY
    CASE WHEN p_sort = 'latest'      THEN r.created_at END DESC,
    CASE WHEN p_sort = 'likes'       THEN r.like_count END DESC,
    CASE WHEN p_sort = 'rating_high' THEN r.rating     END DESC,
    CASE WHEN p_sort = 'rating_low'  THEN r.rating     END ASC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;

-- 6. 기존 커뮤니티 피드 RPC — reply_count 컬럼 추가
CREATE OR REPLACE FUNCTION get_community_feed_excluding_blocked(
  p_limit INTEGER
)
RETURNS TABLE (
  id             BIGINT,
  user_id        UUID,
  content_id     TEXT,
  content_type   TEXT,
  content_title  TEXT,
  poster_path    TEXT,
  rating         INTEGER,
  comment        TEXT,
  like_count     INTEGER,
  reply_count    INTEGER,
  parent_id      BIGINT,
  is_hidden      BOOLEAN,
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ,
  profile        JSON
)
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id, r.user_id, r.content_id, r.content_type,
    r.content_title, r.poster_path, r.rating, r.comment,
    r.like_count, r.reply_count, r.parent_id, r.is_hidden,
    r.created_at, r.updated_at,
    json_build_object('nickname', p.nickname, 'avatar_url', p.avatar_url) AS profile
  FROM reviews r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.is_hidden  = false
    AND r.parent_id IS NULL
    AND r.user_id NOT IN (
      SELECT blocked_user_id FROM blocks WHERE blocker_id = auth.uid()
    )
  ORDER BY r.created_at DESC
  LIMIT p_limit;
END;
$$;

-- 7. 답글 조회 함수 (차단 유저 제외)
CREATE OR REPLACE FUNCTION get_replies_excluding_blocked(
  p_review_id BIGINT
)
RETURNS TABLE (
  id             BIGINT,
  user_id        UUID,
  content_id     TEXT,
  content_type   TEXT,
  content_title  TEXT,
  poster_path    TEXT,
  rating         INTEGER,
  comment        TEXT,
  like_count     INTEGER,
  reply_count    INTEGER,
  parent_id      BIGINT,
  is_hidden      BOOLEAN,
  created_at     TIMESTAMPTZ,
  updated_at     TIMESTAMPTZ,
  profile        JSON,
  is_liked_by_me BOOLEAN
)
SECURITY DEFINER
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id, r.user_id, r.content_id, r.content_type,
    r.content_title, r.poster_path, r.rating, r.comment,
    r.like_count, r.reply_count, r.parent_id, r.is_hidden,
    r.created_at, r.updated_at,
    json_build_object('nickname', p.nickname, 'avatar_url', p.avatar_url) AS profile,
    EXISTS (
      SELECT 1 FROM review_likes rl
      WHERE rl.review_id = r.id AND rl.user_id = auth.uid()
    ) AS is_liked_by_me
  FROM reviews r
  JOIN profiles p ON p.id = r.user_id
  WHERE r.parent_id = p_review_id
    AND r.is_hidden  = false
    AND r.user_id NOT IN (
      SELECT blocked_user_id FROM blocks WHERE blocker_id = auth.uid()
    )
  ORDER BY r.created_at ASC;
END;
$$;
