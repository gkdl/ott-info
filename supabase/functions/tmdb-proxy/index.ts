import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── Types ────────────────────────────────────────────────────────────────────

type TmdbEndpoint =
  | "trending"
  | "top_rated"
  | "upcoming"
  | "now_playing"
  | "on_the_air"
  | "genre_list"
  | "discover"
  | "discover_by_provider"
  | "detail"
  | "watch_providers"
  | "similar"
  | "search";

type MediaType = "movie" | "tv" | "all";
type TimeWindow = "day" | "week";

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// ─── Rate Limit Store (in-memory, per isolate) ────────────────────────────────
// Supabase Edge Function 인스턴스는 짧게 살아있으므로 과도한 급증 요청을 1차 차단하는 용도.
// 프로덕션에서 정밀한 전역 rate limit이 필요하면 Supabase KV(Redis) 또는 Upstash를 사용.

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT = {
  WINDOW_MS: 60_000,   // 1분 윈도우
  MAX_REQUESTS: 60,    // 유저당 1분 60회
  IP_MAX_REQUESTS: 120 // IP당 1분 120회 (비로그인 IP 폴백용이지만 이 함수는 JWT 필수)
} as const;

function checkRateLimit(key: string, maxRequests: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart > RATE_LIMIT.WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= maxRequests) return false;

  entry.count++;
  return true;
}

// ─── TMDB Request Helper ──────────────────────────────────────────────────────

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = Deno.env.get("TMDB_API_KEY") ?? "";

async function tmdbFetch(path: string, params: Record<string, string> = {}): Promise<Response> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_KEY);
  url.searchParams.set("language", "ko-KR");

  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`TMDB ${res.status}: ${text}`);
  }
  return res;
}

// ─── Endpoint Handlers ────────────────────────────────────────────────────────

async function handleTrending(params: URLSearchParams): Promise<unknown> {
  const mediaType: MediaType = (params.get("media_type") as MediaType) || "all";
  const timeWindow: TimeWindow = (params.get("time_window") as TimeWindow) || "week";

  if (!["movie", "tv", "all"].includes(mediaType)) throw new Error("invalid media_type");
  if (!["day", "week"].includes(timeWindow)) throw new Error("invalid time_window");

  const res = await tmdbFetch(`/trending/${mediaType}/${timeWindow}`, {
    page: params.get("page") || "1",
  });
  return res.json();
}

async function handleTopRated(params: URLSearchParams): Promise<unknown> {
  const mediaType = params.get("media_type") === "tv" ? "tv" : "movie";
  const res = await tmdbFetch(`/${mediaType}/top_rated`, {
    page: params.get("page") || "1",
  });
  return res.json();
}

async function handleUpcoming(params: URLSearchParams): Promise<unknown> {
  // 영화: upcoming / TV: on_the_air
  const mediaType = params.get("media_type") === "tv" ? "tv" : "movie";
  const path = mediaType === "tv" ? "/tv/on_the_air" : "/movie/upcoming";
  const res = await tmdbFetch(path, { page: params.get("page") || "1" });
  return res.json();
}

async function handleNowPlaying(params: URLSearchParams): Promise<unknown> {
  const mediaType = params.get("media_type") === "tv" ? "tv" : "movie";
  const path = mediaType === "tv" ? "/tv/airing_today" : "/movie/now_playing";
  const res = await tmdbFetch(path, { page: params.get("page") || "1" });
  return res.json();
}

async function handleGenreList(params: URLSearchParams): Promise<unknown> {
  const mediaType = params.get("media_type") === "tv" ? "tv" : "movie";
  const res = await tmdbFetch(`/genre/${mediaType}/list`);
  return res.json();
}

async function handleDiscover(params: URLSearchParams): Promise<unknown> {
  const mediaType = params.get("media_type") === "tv" ? "tv" : "movie";
  const genreId = params.get("genre_id");

  if (!genreId || !/^\d+$/.test(genreId)) throw new Error("genre_id is required and must be numeric");

  const res = await tmdbFetch(`/discover/${mediaType}`, {
    with_genres: genreId,
    sort_by: params.get("sort_by") || "popularity.desc",
    page: params.get("page") || "1",
    "vote_count.gte": "50",
  });
  return res.json();
}

async function handleDetail(params: URLSearchParams): Promise<unknown> {
  const mediaType = params.get("media_type") === "tv" ? "tv" : "movie";
  const contentId = params.get("content_id");

  if (!contentId || !/^\d+$/.test(contentId)) throw new Error("content_id is required and must be numeric");

  const res = await tmdbFetch(`/${mediaType}/${contentId}`, {
    append_to_response: "credits,videos",
  });
  return res.json();
}

async function handleWatchProviders(params: URLSearchParams): Promise<unknown> {
  const mediaType = params.get("media_type") === "tv" ? "tv" : "movie";
  const contentId = params.get("content_id");

  if (!contentId || !/^\d+$/.test(contentId)) throw new Error("content_id is required and must be numeric");

  const res = await tmdbFetch(`/${mediaType}/${contentId}/watch/providers`);
  const data = await res.json() as { results?: Record<string, unknown> };

  // KR 지역만 반환하여 페이로드 최소화
  return {
    id: (data as Record<string, unknown>).id,
    results: { KR: data.results?.["KR"] ?? null },
  };
}

