import { NextResponse } from "next/server";
import { lugaresApiCacheHeaders } from "@/lib/apiCacheHeaders";
import {
  queryLugaresAtivos,
  queryLugaresByIds,
  queryLugaresForCategoria,
} from "@/lib/lugaresQuery";
import { fetchLugaresPopularesForClient } from "@/lib/lugaresPopulares";
import { reportError } from "@/lib/observability";
import { getAnonServerClient } from "@/lib/supabaseAnonServer";
import { normalizeLugaresTaxonomia } from "@/lib/lugarTaxonomia";
import { buildApiErrorBody } from "@/lib/userMessages";

function jsonCached(body, status = 200) {
  return NextResponse.json(body, { status, headers: lugaresApiCacheHeaders() });
}

/**
 * GET /api/lugares — leitura pública de lugares ativos (role anon no servidor).
 * Query: limit, categoria, ids (csv), mode=populares|parceiros|curadoria
 */
export async function GET(request) {
  const supabase = getAnonServerClient();
  if (!supabase) {
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");

  if (mode === "parceiros" || mode === "curadoria") {
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
    const eq =
      mode === "parceiros"
        ? { eh_parceiro: true }
        : { conteudo_curadoria: true };
    const { data, error } = await queryLugaresAtivos(supabase, { limit, eq });
    if (error) {
      reportError(error, { route: `GET /api/lugares?mode=${mode}` });
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }
    return jsonCached({ lugares: normalizeLugaresTaxonomia(data) });
  }

  if (mode === "populares") {
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 8, 1), 50);
    try {
      const lugares = await fetchLugaresPopularesForClient(supabase, limit);
      return jsonCached({ lugares: normalizeLugaresTaxonomia(lugares) });
    } catch (err) {
      reportError(err, { route: "GET /api/lugares?mode=populares" });
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }
  }

  const idsParam = searchParams.get("ids");
  if (idsParam) {
    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    const { data, error } = await queryLugaresByIds(supabase, ids);
    if (error) {
      reportError(error, { route: "GET /api/lugares?ids" });
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }
    return jsonCached({ lugares: normalizeLugaresTaxonomia(data) });
  }

  const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 50, 1), 100);
  const categoria = searchParams.get("categoria")?.trim();

  if (categoria) {
    const { data, error } = await queryLugaresForCategoria(supabase, categoria, limit);

    if (error) {
      reportError(error, { route: "GET /api/lugares" });
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    return jsonCached({ lugares: data });
  }

  const { data, error } = await queryLugaresAtivos(supabase, { limit });

  if (error) {
    reportError(error, { route: "GET /api/lugares" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }

  return jsonCached({ lugares: normalizeLugaresTaxonomia(data) });
}
