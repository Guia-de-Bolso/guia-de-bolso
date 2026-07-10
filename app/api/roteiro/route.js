import { NextResponse } from "next/server";
import { getClaudeModel } from "@/lib/anthropicConfig";
import { enrichLugarFlags } from "@/lib/lugarBadges";
import { applyPublicLugarFilters } from "@/lib/publicCatalog";
import { checkIaRateLimit } from "@/lib/iaRateLimit";
import { logIA } from "@/lib/logIA";
import { reportError } from "@/lib/observability";
import { checkRoteiroAccess, getAuthUser, releaseRoteiroIaUsage, reserveRoteiroIaUsage } from "@/lib/premiumServer";
import { parseDiasViagem } from "@/lib/roteiroDias";
import { selecionarLugaresParaRoteiro } from "@/lib/roteiroLugares";
import { supabase } from "@/lib/supabase/anon";
import { buildApiErrorBody } from "@/lib/userMessages";

const SYSTEM_PROMPT = `Você é um especialista local em Imbituba, Santa Catarina.
Monte um roteiro personalizado usando APENAS lugares da lista fornecida (use o nome EXATO de cada lugar).
Siga RIGOROSAMENTE este formato markdown — cada parada precisa das 4 linhas após o nome:

# Dia 1 — Título curto do dia (máx. 6 palavras)

## 🌅 Manhã
**Nome Exato do Lugar**
→ Uma frase curta (máx. 12 palavras)
💡 Dica prática (máx. 10 palavras)
⏱️ ~2h

## ☀️ Tarde
**Outro Lugar da Lista**
→ Frase objetiva (máx. 12 palavras)
💡 Dica curta (máx. 10 palavras)
⏱️ ~3h

## 🌙 Noite
**Lugar da Lista**
→ Frase objetiva (máx. 12 palavras)
💡 Dica curta (máx. 10 palavras)
⏱️ ~2h

Regras obrigatórias:
- Uma linha → por parada (sem segunda linha de atividade).
- Repita o bloco completo (## período + parada com **nome**, →, 💡, ⏱️) para cada dia solicitado.
- Monte EXATAMENTE o número de dias pedido no prompt (Dia 1 até Dia N). Não adicione dias a mais nem a menos.
- Se houver preferências gastronômicas (ex.: Pizza, Sushi), priorize restaurantes com essas especialidades nas refeições.
- Não deixe períodos vazios: se não houver lugar à noite, omita o bloco ## daquele período.
- Não invente lugares. Não use parágrafos soltos fora do formato.
- Tom direto, português do Brasil, emojis apenas nos títulos ## de período.`;

/**
 * Generates a personalized multi-day itinerary via Claude from active places.
 * @param {import("next/server").NextRequest} request - JSON body: `{ dias, perfil, interesses }`.
 * @returns {Promise<import("next/server").NextResponse>} Markdown itinerary and usage metadata.
 */
