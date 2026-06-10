import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { tmdbService } from "@/services/tmdb";
import type { MediaType } from "@/types/tmdb";

export const tmdbKeys = {
  trending: (mediaType: string, timeWindow: string) =>
    ["tmdb", "trending", mediaType, timeWindow] as const,
  topRated: (mediaType: string) => ["tmdb", "top_rated", mediaType] as const,
  upcoming: (mediaType: string) => ["tmdb", "upcoming", mediaType] as const,
  nowPlaying: (mediaType: string) => ["tmdb", "now_playing", mediaType] as const,
  genreList: (mediaType: string) => ["tmdb", "genre_list", mediaType] as const,
  discover: (mediaType: string, genreId: number) =>
    ["tmdb", "discover", mediaType, genreId] as const,
  detail: (mediaType: string, contentId: number) =>
    ["tmdb", "detail", mediaType, contentId] as const,
  watchProviders: (mediaType: string, contentId: number) =>
    ["tmdb", "watch_providers", mediaType, contentId] as const,
  search: (query: string, mediaType?: string) =>
    ["tmdb", "search", query, mediaType ?? "multi"] as const,
};

export function useTrending(
  mediaType: MediaType | "all" = "all",
  timeWindow: "day" | "week" = "week"
) {
  return useQuery({
    queryKey: tmdbKeys.trending(mediaType, timeWindow),
    queryFn: () => tmdbService.getTrending(mediaType, timeWindow),
    staleTime: 5 * 60 * 1000,
  });
}

export function useTopRated(mediaType: MediaType = "movie") {
  return useQuery({
    queryKey: tmdbKeys.topRated(mediaType),
    queryFn: () => tmdbService.getTopRated(mediaType),
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpcoming(mediaType: MediaType = "movie") {
  return useQuery({
    queryKey: tmdbKeys.upcoming(mediaType),
    queryFn: () => tmdbService.getUpcoming(mediaType),
    staleTime: 10 * 60 * 1000,
  });
}

export function useNowPlaying(mediaType: MediaType = "movie") {
  return useQuery({
    queryKey: tmdbKeys.nowPlaying(mediaType),
    queryFn: () => tmdbService.getNowPlaying(mediaType),
    staleTime: 5 * 60 * 1000,
  });
}

export function useGenreList(mediaType: MediaType = "movie") {
  return useQuery({
    queryKey: tmdbKeys.genreList(mediaType),
    queryFn: () => tmdbService.getGenreList(mediaType),
    staleTime: 60 * 60 * 1000, // 장르 목록은 거의 안 바뀜
  });
}

export function useDiscoverByGenre(mediaType: MediaType, genreId: number) {
  return useQuery({
    queryKey: tmdbKeys.discover(mediaType, genreId),
    queryFn: () => tmdbService.discoverByGenre(mediaType, genreId),
    enabled: genreId > 0,
    staleTime: 10 * 60 * 1000,
  });
}

export function useContentDetail(mediaType: MediaType, contentId: number) {
  return useQuery({
    queryKey: tmdbKeys.detail(mediaType, contentId),
    queryFn: () => tmdbService.getDetail(mediaType, contentId),
    enabled: contentId > 0,
    staleTime: 15 * 60 * 1000,
  });
}

export function useWatchProviders(mediaType: MediaType, contentId: number) {
  return useQuery({
    queryKey: tmdbKeys.watchProviders(mediaType, contentId),
    queryFn: () => tmdbService.getWatchProviders(mediaType, contentId),
    enabled: contentId > 0,
    staleTime: 60 * 60 * 1000,
  });
}

export function useSearch(query: string, mediaType?: MediaType) {
  return useInfiniteQuery({
    queryKey: tmdbKeys.search(query, mediaType),
    queryFn: ({ pageParam = 1 }) =>
      tmdbService.search(query, mediaType, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page < last.total_pages ? last.page + 1 : undefined,
    enabled: query.trim().length >= 2,
    staleTime: 2 * 60 * 1000,
  });
}
