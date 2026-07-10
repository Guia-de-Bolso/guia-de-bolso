import { NextResponse } from "next/server";
import {
  isValidEmailOptional,
  isValidFeedbackTipo,
} from "@/lib/feedback";
import { checkFeedbackRateLimit } from "@/lib/feedbackRateLimit";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { USER_MESSAGES } from "@/lib/userMessages";

const MAX_ASSUNTO = 120;
const MIN_MENSAGEM = 10;
const MAX_MENSAGEM = 4000;

/**
 * @param {unknown} value
 * @returns {string|null}
 */
function sanitizeText(value, maxLen) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim().slice(0, maxLen);
  return text || null;
}

/**
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<string>}
 */
function getRateLimitKey(request, userId) {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0].trim()}`;
  return "ip:unknown";
}

/**
 * Recebe feedback do app (logado ou visitante).
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<import("next/server").NextResponse>}
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);

    const body = await request.json();
    const tipo = sanitizeText(body.tipo, 32);
    const mensagem = sanitizeText(body.mensagem, MAX_MENSAGEM);
    const assunto = sanitizeText(body.assunto, MAX_ASSUNTO);
    const emailContato = sanitizeText(body.email_contato, 120);
    const nomeContato = sanitizeText(body.nome_contato, 80);
    const paginaOrigem = sanitizeText(body.pagina_origem, 200);
    const contextoTecnico =
      body.contexto_tecnico && typeof body.contexto_tecnico === "object"
        ? body.contexto_tecnico
        : null;

    if (!isValidFeedbackTipo(tipo)) {
      return NextResponse.json(
        { error: "Escolha um tipo de feedback válido.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    if (!mensagem || mensagem.length < MIN_MENSAGEM) {
      return NextResponse.json(
        {
          error: `Descreva seu feedback com pelo menos ${MIN_MENSAGEM} caracteres.`,
          code: "VALIDATION",
        },
        { status: 400 }
      );
    }

    if (!isValidEmailOptional(emailContato)) {
      return NextResponse.json(
        { error: "Informe um e-mail válido ou deixe o campo em branco.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const rateKey = getRateLimitKey(request, user?.id);
    if (!checkFeedbackRateLimit(rateKey)) {
      return NextResponse.json(
        { error: USER_MESSAGES.RATE_LIMIT, code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    const row = {
      user_id: user?.id ?? null,
      tipo,
      status: "novo",
      assunto,
      mensagem,
      email_contato: emailContato,
      nome_contato: nomeContato,
      pagina_origem: paginaOrigem,
      contexto_tecnico: contextoTecnico,
      updated_at: new Date().toISOString(),
    };

    const service = createServiceClient();
    const insertClient = service ?? supabase;

    if (!user && !service) {
      console.error("SUPABASE_SERVICE_ROLE_KEY ausente — feedback de visitante indisponível");
      return NextResponse.json(
        {
          error: "Envio temporariamente indisponível. Tente fazer login ou mais tarde.",
          code: "SERVER",
        },
        { status: 503 }
      );
    }

    // Sem .select(): RLS só permite SELECT para admin; RETURNING falhava para usuários logados.
    const { error } = await insertClient.from("feedback").insert(row);

    if (error) {
      console.error("Erro ao inserir feedback:", error);
      return NextResponse.json(
        { error: USER_MESSAGES.FEEDBACK_ERROR, code: "SERVER" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: USER_MESSAGES.FEEDBACK_SUCCESS,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/feedback:", err);
    return NextResponse.json(
      { error: USER_MESSAGES.FEEDBACK_ERROR, code: "SERVER" },
      { status: 500 }
    );
  }
}
