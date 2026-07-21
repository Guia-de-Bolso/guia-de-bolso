import { NextResponse } from "next/server";
import { sendPushNotificationBatch } from "@/lib/pushMessaging";
import {
  disableInvalidPushTokens,
  getEnabledPushTokensForUsers,
} from "@/lib/pushTokens";
import { validateAdminPushPayload } from "@/lib/pushTokenValidation";
import { requireAdminApi } from "@/lib/requireAdminApi";
import { createServiceClient } from "@/lib/supabase/service";
import { buildApiErrorBody, USER_MESSAGES } from "@/lib/userMessages";

/**
 * Envia notificação push para usuários específicos (admin).
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function POST(request) {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => null);
    const payload = validateAdminPushPayload(body);
    if (!payload.ok) {
      return NextResponse.json(
        buildApiErrorBody("VALIDATION", { error: payload.message }),
        { status: 400 }
      );
    }

    const admin = createServiceClient();
    if (!admin) {
      console.error("POST /api/admin/push/send: SUPABASE_SERVICE_ROLE_KEY ausente");
      return NextResponse.json(
        buildApiErrorBody("SERVER", { error: USER_MESSAGES.SERVER }),
        { status: 503 }
      );
    }

    const { tokens, missingTable } = await getEnabledPushTokensForUsers(
      admin,
      payload.userIds
    );

    if (missingTable) {
      return NextResponse.json(
        buildApiErrorBody("SERVER", {
          error: "Tabela push_tokens ausente. Aplique a migration no Supabase.",
        }),
        { status: 503 }
      );
    }

    if (!tokens.length) {
      return NextResponse.json({
        ok: true,
        sent: 0,
        failed: 0,
        recipients: 0,
        message: "Nenhum dispositivo ativo para os usuários informados.",
      });
    }

    const result = await sendPushNotificationBatch({
      tokens,
      title: payload.title,
      body: payload.body,
      url: payload.url,
    });

    if (!result.ok && result.code === "FIREBASE_NOT_CONFIGURED") {
      return NextResponse.json(
        buildApiErrorBody("SERVER", { error: result.message }),
        { status: 503 }
      );
    }

    let disabledInvalid = 0;
    if (result.invalidTokens?.length) {
      try {
        disabledInvalid = await disableInvalidPushTokens(admin, result.invalidTokens);
      } catch (cleanupError) {
        console.warn(
          "POST /api/admin/push/send: falha ao desativar tokens inválidos:",
          cleanupError
        );
      }
    }

    return NextResponse.json({
      ok: result.ok,
      sent: result.sent,
      failed: result.failed,
      recipients: tokens.length,
      disabledInvalid,
      errorCounts: result.errorCounts,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : USER_MESSAGES.SERVER;
    console.error("POST /api/admin/push/send:", message);
    return NextResponse.json(
      buildApiErrorBody("SERVER", { error: USER_MESSAGES.SERVER }),
      { status: 500 }
    );
  }
}
