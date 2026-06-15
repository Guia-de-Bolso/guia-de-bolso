import { NextResponse } from "next/server";
import { lugaresApiCacheHeaders } from "@/lib/apiCacheHeaders";
import { reportError } from "@/lib/observability";
import { getAnonServerClient } from "@/lib/supabaseAnonServer";
import { buildApiErrorBody } from "@/lib/userMessages";

function jsonCached(body, status = 200) {
  return NextResponse.json(body, { status, headers: lugaresApiCacheHeaders() });
}

/**
 * GET /api/atrativos — leitura pública de atrativos ativos (RLS anon).
 */
export async function GET(request) {
  const supabase = getAnonServerClient();
  if (!supabase) {
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);

  const { data, error } = await supabase
    .from("rotas")
    .select("*")
    .eq("ativa", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    reportError(error, { route: "GET /api/atrativos", detail: error.message });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }

  return jsonCached({ atrativos: data ?? [] });
}
