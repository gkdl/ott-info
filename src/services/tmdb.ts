import { supabase } from "@/lib/supabase";
import type {
  MediaType,
  TmdbPaginatedResult,
  TmdbContent,
  TmdbMultiResult,
  TmdbDetail,
  TmdbWatchProvidersResult,
  TmdbGenreListResult,
} from "@/types/tmdb";

// ─── 내부 헬퍼 ────────────────────────────────────────────────────────────────

async function callProxy<T>(params: Record<string, string>): Promise<T> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;

  if (!token) throw new Error("로그인이 필요합니다.");

  const qs = new URLSearchParams(params).toString();
  const { data, error } = await supabase.functions.invoke<T>(
    `tmdb-proxy?${qs}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (error) throw new Error(error.message);
  if (!data) throw new Error("응답 데이터가 없습니다.");

  return data;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export const tmdbService = {
  /** 트렌딩 (홈 화면 히어로 배너 + 트렌딩 섹션) */
  getTrending(
    mediaType: MediaType | "all" = "all",
    timeWindow: "day" | "week" = "week",
    page = 1
  ) {
    return callProxy<TmdbPaginatedResult<TmdbContent>>({
      endpoint: "trending",
      media_type: mediaType,
      time_window: timeWindow,
      page: String(page),
    });
  },

  /** Top Rated (명작 섹션) */
  getTopRated(mediaType: MediaType = "movie", page = 1) {
    return callProxy<TmdbPaginatedResult<TmdbContent>>({
      endpoint: "top_rated",
      media_type: mediaType,
      page: String(page),
    });
  },

  /** 개봉 예정 / 방영 중 (Upcoming 섹션) */
  getUpcoming(mediaType: MediaType = "movie", page = 1) {
    return callProxy<TmdbPaginatedResult<TmdbContent>>({
      endpoint: "upcoming",
      media_type: mediaType,
      page: String(page),
    });
  },

  /** 현재 상영 중 / 오늘 방영 */
  getNowPlaying(mediaType: MediaType = "movie", page = 1) {
    return callProxy<TmdbPaginatedResult<TmdbContent>>({
      endpoint: "now_playing",
      media_type: mediaType,
      page: String(page),
    });
  },

  /** 장르 목록 */
  getGenreList(mediaType: MediaType = "movie") {
    return callProxy<TmdbGenreListResult>({
      endpoint: "genre_list",
      media_type: mediaType,
    });
  },

  /** 장르별 큐레이션 (홈 Genre Row) */
  discoverByGenre(
    mediaType: MediaType = "movie",
    genreId: number,
    page = 1
  ) {
    return callProxy<TmdbPaginatedResult<TmdbContent>>({
      endpoint: "discover",
      media_type: mediaType,
      genre_id: String(genreId),
      page: String(page),
    });
  },

  /** 홈 카테고리 행 (예능/애니/다큐/키즈) — 장르 + 한국/일본 등 추가 필터 */
  discoverCategory(
    mediaType: MediaType,
    genreId: number,
    extraParams: Record<string, string> = {},
    page = 1
  ) {
    return callProxy<TmdbPaginatedResult<TmdbContent>>({
      endpoint: "discover",
      media_type: mediaType,
      genre_id: String(genreId),
      page: String(page),
      ...extraParams,
    });
  },

  /** 상세 정보 */
  getDetail(mediaType: MediaType, contentId: number) {
    return callProxy<TmdbDetail>({
      endpoint: "detail",
      media_type: mediaType,
      content_id: String(contentId),
    });
  },

  /** KR Watch Providers (OTT 딥링크용) */
  getWatchProviders(mediaType: MediaType, contentId: number) {
    return callProxy<TmdbWatchProvidersResult>({
      endpoint: "watch_providers",
      media_type: mediaType,
      content_id: String(contentId),
    });
  },

  /** 비슷한 콘텐츠 추천 */
  getSimilar(mediaType: MediaType, contentId: number, page = 1) {
    return callProxy<TmdbPaginatedResult<TmdbContent>>({
      endpoint: "similar",
      media_type: mediaType,
      content_id: String(contentId),
      page: String(page),
    });
  },

  /** OTT 프로바이더별 콘텐츠 탐색 (KR Watch Provider + 선택적 장르 필터) */
  discoverByProvider(
    mediaType: MediaType = "movie",
    providerId: number,
    genreId?: number,
    page = 1
  ) {
    return callProxy<TmdbPaginatedResult<TmdbContent>>({
      endpoint: "discover_by_provider",
      media_type: mediaType,
      provider_id: String(providerId),
      ...(genreId ? { genre_id: String(genreId) } : {}),
      page: String(page),
    });
  },

  /** 통합 검색 */
  search(
    query: string,
    mediaType?: MediaType,
    page = 1
  ) {
    return callProxy<TmdbPaginatedResult<TmdbMultiResult>>({
      endpoint: "search",
      query,
      ...(mediaType ? { media_type: mediaType } : {}),
      page: String(page),
    });
  },
};
