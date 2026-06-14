import type {
  TmdbContent,
  TmdbMovie,
  TmdbTv,
  TmdbMovieDetail,
  TmdbTvDetail,
  MediaType,
} from "@/types/tmdb";

// TMDB 목록 아이템/상세에서 "영화 여부 · 제목 · 미디어 타입"을 뽑는 공통 로직.
// 여러 화면에 흩어져 있던 isMovie/getTitle/getItemInfo/getContentInfo 를 일원화한다.

/** 목록 아이템이 영화인지 판별. media_type 우선, 없으면 fallback, 그래도 없으면 `title` 필드로 추론. */
export function isMovieItem(item: TmdbContent, fallback?: MediaType): boolean {
  if (item.media_type === "movie") return true;
  if (item.media_type === "tv") return false;
  if (fallback) return fallback === "movie";
  return "title" in item;
}

/** 목록 아이템의 표시 제목과 미디어 타입을 함께 반환. */
export function getContentInfo(item: TmdbContent, fallback: MediaType = "movie") {
  const movie = isMovieItem(item, fallback);
  const title = movie ? (item as TmdbMovie).title : (item as TmdbTv).name;
  const mediaType: MediaType = (item.media_type as MediaType) ?? fallback;
  return { title, mediaType, isMovie: movie };
}

/** 상세(detail) 객체가 영화인지 (타입 가드). */
export function isMovieDetail(
  detail: TmdbMovieDetail | TmdbTvDetail
): detail is TmdbMovieDetail {
  return "title" in detail;
}