export async function POST(request) {
  try {
    const { dias, perfil, interesses, tiposGastronomia } = await request.json();

    if (!dias?.trim() || !perfil?.trim() || !interesses?.length) {
      return NextResponse.json(buildApiErrorBody("VALIDATION"), { status: 400 });
    }

    const diasNumero = parseDiasViagem(dias);
    if (diasNumero === null) {
      return NextResponse.json(buildApiErrorBody("VALIDATION"), { status: 400 });
    }

    const tiposGastronomiaLista = Array.isArray(tiposGastronomia)
      ? tiposGastronomia.map((item) => String(item ?? "").trim()).filter(Boolean)
      : [];

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

    const access = await checkRoteiroAccess(user?.id, { increment: false, user });

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

    const { data: lugaresRaw, error } = await applyPublicLugarFilters(
      supabase
        .from("lugares")
        .select(
          "id, nome, descricao, categoria, subcategoria, eh_parceiro, conteudo_curadoria, imagem_url, fotos, lugares_tags(tags(nome))"
        )
    );

    if (error) {
      reportError(error, { route: "POST /api/roteiro supabase" });
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    const lugaresComParceiro = (lugaresRaw ?? []).map((lugar) => enrichLugarFlags(lugar));

    const lugares = selecionarLugaresParaRoteiro(
      lugaresComParceiro,
      interesses,
      24,
      tiposGastronomiaLista
    );

    const interessesTexto = Array.isArray(interesses)
      ? interesses.join(", ")
      : String(interesses);
    const gastronomiaTexto = tiposGastronomiaLista.length
      ? ` | Preferências gastronômicas: ${tiposGastronomiaLista.join(", ")}`
      : "";
    const diasPrompt = `EXATAMENTE ${diasNumero} ${diasNumero === 1 ? "dia" : "dias"}`;
    const maxTokens = Math.min(4096, 900 + diasNumero * 520);

    const reserved = await reserveRoteiroIaUsage(user?.id, { user });
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
        body: JSON.stringify({
          model: getClaudeModel(),
          max_tokens: maxTokens,
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
                  text: `Lugares (${lugares.length}): ${JSON.stringify(lugares)}`,
                  cache_control: { type: "ephemeral" },
                },
                {
                  type: "text",
                  text: `Roteiro de ${diasPrompt} | Perfil: ${perfil} | Interesses: ${interessesTexto}${gastronomiaTexto}`,
                },
              ],
            },
          ],
        }),
      });

      const claudeRaw = await claudeResponse.text();

      if (!claudeResponse.ok) {
        reportError(new Error(`Claude HTTP ${claudeResponse.status}`), {
          route: "POST /api/roteiro",
        });
        const latencia = Date.now() - start;
        await logIA({
          feature: "roteiro",
          userId: user?.id,
          usage: {},
          latencia,
          sucesso: false,
          erro: `Claude HTTP ${claudeResponse.status}`,
        });
        const usageAfterRelease = shouldReleaseQuota
          ? (await releaseRoteiroIaUsage(user?.id, { user })) ?? reservedUsage
          : reservedUsage;
        return NextResponse.json(
          { ...buildApiErrorBody("ROTEIRO_ERROR"), usage: usageAfterRelease },
          { status: 500 }
        );
      }

      claudeData = JSON.parse(claudeRaw);
      const latencia = Date.now() - start;
      await logIA({
        feature: "roteiro",
        userId: user?.id,
        usage: claudeData.usage,
        latencia,
        sucesso: true,
      });
    } catch (error) {
      await logIA({
        feature: "roteiro",
        userId: user?.id,
        usage: {},
        latencia: Date.now() - start,
        sucesso: false,
        erro: error?.message || "Erro ao chamar Anthropic",
      });
      if (shouldReleaseQuota) {
        await releaseRoteiroIaUsage(user?.id, { user });
      }
      throw error;
    }

    console.log("[anthropic-cache][roteiro]", {
      input_tokens: claudeData.usage?.input_tokens,
      output_tokens: claudeData.usage?.output_tokens,
      cache_creation_input_tokens: claudeData.usage?.cache_creation_input_tokens,
      cache_read_input_tokens: claudeData.usage?.cache_read_input_tokens,
    });
    const conteudo = claudeData.content?.[0]?.text?.trim() ?? "";

    const parceiroPorId = new Map(
      lugaresComParceiro.map((lugar) => [String(lugar.id), Boolean(lugar.ehParceiro)])
    );

    const lugaresCatalog = lugares.map((lugar) => ({
      id: String(lugar.id),
      nome: lugar.nome,
      ehParceiro: parceiroPorId.get(String(lugar.id)) ?? false,
      imagem_url: lugar.imagem_url ?? null,
      fotos: lugar.fotos ?? null,
    }));

    return NextResponse.json({
      conteudo,
      titulo: `Roteiro ${dias} - ${perfil}`,
      lugaresCatalog,
      usage: reservedUsage,
    });
  } catch (err) {
    reportError(err, { route: "POST /api/roteiro" });
    return NextResponse.json(buildApiErrorBody("ROTEIRO_ERROR"), { status: 500 });
  }
}
