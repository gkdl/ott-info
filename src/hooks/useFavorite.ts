import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  toggleFavorite,
  isFavorited,
  fetchFavorites,
  PAGE_SIZE,
  type ToggleFavoriteInput,
} from "@/services/favorite";
import { useCurrentUser } from "@/store/authStore";

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const favoriteKeys = {
  status: (userId: string, contentId: string, contentType: string) =>
    ["favorites", "status", userId, contentId, contentType] as const,
  list: (userId: string) => ["favorites", "list", userId] as const,
};

// ─── 즐겨찾기 단건 상태 ───────────────────────────────────────────────────────

export function useFavoriteStatus(
  contentId: string,
  contentType: "movie" | "tv"
) {
  const user = useCurrentUser();

  return useQuery({
    queryKey: favoriteKeys.status(user?.id ?? "", contentId, contentType),
    queryFn: () => isFavorited(user!.id, contentId, contentType),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── 즐겨찾기 토글 (낙관적 업데이트) ────────────────────────────────────────

export function useFavoriteToggle(
  contentId: string,
  contentType: "movie" | "tv"
) {
  const queryClient = useQueryClient();
  const user = useCurrentUser();

  return useMutation({
    mutationFn: (input: ToggleFavoriteInput) => toggleFavorite(input),

    onMutate: async () => {
      if (!user) return;
      const queryKey = favoriteKeys.status(user.id, contentId, contentType);
      await queryClient.cancelQueries({ queryKey });

      const previousStatus = queryClient.getQueryData<boolean>(queryKey);

      // 낙관적으로 상태 즉시 반전
      queryClient.setQueryData(queryKey, !previousStatus);

      return { queryKey, previousStatus };
    },

    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(context.queryKey, context.previousStatus);
      }
    },

    onSettled: () => {
      if (!user) return;
      // 상태 및 목록 모두 갱신
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.status(user.id, contentId, contentType),
      });
      queryClient.invalidateQueries({
        queryKey: favoriteKeys.list(user.id),
      });
    },
  });
}

// ─── 즐겨찾기 목록 (마이페이지, 무한 스크롤) ────────────────────────────────

export function useFavoriteList() {
  const user = useCurrentUser();

  return useInfiniteQuery({
    queryKey: favoriteKeys.list(user?.id ?? ""),
    queryFn: ({ pageParam = 1 }) =>
      fetchFavorites(user!.id, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.length + 1 : undefined,
    enabled: !!user,
  });
}
