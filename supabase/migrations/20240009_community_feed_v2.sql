-- 커뮤니티 탭용 범용 피드 함수
-- p_sort: 'latest' | 'popular'  (popular = 시간 가중 좋아요 점수)
-- p_content_type: 'all' | 'movie' | 'tv'
CREATE OR REPLACE FUNCTION get_community_feed_v2(
  p_limit        INTEGER,
  p_offset       INTEGER DEFAULT 0,
  p_sort         TEXT    DEFAULT 'latest',
  p_content_type TEXT    DEFAULT 'all'
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
  IF p_sort = 'popular' THEN
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
      AND (p_content_type = 'all' OR r.content_type = p_content_type)
      AND r.user_id NOT IN (
        SELECT blocked_user_id FROM blocks WHERE blocker_id = auth.uid()
      )
    ORDER BY
      (r.like_count::FLOAT / POWER(EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 3600.0 + 2, 1.5)) DESC
    LIMIT  p_limit
    OFFSET p_offset;
  ELSE
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
      AND (p_content_type = 'all' OR r.content_type = p_content_type)
      AND r.user_id NOT IN (
        SELECT blocked_user_id FROM blocks WHERE blocker_id = auth.uid()
      )
    ORDER BY r.created_at DESC
    LIMIT  p_limit
    OFFSET p_offset;
  END IF;
END;
$$;
