import { NextResponse } from "next/server";
import {
  FILTRO_STATUS_BUSCA,
  buildLugarBuscaResumo,
  filtrarLugaresPorStatus,
  getFiltroStatusLabel,
} from "@/lib/busca";
import { getClaudeModel } from "@/lib/anthropicConfig";
import { rankLugaresForBusca } from "@/lib/buscaRetrieval";
import {
  LUGAR_SELECT_BUSCA_CONTEXT,
  orderLugaresByIds,
  queryLugaresByIds,
} from "@/lib/lugaresQuery";
import { enrichLugarFlags, enrichLugaresFlags } from "@/lib/lugarBadges";
import { checkIaRateLimit } from "@/lib/iaRateLimit";
import { logIA } from "@/lib/logIA";
import { reportError } from "@/lib/observability";
import { parseJsonArrayFromText } from "@/lib/parseModelJson";
import { checkBuscaAccess, getAuthUser, releaseBuscaIaUsage, reserveBuscaIaUsage } from "@/lib/premiumServer";
import { supabase } from "@/lib/supabase/anon";
import { buildApiErrorBody } from "@/lib/userMessages";

const SYSTEM_PROMPT = `Você é um assistente do app Guia de Bolso, um guia local de Imbituba, Santa Catarina.
Com base nos lugares disponíveis, retorne os IDs dos lugares mais relevantes para a busca do usuário.
Responda APENAS com um array JSON de IDs, ex: ["uuid-1", "uuid-2"].
Use exatamente os IDs fornecidos na lista de lugares. Se nenhum lugar for relevante, retorne [].

Cada lugar inclui "abertoAgora" (true/false) com base no horário atual em America/Sao_Paulo.
- Se a busca pedir lugares abertos, retorne só IDs com abertoAgora=true.
- Se a busca pedir lugares fechados, retorne só IDs com abertoAgora=false.
- Caso contrário, priorize relevância e não exclua por horário.
- Priorize apenas relevância à busca; não favoreça parceiros ou curadoria por padrão.`;

/**
 * AI-powered natural-language search over active places (premium usage enforced).
 * @param {import("next/server").NextRequest} request - JSON body: `{ query, filtroStatus? }`.
 * @returns {Promise<import("next/server").NextResponse>} Matching places and usage metadata.
 */
