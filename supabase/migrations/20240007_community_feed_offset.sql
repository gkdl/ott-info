-- get_community_feed_excluding_blocked에 p_offset 파라미터 추가
CREATE OR REPLACE FUNCTION get_community_feed_excluding_blocked(
  p_limit  INTEGER,
  p_offset INTEGER DEFAULT 0
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
  LIMIT  p_limit
  OFFSET p_offset;
END;
$$;
