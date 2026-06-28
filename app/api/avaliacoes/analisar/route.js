import { NextResponse } from "next/server";
import { getClaudeModel } from "@/lib/anthropicConfig";
import { checkIaRateLimit } from "@/lib/iaRateLimit";
import { logIA } from "@/lib/logIA";
import { reportError } from "@/lib/observability";
import { parseJsonObjectFromText } from "@/lib/parseModelJson";
import { getAuthUser } from "@/lib/premiumServer";
import { buildApiErrorBody } from "@/lib/userMessages";

const SYSTEM_PROMPT = `Você é moderador de avaliações de um app de turismo local 
em Imbituba, SC. Analise a avaliação e retorne APENAS um JSON válido 
sem markdown com:
{
  "sentimento": "positivo" | "neutro" | "negativo",
  "sugestao": "aprovar" | "rejeitar" | "revisar",
  "motivo": "explicação curta em português de até 100 caracteres",
  "spam": true | false
}
Rejeitar se: spam, palavrões, conteúdo irrelevante, propaganda.
Revisar se: vago demais, suspeito mas não claramente spam.
Aprovar se: experiência genuína, mesmo que negativa.`;

const MODERATION_CACHE_CONTEXT = `Política fixa de moderação (aplicada em todas as análises):
- Segurança: rejeitar discurso de ódio, assédio, ameaça, discriminação, conteúdo sexual explícito.
- Integridade: rejeitar propaganda, links promocionais, autopromoção, cupom, spam repetitivo.
- Relevância: revisar conteúdo sem relação com o lugar, sem contexto mínimo, ou com ruído excessivo.
- Autenticidade: aprovar experiência pessoal mesmo que negativa, crítica construtiva ou nota baixa.
- Linguagem: palavrão isolado sem ataque pessoal pode ser revisado; ataque direto deve ser rejeitado.
- Privacidade: rejeitar dados pessoais sensíveis (telefone completo, CPF, cartão, etc.).
- Ambiguidade: quando houver dúvida razoável entre genuíno e spam, marcar "revisar".
- Neutralidade: não favorecer avaliações positivas; foco é qualidade e segurança do conteúdo.

Matriz de decisão:
1) Existe violação grave (ódio, ameaça, assédio, sexual explícito)? => rejeitar.
2) Existe spam/publicidade/link/comercial explícito? => rejeitar.
3) Conteúdo é extremamente vago, sem contexto, suspeito de automação? => revisar.
4) Conteúdo descreve experiência real (boa ou ruim), com algum contexto? => aprovar.

Exemplos de aprovação:
- "Atendimento demorou, mas a comida estava ótima."
- "Lugar bonito, porém estava lotado no fim da tarde."
- "Não gostei do preço, mas ambiente limpo e organizado."

Exemplos de revisão:
- "Legal." (curto demais, sem contexto)
- "Não sei..." (insuficiente para decisão automática)
- Texto confuso com baixa semântica e sinais de geração automática.

Exemplos de rejeição:
- "Clique no meu link para desconto..."
- "Péssimo!!! seu lixo..." (ataque pessoal agressivo)
- "Compre aqui agora, promoção imperdível."

Regras de resposta:
- Sempre retornar JSON estrito com as chaves exigidas.
- "motivo" curto, claro e objetivo (máx. 100 chars).
- "spam" true quando houver sinais claros de spam/comercial.
- Não adicionar comentários extras fora do JSON.
- Não usar markdown, cercas de código, prefixos ou sufixos.`;

/**
 * Pré-análise de avaliação com Claude após envio pelo usuário.
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<import("next/server").NextResponse>}
 */
