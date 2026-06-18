-- 커뮤니티 "인기(지금 뜨는)" 피드 RPC
-- 점수 = (좋아요 + 답글) / (작성 후 경과시간 + 2)^1.5  (Hacker News 식 시간감쇠)
--   → 참여(좋아요·답글)가 많을수록 ↑, 오래될수록 ↓ ⇒ "지금 뜨는 리뷰".
-- 점수 기반 정렬이라 안정적 페이지네이션을 위해 서버측(RPC)에서 계산한다.
-- 차단 유저 제외는 SECURITY DEFINER + auth.uid()로 서버에서 처리.
-- p_content_type: NULL = 전체, 'movie' | 'tv' = 타입 필터.

CREATE OR REPLACE FUNCTION get_community_hot_feed(
  p_content_type TEXT    DEFAULT NULL,
  p_limit        INTEGER DEFAULT 10,
  p_offset       INTEGER DEFAULT 0
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
    AND (p_content_type IS NULL OR r.content_type = p_content_type)
    AND r.user_id NOT IN (
      SELECT blocked_user_id FROM blocks WHERE blocker_id = auth.uid()
    )
  ORDER BY
    (r.like_count + r.reply_count)::numeric
      / power((EXTRACT(EPOCH FROM (now() - r.created_at)) / 3600.0) + 2, 1.5) DESC,
    r.created_at DESC
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;
