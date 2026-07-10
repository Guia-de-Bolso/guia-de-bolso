import { NextResponse } from "next/server";
import { reportError } from "@/lib/observability";
import { getAuthUser } from "@/lib/premiumServer";
import { parseDiasViagem } from "@/lib/roteiroDias";
import { buildApiErrorBody } from "@/lib/userMessages";

/**
 * Persists a generated itinerary for the authenticated user.
 * @param {import("next/server").NextRequest} request - JSON body with titulo, dias, perfil, interesses, conteudo.
 * @returns {Promise<import("next/server").NextResponse>} Saved roteiro or error.
 */
export async function POST(request) {
  try {
    const { user, supabase } = await getAuthUser();

    if (!user) {
      return NextResponse.json(
        { ...buildApiErrorBody("LOGIN_REQUIRED"), error: "Faça login para salvar o roteiro." },
        { status: 401 }
      );
    }

    const { titulo, dias, perfil, interesses, conteudo, tiposGastronomia } = await request.json();

    const diasNumero = parseDiasViagem(dias);
    const interessesLista = Array.isArray(interesses) ? interesses : [];
    const tiposLista = Array.isArray(tiposGastronomia) ? tiposGastronomia : [];
    const interessesSalvos = [
      ...interessesLista,
      ...tiposLista.filter((item) => !interessesLista.includes(item)),
    ];

    if (!titulo?.trim() || diasNumero === null || !perfil?.trim() || !conteudo?.trim()) {
      return NextResponse.json(
        {
          ...buildApiErrorBody("VALIDATION"),
          error: "Dados incompletos para salvar o roteiro.",
        },
        { status: 400 }
      );
    }

    const { data: roteiro, error } = await supabase
      .from("roteiros")
      .insert({
        user_id: user.id,
        titulo: titulo.trim(),
        dias: diasNumero,
        perfil: perfil.trim(),
        interesses: interessesSalvos,
        conteudo: conteudo.trim(),
      })
      .select("id, titulo, dias, perfil, interesses, conteudo, created_at")
      .single();

    if (error) {
      reportError(error, { route: "POST /api/roteiro/salvar" });
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    return NextResponse.json({ success: true, roteiro });
  } catch (err) {
    reportError(err, { route: "POST /api/roteiro/salvar" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
