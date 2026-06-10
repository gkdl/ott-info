import { supabase } from "@/lib/supabase";
import type { FavoriteItem, InsertDto } from "@/types/database";
import { PAGE_SIZE } from "./review";

// ─── 즐겨찾기 토글 ────────────────────────────────────────────────────────────

export interface ToggleFavoriteInput {
  userId: string;
  contentId: string;
  contentType: "movie" | "tv";
  title: string;
  posterPath: string | null;
}

export type ToggleFavoriteResult = "added" | "removed";

export async function toggleFavorite(
  input: ToggleFavoriteInput
): Promise<ToggleFavoriteResult> {
  // 현재 즐겨찾기 여부 확인
  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", input.userId)
    .eq("content_id", input.contentId)
    .eq("content_type", input.contentType)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return "removed";
  }

  const payload: InsertDto<"favorites"> = {
    user_id: input.userId,
    content_id: input.contentId,
    content_type: input.contentType,
    title: input.title,
    poster_path: input.posterPath,
  };

  const { error } = await supabase.from("favorites").insert(payload);
  // (user_id, content_id, content_type) unique 제약으로 중복 방지
  if (error && error.code !== "23505") throw new Error(error.message);
  return "added";
}

// ─── 즐겨찾기 여부 단건 확인 ─────────────────────────────────────────────────

export async function isFavorited(
  userId: string,
  contentId: string,
  contentType: "movie" | "tv"
): Promise<boolean> {
  const { data } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", userId)
    .eq("content_id", contentId)
    .eq("content_type", contentType)
    .maybeSingle();

  return !!data;
}

// ─── 즐겨찾기 목록 조회 (마이페이지) ────────────────────────────────────────

export async function fetchFavorites(
  userId: string,
  page: number
): Promise<FavoriteItem[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (error) throw new Error(error.message);
  return data ?? [];
}
