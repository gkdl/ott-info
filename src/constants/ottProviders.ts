import type { MediaType } from "@/types/tmdb";

export interface OttProvider {
  id: number;
  name: string;
  color: string;
  textColor: string;
}

// id 는 TMDB watch provider ID (deeplink.ts 와 동일하게 유지할 것)
export const OTT_PROVIDERS: OttProvider[] = [
  { id: 8,   name: "Netflix",      color: "#E50914", textColor: "#fff" },
  { id: 337, name: "Disney+",      color: "#113CCF", textColor: "#fff" },
  { id: 356, name: "Wavve",        color: "#0F4BBE", textColor: "#fff" },
  { id: 1883, name: "TVING",       color: "#FF153C", textColor: "#fff" },
  { id: 97,  name: "Watcha",       color: "#FF0558", textColor: "#fff" },
  { id: 1881, name: "쿠팡플레이",   color: "#D7263D", textColor: "#fff" },
  { id: 119, name: "Prime Video",  color: "#00A8E1", textColor: "#fff" },
  { id: 350, name: "Apple TV+",    color: "#000000", textColor: "#fff" },
];

export interface GenreOption {
  id: number;
  name: string;
}

// TMDB 공식 장르 ID. 브라우즈의 세부 장르 칩에 사용.
export const GENRE_OPTIONS: Record<MediaType, GenreOption[]> = {
  movie: [
    { id: 0,     name: "전체" },
    { id: 28,    name: "액션" },
    { id: 12,    name: "어드벤처" },
    { id: 16,    name: "애니메이션" },
    { id: 35,    name: "코미디" },
    { id: 80,    name: "범죄" },
    { id: 99,    name: "다큐멘터리" },
    { id: 18,    name: "드라마" },
    { id: 10751, name: "가족" },
    { id: 14,    name: "판타지" },
    { id: 36,    name: "역사" },
    { id: 27,    name: "공포" },
    { id: 10402, name: "음악" },
    { id: 9648,  name: "미스터리" },
    { id: 10749, name: "로맨스" },
    { id: 878,   name: "SF" },
    { id: 53,    name: "스릴러" },
    { id: 10752, name: "전쟁" },
    { id: 37,    name: "서부" },
  ],
  // 드라마 카테고리의 세부 장르 (예능/애니/다큐/키즈는 상위 카테고리로 분리)
  tv: [
    { id: 0,     name: "전체" },
    { id: 10759, name: "액션/모험" },
    { id: 35,    name: "코미디" },
    { id: 80,    name: "범죄" },
    { id: 18,    name: "드라마" },
    { id: 10751, name: "가족" },
    { id: 9648,  name: "미스터리" },
    { id: 10765, name: "SF/판타지" },
    { id: 10768, name: "전쟁/정치" },
    { id: 37,    name: "서부" },
  ],
};

// ─── 콘텐츠 카테고리 (탐색 상위 탭 + 홈 카테고리 행) ──────────────────────────
// TMDB는 타입이 movie/tv 둘뿐이라, 예능·애니·다큐·키즈는 (mediaType + 장르)로 매핑한다.
export interface ContentCategory {
  key: string;
  label: string;
  emoji: string;
  mediaType: MediaType;
  /** 고정 장르 ID. 없으면(영화·드라마) 세부 장르 칩으로 추가 필터링 */
  genreId?: number;
  /** 홈 카테고리 행 디스커버용 추가 필터 (예: 한국 예능, 일본 애니) */
  homeFilters?: Record<string, string>;
}

export const CONTENT_CATEGORIES: ContentCategory[] = [
  { key: "movie",   label: "영화",  emoji: "🎬", mediaType: "movie" },
  { key: "drama",   label: "드라마", emoji: "📺", mediaType: "tv" },
  { key: "variety", label: "예능",  emoji: "🎤", mediaType: "tv",    genreId: 10764, homeFilters: { with_origin_country: "KR", vote_count_gte: "0" } },
  { key: "anime",   label: "애니",  emoji: "🍿", mediaType: "tv",    genreId: 16,    homeFilters: { with_original_language: "ja", vote_count_gte: "50" } },
  { key: "docu",    label: "다큐",  emoji: "🎞", mediaType: "movie", genreId: 99,    homeFilters: { watch_region: "KR", with_watch_monetization_types: "flatrate", vote_count_gte: "10" } },
  { key: "kids",    label: "키즈",  emoji: "🧒", mediaType: "tv",    genreId: 10762, homeFilters: { watch_region: "KR", with_watch_monetization_types: "flatrate", vote_count_gte: "0" } },
];

// 홈에 별도 행으로 노출할 카테고리 키 (영화·드라마는 기존 홈 섹션이 이미 커버)
export const HOME_CATEGORY_KEYS = ["variety", "anime", "docu", "kids"] as const;