async function handleSimilar(params: URLSearchParams): Promise<unknown> {
  const mediaType = params.get("media_type") === "tv" ? "tv" : "movie";
  const contentId = params.get("content_id");

  if (!contentId || !/^\d+$/.test(contentId)) throw new Error("content_id is required and must be numeric");

  const res = await tmdbFetch(`/${mediaType}/${contentId}/recommendations`, {
    page: params.get("page") || "1",
  });
  return res.json();
}

async function handleDiscoverByProvider(params: URLSearchParams): Promise<unknown> {
  const mediaType = params.get("media_type") === "tv" ? "tv" : "movie";
  const providerId = params.get("provider_id");
  const genreId = params.get("genre_id");

  if (!providerId || !/^\d+$/.test(providerId)) throw new Error("provider_id is required and must be numeric");
  if (genreId && !/^\d+$/.test(genreId)) throw new Error("genre_id must be numeric");

  const extraParams: Record<string, string> = {
    watch_region: "KR",
    with_watch_providers: providerId,
    sort_by: params.get("sort_by") || "popularity.desc",
    page: params.get("page") || "1",
    "vote_count.gte": "10",
  };
  if (genreId) extraParams.with_genres = genreId;

  const res = await tmdbFetch(`/discover/${mediaType}`, extraParams);
  return res.json();
}

async function handleSearch(params: URLSearchParams): Promise<unknown> {
  const query = params.get("query");
  if (!query || query.trim().length === 0) throw new Error("query is required");
  if (query.length > 200) throw new Error("query too long");

  const mediaType = params.get("media_type");
  const path = mediaType === "movie"
    ? "/search/movie"
    : mediaType === "tv"
    ? "/search/tv"
    : "/search/multi";

  const res = await tmdbFetch(path, {
    query: query.trim(),
    page: params.get("page") || "1",
    include_adult: "false",
  });
  return res.json();
}

// ─── CORS Headers ─────────────────────────────────────────────────────────────

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request): Promise<Response> => {
  // Preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── 1. JWT 검증 (선택적) ────────────────────────────────────────────────────
  // 공개 엔드포인트(trending, top_rated 등)는 비로그인도 허용.
  // 로그인 상태면 유저 ID 기반 rate limit 적용, 비로그인이면 IP 기반으로만 제한.
  const authHeader = req.headers.get("Authorization");

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  let userId: string | null = null;

  if (authHeader?.startsWith("Bearer ")) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  // ── 2. Rate Limiting ─────────────────────────────────────────────────────────
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (userId && !checkRateLimit(`user:${userId}`, RATE_LIMIT.MAX_REQUESTS)) {
    return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
      status: 429,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    });
  }

  if (!checkRateLimit(`ip:${ip}`, RATE_LIMIT.IP_MAX_REQUESTS)) {
    return new Response(JSON.stringify({ error: "Too many requests from this IP." }), {
      status: 429,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    });
  }

  // ── 3. TMDB_API_KEY 존재 확인 ────────────────────────────────────────────────
  if (!TMDB_KEY) {
    console.error("TMDB_API_KEY secret is not set");
    return new Response(JSON.stringify({ error: "Service configuration error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── 4. 엔드포인트 라우팅 ──────────────────────────────────────────────────────
  const url = new URL(req.url);
  const endpoint = url.searchParams.get("endpoint") as TmdbEndpoint | null;
  const params = url.searchParams;

  if (!endpoint) {
    return new Response(JSON.stringify({ error: "endpoint parameter is required" }), {
      status: 400,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  try {
    let data: unknown;

    switch (endpoint) {
      case "trending":       data = await handleTrending(params); break;
      case "top_rated":      data = await handleTopRated(params); break;
      case "upcoming":       data = await handleUpcoming(params); break;
      case "now_playing":    data = await handleNowPlaying(params); break;
      case "genre_list":     data = await handleGenreList(params); break;
      case "discover":            data = await handleDiscover(params); break;
      case "discover_by_provider": data = await handleDiscoverByProvider(params); break;
      case "similar":              data = await handleSimilar(params); break;
      case "detail":         data = await handleDetail(params); break;
      case "watch_providers":data = await handleWatchProviders(params); break;
      case "search":         data = await handleSearch(params); break;
      default:
        return new Response(JSON.stringify({ error: `Unknown endpoint: ${endpoint}` }), {
          status: 400,
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        ...CORS_HEADERS,
        "Content-Type": "application/json",
        // 트렌딩/Top Rated는 5분, 상세/Watch Providers는 10분 캐시 (CDN 레이어 활용 가능)
        "Cache-Control": ["trending", "top_rated", "genre_list"].includes(endpoint)
          ? "public, max-age=300"
          : "public, max-age=600",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[tmdb-proxy] endpoint=${endpoint} error=${message}`);

    // TMDB 4xx → 클라이언트 에러 그대로 전달, 5xx → 내부 에러
    const status = message.startsWith("TMDB 4") ? 400 : 500;

    return new Response(JSON.stringify({ error: message }), {
      status,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