export async function POST(request) {
  try {
    const { query, filtroStatus = FILTRO_STATUS_BUSCA.TODOS } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json({ lugares: [] });
    }

    const { user } = await getAuthUser();

    const rate = await checkIaRateLimit(request, user?.id);
    if (!rate.allowed) {
      return NextResponse.json(buildApiErrorBody("RATE_LIMITED"), {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      });
    }

    const access = await checkBuscaAccess(user?.id, { increment: false, user });

    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.message,
          code: access.code,
          usage: access.usage ?? null,
        },
        { status: access.status }
      );
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    const { data: lugares, error } = await supabase
      .from("lugares")
      .select(LUGAR_SELECT_BUSCA_CONTEXT)
      .eq("status", "ativo");

    if (error) {
      console.error("Busca — erro Supabase:", error);
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    const lugaresAtivos = (lugares ?? []).map((lugar) => enrichLugarFlags(lugar));
    const lugaresParaBusca = filtrarLugaresPorStatus(lugaresAtivos, filtroStatus);

    if (
      filtroStatus !== FILTRO_STATUS_BUSCA.TODOS &&
      lugaresParaBusca.length === 0
    ) {
      return NextResponse.json({
        lugares: [],
        usage: access.usage ?? null,
        filtroStatus,
        message: "Nenhum lugar corresponde ao filtro de horário selecionado.",
      });
    }

    const queryUsuario = query.trim();
    const rankedParaIa = rankLugaresForBusca(
      lugaresParaBusca.map((lugar) => ({
        ...lugar,
        tags: (lugar.lugares_tags ?? [])
          .map((row) => row?.tags?.nome)
          .filter(Boolean),
      })),
      queryUsuario
    );

    const lugaresResumo = rankedParaIa.map((lugar) => {
      const resumo = buildLugarBuscaResumo(lugar);
      return {
        id: resumo.id,
        contexto: `${resumo.nome}${resumo.subcategoria ? ` (${resumo.subcategoria})` : ""} - ${
          resumo.abertoAgora ? "ABERTO AGORA" : "FECHADO AGORA"
        } (${resumo.statusDetail}) - tags: ${
          resumo.tags.length > 0 ? resumo.tags.join(", ") : "sem tags"
        } - ${resumo.descricao} - categoria: ${resumo.categoria}`,
        abertoAgora: resumo.abertoAgora,
      };
    });

    const filtroLabel = getFiltroStatusLabel(filtroStatus);

    const requestBody = {
      model: getClaudeModel(),
      max_tokens: 256,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" },
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Filtro de horário: ${filtroLabel}.
Lugares disponíveis (${lugaresResumo.length}):
${JSON.stringify(lugaresResumo)}`,
              cache_control: { type: "ephemeral" },
            },
            {
              type: "text",
              text: `Busca do usuário: ${queryUsuario}`,
            },
          ],
        },
      ],
    };

    const reserved = await reserveBuscaIaUsage(user?.id, { user });
    if (!reserved.allowed) {
      return NextResponse.json(
        {
          error: reserved.message,
          code: reserved.code,
          usage: reserved.usage ?? access.usage ?? null,
        },
        { status: reserved.status }
      );
    }

    const reservedUsage = reserved.usage ?? access.usage ?? null;
    const shouldReleaseQuota = !reservedUsage?.premium;

    const start = Date.now();
    let claudeData;
    try {
      const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-beta": "prompt-caching-2024-07-31",
        },
        body: JSON.stringify(requestBody),
      });

      const claudeRaw = await claudeResponse.text();

      if (!claudeResponse.ok) {
        console.error("Busca — Claude HTTP:", claudeResponse.status, claudeRaw);
        const latencia = Date.now() - start;
        await logIA({
          feature: "busca",
          userId: user?.id,
          usage: {},
          latencia,
          sucesso: false,
          erro: `Claude HTTP ${claudeResponse.status}`,
        });
        const usageAfterRelease = shouldReleaseQuota
          ? (await releaseBuscaIaUsage(user?.id, { user })) ?? reservedUsage
          : reservedUsage;
        return NextResponse.json(
          { ...buildApiErrorBody("CLAUDE_ERROR"), usage: usageAfterRelease },
          { status: 500 }
        );
      }

      claudeData = JSON.parse(claudeRaw);
      const latencia = Date.now() - start;
      await logIA({
        feature: "busca",
        userId: user?.id,
        usage: claudeData.usage,
        latencia,
        sucesso: true,
      });
    } catch (error) {
      await logIA({
        feature: "busca",
        userId: user?.id,
        usage: {},
        latencia: Date.now() - start,
        sucesso: false,
        erro: error?.message || "Erro ao chamar Anthropic",
      });
      if (shouldReleaseQuota) {
        await releaseBuscaIaUsage(user?.id, { user });
      }
      throw error;
    }

    console.log("[anthropic-cache][buscar]", {
      input_tokens: claudeData.usage?.input_tokens,
      output_tokens: claudeData.usage?.output_tokens,
      cache_creation_input_tokens: claudeData.usage?.cache_creation_input_tokens,
      cache_read_input_tokens: claudeData.usage?.cache_read_input_tokens,
    });
    const text = claudeData.content?.[0]?.text ?? "[]";
    const ids = parseJsonArrayFromText(text);

    const { data: lugaresResultado, error: idsError } = await queryLugaresByIds(
      supabase,
      ids
    );

    if (idsError) {
      console.error("Busca — erro ao carregar resultados:", idsError);
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    let filtrados = orderLugaresByIds(
      enrichLugaresFlags(lugaresResultado ?? []),
      ids
    );

    filtrados = filtrarLugaresPorStatus(filtrados, filtroStatus);

    return NextResponse.json({
      lugares: filtrados,
      usage: reservedUsage,
      filtroStatus,
    });
  } catch (err) {
    reportError(err, { route: "POST /api/buscar" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
