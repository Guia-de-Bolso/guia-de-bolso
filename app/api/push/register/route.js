import { NextResponse } from "next/server";
import { disablePushTokens, upsertPushToken } from "@/lib/pushTokens";
import { validatePushPlatform, validatePushToken } from "@/lib/pushTokenValidation";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { buildApiErrorBody, USER_MESSAGES } from "@/lib/userMessages";

/**
 * Registra ou reativa token push do dispositivo autenticado.
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);

    if (!user) {
      return NextResponse.json(
        buildApiErrorBody("UNAUTHORIZED", { error: USER_MESSAGES.UNAUTHORIZED }),
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const tokenResult = validatePushToken(body?.token);
    if (!tokenResult.ok) {
      return NextResponse.json(
        buildApiErrorBody("VALIDATION", { error: tokenResult.message }),
        { status: 400 }
      );
    }

    const platformResult = validatePushPlatform(body?.platform);
    if (!platformResult.ok) {
      return NextResponse.json(
        buildApiErrorBody("VALIDATION", { error: platformResult.message }),
        { status: 400 }
      );
    }

    const admin = createServiceClient();
    if (!admin) {
      console.error("POST /api/push/register: SUPABASE_SERVICE_ROLE_KEY ausente");
      return NextResponse.json(
        buildApiErrorBody("SERVER", { error: USER_MESSAGES.SERVER }),
        { status: 503 }
      );
    }

    const result = await upsertPushToken(admin, user.id, {
      token: tokenResult.token,
      platform: platformResult.platform,
    });

    if (!result.ok) {
      return NextResponse.json(
        buildApiErrorBody("SERVER", { error: result.message }),
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : USER_MESSAGES.SERVER;
    console.error("POST /api/push/register:", message);
    return NextResponse.json(
      buildApiErrorBody("SERVER", { error: USER_MESSAGES.SERVER }),
      { status: 500 }
    );
  }
}

/**
 * Desativa token push do usuário autenticado.
 * @param {import('next/server').NextRequest} request
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);

    if (!user) {
      return NextResponse.json(
        buildApiErrorBody("UNAUTHORIZED", { error: USER_MESSAGES.UNAUTHORIZED }),
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const tokenResult = body?.token ? validatePushToken(body.token) : null;
    if (tokenResult && !tokenResult.ok) {
      return NextResponse.json(
        buildApiErrorBody("VALIDATION", { error: tokenResult.message }),
        { status: 400 }
      );
    }

    const admin = createServiceClient();
    if (!admin) {
      console.error("DELETE /api/push/register: SUPABASE_SERVICE_ROLE_KEY ausente");
      return NextResponse.json(
        buildApiErrorBody("SERVER", { error: USER_MESSAGES.SERVER }),
        { status: 503 }
      );
    }

    const result = await disablePushTokens(
      admin,
      user.id,
      tokenResult?.ok ? tokenResult.token : undefined
    );

    if (!result.ok) {
      return NextResponse.json(
        buildApiErrorBody("SERVER", { error: result.message }),
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, disabled: result.disabled });
  } catch (err) {
    const message = err instanceof Error ? err.message : USER_MESSAGES.SERVER;
    console.error("DELETE /api/push/register:", message);
    return NextResponse.json(
      buildApiErrorBody("SERVER", { error: USER_MESSAGES.SERVER }),
      { status: 500 }
    );
  }
}
