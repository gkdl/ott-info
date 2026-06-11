-- ═══════════════════════════════════════════════════════════════════════════
-- 002 · Row Level Security
-- ═══════════════════════════════════════════════════════════════════════════
-- 설계 원칙:
--   · 모든 테이블 RLS 활성화 → 정책 없는 테이블은 기본 거부
--   · anon key가 공개돼도 안전한 구조 (RLS가 방어선)
--   · 차단 유저 필터는 RLS SELECT 정책에 넣지 않고 RPC 함수로 분리
--     (이유: RLS에 blocks 스캔 삽입 시 모든 SELECT마다 full scan 발생,
--      인덱스 활용 어려움, 정책 복잡도↑ → RPC 내부 최적화 쿼리로 처리)

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_likes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocks        ENABLE ROW LEVEL SECURITY;

-- ─── profiles ────────────────────────────────────────────────────────────────
-- 닉네임/아바타는 커뮤니티 표시를 위해 공개 SELECT 허용
-- 본인 행만 수정 가능
CREATE POLICY "profiles: public read"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "profiles: own insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── reviews ─────────────────────────────────────────────────────────────────
-- 숨김 처리된 리뷰는 공개 SELECT에서 제외
CREATE POLICY "reviews: public read (non-hidden)"
  ON public.reviews FOR SELECT
  USING (is_hidden = false);

CREATE POLICY "reviews: own insert"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: own update"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reviews: own delete"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- ─── favorites ───────────────────────────────────────────────────────────────
CREATE POLICY "favorites: own all"
  ON public.favorites FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── review_likes ────────────────────────────────────────────────────────────
-- 좋아요 수 집계·정렬을 위해 SELECT는 전체 허용
-- INSERT/DELETE는 본인만
CREATE POLICY "review_likes: public read"
  ON public.review_likes FOR SELECT
  USING (true);

CREATE POLICY "review_likes: own insert"
  ON public.review_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "review_likes: own delete"
  ON public.review_likes FOR DELETE
  USING (auth.uid() = user_id);

-- ─── reports ─────────────────────────────────────────────────────────────────
-- 본인이 제출한 신고만 조회/생성 가능. 타인 신고 내역 조회 불가
CREATE POLICY "reports: own read"
  ON public.reports FOR SELECT
  USING (auth.uid() = reporter_id);

CREATE POLICY "reports: own insert"
  ON public.reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- ─── blocks ──────────────────────────────────────────────────────────────────
-- 본인 차단 목록만 조회/관리 가능
CREATE POLICY "blocks: own read"
  ON public.blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "blocks: own insert"
  ON public.blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks: own delete"
  ON public.blocks FOR DELETE
  USING (auth.uid() = blocker_id);
