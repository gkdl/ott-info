-- ═══════════════════════════════════════════════════════════════════════════
-- 001 · 테이블 스키마
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── profiles ────────────────────────────────────────────────────────────────
-- auth.users(id) → ON DELETE CASCADE
-- 회원탈퇴 시 auth.users 행 삭제만으로 이 테이블도 연쇄 삭제됨
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname        TEXT        NOT NULL,
  avatar_url      TEXT,
  eula_agreed_at  TIMESTAMPTZ,                        -- EULA 동의 시각 (NULL = 미동의)
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── reviews ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reviews (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id    TEXT        NOT NULL,                 -- TMDB ID (문자열)
  content_type  TEXT        NOT NULL CHECK (content_type IN ('movie', 'tv')),
  content_title TEXT        NOT NULL,
  poster_path   TEXT,
  rating        INT         NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment       TEXT        NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 1000),
  like_count    INT         NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  is_hidden     BOOLEAN     NOT NULL DEFAULT false,   -- 운영자 숨김 처리용
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── favorites ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.favorites (
  id            BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_id    TEXT        NOT NULL,
  content_type  TEXT        NOT NULL CHECK (content_type IN ('movie', 'tv')),
  title         TEXT        NOT NULL,
  poster_path   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id, content_type)
);

-- ─── review_likes ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.review_likes (
  id         BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id  BIGINT      NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, review_id)
);

-- ─── reports ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id          BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporter_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  review_id   BIGINT      NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reason      TEXT        NOT NULL,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (reporter_id, review_id)             -- 동일 리뷰 중복 신고 방지
);

-- ─── blocks ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.blocks (
  id              BIGINT      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blocker_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_user_id UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (blocker_id, blocked_user_id),
  CHECK (blocker_id <> blocked_user_id)       -- 자기 자신 차단 방지
);
