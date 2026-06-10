// Supabase DB 행 타입 — supabase gen types typescript 로 자동 생성 후 이 파일로 교체 가능.
// 현재는 사양서의 스키마를 수동 정의.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;              // UUID, FK → auth.users
          nickname: string;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          nickname?: string;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };

      reviews: {
        Row: {
          id: number;
          user_id: string;         // FK → profiles.id
          content_id: string;      // TMDB ID (문자열)
          content_type: "movie" | "tv";
          content_title: string;
          poster_path: string | null;
          rating: number;          // 1~5 CHECK
          comment: string;         // 최대 1000자 CHECK
          like_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
          content_type: "movie" | "tv";
          content_title: string;
          poster_path?: string | null;
          rating: number;
          comment: string;
          like_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          rating?: number;
          comment?: string;
          updated_at?: string;
        };
      };

      favorites: {
        Row: {
          id: number;
          user_id: string;         // FK → profiles.id
          content_id: string;
          content_type: "movie" | "tv";
          title: string;
          poster_path: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          content_id: string;
          content_type: "movie" | "tv";
          title: string;
          poster_path?: string | null;
          created_at?: string;
        };
        Update: never;
      };

      review_likes: {
        Row: {
          id: number;
          user_id: string;         // FK → profiles.id
          review_id: number;       // FK → reviews.id
          created_at: string;
        };
        Insert: {
          user_id: string;
          review_id: number;
          created_at?: string;
        };
        Update: never;
      };

      reports: {
        Row: {
          id: number;
          reporter_id: string;     // FK → profiles.id
          review_id: number;       // FK → reviews.id
          reason: string;
          status: "pending" | "reviewed" | "dismissed";
          created_at: string;
        };
        Insert: {
          reporter_id: string;
          review_id: number;
          reason: string;
          status?: "pending" | "reviewed" | "dismissed";
          created_at?: string;
        };
        Update: {
          status?: "pending" | "reviewed" | "dismissed";
        };
      };

      blocks: {
        Row: {
          id: number;
          blocker_id: string;      // FK → profiles.id
          blocked_user_id: string; // FK → profiles.id
          created_at: string;
        };
        Insert: {
          blocker_id: string;
          blocked_user_id: string;
          created_at?: string;
        };
        Update: never;
      };
    };

    Views: Record<string, never>;

    Functions: {
      get_reviews_excluding_blocked: {
        Args: {
          p_content_id: string;
          p_content_type: string;
          p_sort: "latest" | "likes" | "rating_high" | "rating_low";
          p_limit: number;
          p_offset: number;
        };
        Returns: Array<
          Database["public"]["Tables"]["reviews"]["Row"] & {
            profile: Pick<
              Database["public"]["Tables"]["profiles"]["Row"],
              "nickname" | "avatar_url"
            >;
            is_liked_by_me: boolean;
          }
        >;
      };

      get_community_feed_excluding_blocked: {
        Args: { p_limit: number };
        Returns: Array<
          Database["public"]["Tables"]["reviews"]["Row"] & {
            profile: Pick<
              Database["public"]["Tables"]["profiles"]["Row"],
              "nickname" | "avatar_url"
            >;
          }
        >;
      };
    };

    Enums: Record<string, never>;
  };
}

// ─── 편의 타입 ────────────────────────────────────────────────────────────────

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateDto<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type RpcResult<T extends keyof Database["public"]["Functions"]> =
  Database["public"]["Functions"][T]["Returns"];

// ─── 도메인 복합 타입 ─────────────────────────────────────────────────────────

export type ReviewWithProfile = Tables<"reviews"> & {
  profile: Pick<Tables<"profiles">, "nickname" | "avatar_url">;
  is_liked_by_me: boolean;
};

export type FavoriteItem = Tables<"favorites">;
