import { NextResponse } from "next/server";
import { FILTRO_STATUS_BUSCA } from "@/lib/busca";
import { filterLugaresForPlano, getPlanoRapidoById } from "@/lib/planosRapidos";
import { enrichLugarFlags } from "@/lib/lugarBadges";
import { getAuthUser } from "@/lib/premiumServer";
import { reportError } from "@/lib/observability";
import { supabase } from "@/lib/supabase/anon";
import { buildApiErrorBody } from "@/lib/userMessages";

/**
 * Busca curada por plano rápido (sem IA).
 * @param {import("next/server").NextRequest} request - JSON: `{ planoId, filtroStatus?, latitude?, longitude? }`.
 * @returns {Promise<import("next/server").NextResponse>}
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const planoId = String(body?.planoId ?? "").trim();
    const plano = getPlanoRapidoById(planoId);

    if (!plano) {
      return NextResponse.json(buildApiErrorBody("VALIDATION"), { status: 400 });
    }

    const { user } = await getAuthUser();
    if (!user) {
      return NextResponse.json(
        {
          error: "Faça login para ver planos rápidos.",
          code: "LOGIN_REQUIRED",
        },
        { status: 401 }
      );
    }

    const filtroStatus = body?.filtroStatus ?? plano.filtro ?? FILTRO_STATUS_BUSCA.TODOS;
    const latitude = Number(body?.latitude);
    const longitude = Number(body?.longitude);
    const userPosition =
      Number.isFinite(latitude) && Number.isFinite(longitude)
        ? { latitude, longitude }
        : null;

    const { data: lugares, error } = await supabase
      .from("lugares")
      .select("*, localizacoes(*), lugares_tags(tags(*))")
      .eq("status", "ativo");

    if (error) {
      console.error("Planos rápidos — erro Supabase:", error);
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    const lugaresAtivos = (lugares ?? []).map((lugar) => enrichLugarFlags(lugar));
    const { lugares: resultados } = filterLugaresForPlano(lugaresAtivos, planoId, {
      filtroStatus,
      userPosition,
    });

    if (filtroStatus !== FILTRO_STATUS_BUSCA.TODOS && resultados.length === 0) {
      return NextResponse.json({
        lugares: [],
        planoId,
        filtroStatus,
        titulo: plano.titulo,
        message: "Nenhum lugar corresponde ao filtro de horário selecionado.",
      });
    }

    return NextResponse.json({
      lugares: resultados,
      planoId,
      filtroStatus,
      titulo: plano.titulo,
    });
  } catch (err) {
    reportError(err, { route: "POST /api/planos-rapidos" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
