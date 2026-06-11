import { createClient } from "jsr:@supabase/supabase-js@2";

// ─── 환경변수 ─────────────────────────────────────────────────────────────────
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 는 Edge Function 배포 시
// supabase secrets set 으로 등록. 절대 클라이언트 번들에 포함 금지.

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── 1. 요청자 JWT 검증 ────────────────────────────────────────────────────
  // anon key 클라이언트로 토큰을 검증하여 실제 로그인된 유저인지 확인.
  // 검증 통과 후에만 service_role 클라이언트를 생성하여 삭제 수행.
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Missing authorization token" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const anonClient = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await anonClient.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
      status: 401,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  // ── 2. service_role 클라이언트로 유저 삭제 ───────────────────────────────
  // auth.admin.deleteUser 는 service_role 권한에서만 호출 가능.
  //
  // 삭제 연쇄 흐름 (ON DELETE CASCADE 설계):
  //   auth.users 행 삭제
  //   → profiles (FK: profiles.id → auth.users(id) ON DELETE CASCADE)
  //   → reviews, favorites, review_likes (FK: user_id → profiles.id ON DELETE CASCADE)
  //   → reports (FK: reporter_id → profiles.id ON DELETE CASCADE)
  //   → blocks  (FK: blocker_id / blocked_user_id → profiles.id ON DELETE CASCADE)
  //
  // 결과: auth.users 1행 삭제만으로 해당 유저의 모든 데이터가 DB에서 제거됨.

  if (!serviceRoleKey) {
    console.error("SUPABASE_SERVICE_ROLE_KEY secret is not set");
    return new Response(JSON.stringify({ error: "Service configuration error" }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

  if (deleteError) {
    console.error(`[delete-account] userId=${user.id} error=${deleteError.message}`);
    return new Response(JSON.stringify({ error: "계정 삭제에 실패했습니다." }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }

  console.log(`[delete-account] userId=${user.id} deleted successfully`);

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
});
