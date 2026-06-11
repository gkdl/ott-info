-- ═══════════════════════════════════════════════════════════════════════════
-- 004 · 인덱스
-- ═══════════════════════════════════════════════════════════════════════════
-- 조회 패턴:
--   · 상세 페이지 리뷰 조회 → (content_id, content_type) 필터
--   · 좋아요 순 정렬        → like_count DESC
--   · 최신 순 정렬          → created_at DESC
--   · 평점 순 정렬          → rating DESC / ASC
--   · 마이페이지 즐겨찾기   → user_id 필터
--   · 좋아요 여부 확인      → (user_id, review_id)
--   · 차단 목록 조회        → blocker_id 필터

-- reviews: 상세 페이지 핵심 조회 (콘텐츠별 리뷰 + 숨김 제외)
CREATE INDEX IF NOT EXISTS idx_reviews_content
  ON public.reviews (content_id, content_type, is_hidden, created_at DESC);

-- reviews: 좋아요 순 정렬
CREATE INDEX IF NOT EXISTS idx_reviews_like_count
  ON public.reviews (content_id, content_type, is_hidden, like_count DESC);

-- reviews: 평점 순 정렬
CREATE INDEX IF NOT EXISTS idx_reviews_rating
  ON public.reviews (content_id, content_type, is_hidden, rating DESC);

-- reviews: 커뮤니티 피드 (최근 리뷰 전체 조회)
CREATE INDEX IF NOT EXISTS idx_reviews_created_at
  ON public.reviews (created_at DESC) WHERE is_hidden = false;

-- reviews: 마이페이지 내 리뷰 목록
CREATE INDEX IF NOT EXISTS idx_reviews_user_id
  ON public.reviews (user_id, created_at DESC);

-- favorites: 마이페이지 즐겨찾기 목록
CREATE INDEX IF NOT EXISTS idx_favorites_user_id
  ON public.favorites (user_id, created_at DESC);

-- review_likes: 좋아요 여부 확인 (unique 제약이 이미 인덱스 역할, 추가 선언)
CREATE INDEX IF NOT EXISTS idx_review_likes_user_review
  ON public.review_likes (user_id, review_id);

-- review_likes: 특정 리뷰의 총 좋아요 수 집계 (트리거로 대부분 불필요하지만 보험)
CREATE INDEX IF NOT EXISTS idx_review_likes_review_id
  ON public.review_likes (review_id);

-- blocks: 차단 목록 조회 (blocker 기준)
CREATE INDEX IF NOT EXISTS idx_blocks_blocker_id
  ON public.blocks (blocker_id);

-- reports: 운영자 대시보드 (pending 신고 조회)
CREATE INDEX IF NOT EXISTS idx_reports_status_created
  ON public.reports (status, created_at DESC) WHERE status = 'pending';

-- reports: 특정 리뷰의 신고 수 집계
CREATE INDEX IF NOT EXISTS idx_reports_review_id
  ON public.reports (review_id, status);
