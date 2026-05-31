import { NextResponse } from "next/server";
import {
  buildWaitlistConfirmationHtml,
  buildWaitlistConfirmationText,
  getWaitlistConfirmationSubject,
} from "@/lib/emails/waitlistConfirmation";
import { sendResendEmail } from "@/lib/resend";
import { createServiceClient } from "@/lib/supabase/service";
import {
  isValidWaitlistEmail,
  normalizeWaitlistOrigem,
  sanitizeWaitlistEmail,
  WAITLIST_MESSAGES,
} from "@/lib/waitlist";
import { checkWaitlistRateLimit } from "@/lib/waitlistRateLimit";

/**
 * @param {import("next/server").NextRequest} request
 * @returns {string}
 */
function getRateLimitKey(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return `ip:${forwarded.split(",")[0].trim()}`;
  return "ip:unknown";
}

/**
 * Cadastra e-mail na lista de espera e envia confirmação via Resend.
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<import("next/server").NextResponse>}
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const email = sanitizeWaitlistEmail(body.email);
    const lgpdAceito = body.lgpd_aceito === true;
    const origem = normalizeWaitlistOrigem(body.origem);

    if (!email) {
      return NextResponse.json(
        { error: WAITLIST_MESSAGES.EMAIL_REQUIRED, code: "VALIDATION" },
        { status: 400 }
      );
    }

    if (!isValidWaitlistEmail(email)) {
      return NextResponse.json(
        { error: WAITLIST_MESSAGES.EMAIL_INVALID, code: "VALIDATION" },
        { status: 400 }
      );
    }

    if (!lgpdAceito) {
      return NextResponse.json(
        { error: WAITLIST_MESSAGES.LGPD_REQUIRED, code: "VALIDATION" },
        { status: 400 }
      );
    }

    const rateKey = getRateLimitKey(request);
    if (!checkWaitlistRateLimit(rateKey)) {
      return NextResponse.json(
        { error: WAITLIST_MESSAGES.RATE_LIMIT, code: "RATE_LIMIT" },
        { status: 429 }
      );
    }

    const service = createServiceClient();
    if (!service) {
      console.error("SUPABASE_SERVICE_ROLE_KEY ausente — waitlist indisponível");
      return NextResponse.json(
        { error: WAITLIST_MESSAGES.UNAVAILABLE, code: "SERVER" },
        { status: 503 }
      );
    }

    const { data: inserted, error: insertError } = await service
      .from("waitlist")
      .insert({
        email,
        origem,
        lgpd_aceito: true,
      })
      .select("id")
      .single();

    if (insertError) {
      if (insertError.code === "23505") {
        return NextResponse.json(
          {
            success: true,
            alreadyRegistered: true,
            message: WAITLIST_MESSAGES.ALREADY_REGISTERED,
          },
          { status: 200 }
        );
      }

      console.error("Erro ao inserir waitlist:", insertError);
      return NextResponse.json(
        { error: WAITLIST_MESSAGES.SERVER, code: "SERVER" },
        { status: 500 }
      );
    }

    const emailResult = await sendResendEmail({
      to: email,
      subject: getWaitlistConfirmationSubject(),
      html: buildWaitlistConfirmationHtml(),
      text: buildWaitlistConfirmationText(),
    });

    if (emailResult.ok && inserted?.id) {
      await service
        .from("waitlist")
        .update({ confirmacao_enviada_em: new Date().toISOString() })
        .eq("id", inserted.id);
    } else if (!emailResult.skipped) {
      console.warn("[waitlist] cadastro ok, e-mail não enviado:", emailResult.error);
    }

    return NextResponse.json(
      {
        success: true,
        message: WAITLIST_MESSAGES.SUCCESS,
        emailSent: emailResult.ok,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/waitlist:", err);
    return NextResponse.json(
      { error: WAITLIST_MESSAGES.SERVER, code: "SERVER" },
      { status: 500 }
    );
  }
}