export async function POST(request) {
  try {
    const { avaliacao_id } = await request.json();

    if (!avaliacao_id) {
      return NextResponse.json(
        { ...buildApiErrorBody("VALIDATION"), error: "Identificador da avaliação é obrigatório." },
        { status: 400 }
      );
    }

    const { user, supabase } = await getAuthUser();
    if (!user) {
      return NextResponse.json(buildApiErrorBody("UNAUTHORIZED"), { status: 401 });
    }

    const rate = await checkIaRateLimit(request, user.id);
    if (!rate.allowed) {
      return NextResponse.json(buildApiErrorBody("RATE_LIMITED"), {
        status: 429,
        headers: rate.retryAfterSec
          ? { "Retry-After": String(rate.retryAfterSec) }
          : undefined,
      });
    }

    const { data: avaliacao, error: fetchError } = await supabase
      .from("avaliacoes")
      .select("*, lugares(nome, categoria)")
      .eq("id", avaliacao_id)
      .single();

    if (fetchError || !avaliacao) {
      return NextResponse.json(buildApiErrorBody("NOT_FOUND"), { status: 404 });
    }

    if (avaliacao.user_id !== user.id) {
      return NextResponse.json(buildApiErrorBody("FORBIDDEN"), { status: 403 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    const lugar = avaliacao.lugares || {};
    const aspectos = Array.isArray(avaliacao.aspectos)
      ? avaliacao.aspectos
      : avaliacao.aspectos
        ? [avaliacao.aspectos]
        : [];

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
          max_tokens: 500,
          system: [
            {
              type: "text",
              text: `${SYSTEM_PROMPT}\n\n${MODERATION_CACHE_CONTEXT}`,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [
            {
              role: "user",
              content: `Lugar: ${lugar.nome || "Desconhecido"} (${lugar.categoria || "—"})
Nota: ${avaliacao.nota}/5
Aspectos: ${JSON.stringify(aspectos)}
Comentário: "${avaliacao.comentario || "sem comentário"}"`,
            },
          ],
        }),
      });

      const claudeRaw = await claudeResponse.text();

      if (!claudeResponse.ok) {
        reportError(new Error(`Claude HTTP ${claudeResponse.status}`), {
          route: "POST /api/avaliacoes/analisar",
        });
        const latencia = Date.now() - start;
        await logIA({
          feature: "moderacao",
          userId: user?.id,
          usage: {},
          latencia,
          sucesso: false,
          erro: `Claude HTTP ${claudeResponse.status}`,
        });
        return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
      }

      claudeData = JSON.parse(claudeRaw);
      const latencia = Date.now() - start;
      await logIA({
        feature: "moderacao",
        userId: user?.id,
        usage: claudeData.usage,
        latencia,
        sucesso: true,
      });
    } catch (error) {
      await logIA({
        feature: "moderacao",
        userId: user?.id,
        usage: {},
        latencia: Date.now() - start,
        sucesso: false,
        erro: error?.message || "Erro ao chamar Anthropic",
      });
      throw error;
    }

    console.log("[anthropic-cache][avaliacoes-analisar]", {
      input_tokens: claudeData.usage?.input_tokens,
      output_tokens: claudeData.usage?.output_tokens,
      cache_creation_input_tokens: claudeData.usage?.cache_creation_input_tokens,
      cache_read_input_tokens: claudeData.usage?.cache_read_input_tokens,
    });
    const text = claudeData.content?.[0]?.text ?? "";
    const resultado = parseJsonObjectFromText(text);

    if (!resultado) {
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    const sentimento = String(resultado.sentimento || "neutro").toLowerCase();
    const sugestao = String(resultado.sugestao || "revisar").toLowerCase();
    const motivo = String(resultado.motivo || "").slice(0, 100);
    const spam = Boolean(resultado.spam);

    const updatePayload = {
      sentimento,
      sugestao_ia: `${sugestao}: ${motivo}`,
    };

    if (spam) {
      updatePayload.status = "rejeitado";
      updatePayload.motivo_rejeicao = "Rejeitado automaticamente: spam detectado pela IA";
    }

    const { error: updateError } = await supabase
      .from("avaliacoes")
      .update(updatePayload)
      .eq("id", avaliacao_id);

    if (updateError) {
      reportError(updateError, { route: "POST /api/avaliacoes/analisar update" });
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    reportError(err, { route: "POST /api/avaliacoes/analisar" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
