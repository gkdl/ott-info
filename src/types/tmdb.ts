// ─── 공통 ─────────────────────────────────────────────────────────────────────

export type MediaType = "movie" | "tv";

export interface TmdbPaginatedResult<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

// ─── 콘텐츠 ──────────────────────────────────────────────────────────────────

export interface TmdbMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: "movie";
}

export interface TmdbTv {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: "tv";
}

export type TmdbContent = TmdbMovie | TmdbTv;

export interface TmdbMultiResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  // movie fields
  title?: string;
  original_title?: string;
  release_date?: string;
  // tv fields
  name?: string;
  original_name?: string;
  first_air_date?: string;
  // shared fields
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
}

// ─── 상세 ─────────────────────────────────────────────────────────────────────

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbMovieDetail extends TmdbMovie {
  genres: TmdbGenre[];
  runtime: number | null;
  tagline: string;
  status: string;
}

export interface TmdbTvDetail extends TmdbTv {
  genres: TmdbGenre[];
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  status: string;
}

export type TmdbDetail = TmdbMovieDetail | TmdbTvDetail;

// ─── Watch Providers ──────────────────────────────────────────────────────────

export interface TmdbProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string;
  display_priority: number;
}

export interface TmdbWatchRegion {
  link: string;           // JustWatch 딥링크 or OTT 웹 URL
  flatrate?: TmdbProvider[];
  rent?: TmdbProvider[];
  buy?: TmdbProvider[];
  free?: TmdbProvider[];
}

export interface TmdbWatchProvidersResult {
  id: number;
  results: {
    KR?: TmdbWatchRegion;
  };
}

// ─── 장르 ─────────────────────────────────────────────────────────────────────

export interface TmdbGenreListResult {
  genres: TmdbGenre[];
}

// ─── Edge Function 에러 응답 ──────────────────────────────────────────────────

export interface TmdbProxyError {
  error: string;
}
