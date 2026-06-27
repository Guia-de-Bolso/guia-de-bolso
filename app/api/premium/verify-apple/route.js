import { NextResponse } from "next/server";
import { activatePremiumFromApplePurchase } from "@/lib/premiumActivation";
import { verifyAppleSubscription } from "@/lib/appleBillingVerify";
import { APPLE_PREMIUM_PRODUCT_ID } from "@/lib/applePremiumConfig";
import { getAuthUser, getPerfilUsageFromAdmin } from "@/lib/premiumServer";
import { reportError } from "@/lib/observability";
import { createServiceClient } from "@/lib/supabase/service";
import { buildApiErrorBody } from "@/lib/userMessages";

/**
 * Valida compra App Store e ativa Guia Premium no perfil do usuário autenticado.
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<import("next/server").NextResponse>}
 */
export async function POST(request) {
  try {
    const { user } = await getAuthUser();

    if (!user) {
      return NextResponse.json(buildApiErrorBody("LOGIN_REQUIRED"), { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const transactionId =
      typeof body?.transactionId === "string" ? body.transactionId.trim() : "";
    const productId =
      typeof body?.productId === "string" && body.productId.trim()
        ? body.productId.trim()
        : APPLE_PREMIUM_PRODUCT_ID;

    const jwsRepresentation =
      typeof body?.jwsRepresentation === "string" ? body.jwsRepresentation.trim() : null;

    if (!transactionId) {
      return NextResponse.json(
        buildApiErrorBody("VALIDATION", { error: "ID da transação é obrigatório." }),
        { status: 400 }
      );
    }

    const verification = await verifyAppleSubscription({
      transactionId,
      productId,
      jwsRepresentation,
    });

    if (!verification.valid) {
      return NextResponse.json(
        {
          error: verification.message,
          code: verification.code ?? "PURCHASE_INVALID",
        },
        { status: verification.code === "SERVER" ? 503 : 400 }
      );
    }

    const admin = createServiceClient();
    if (!admin) {
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 503 });
    }

    const activation = await activatePremiumFromApplePurchase(admin, user.id, {
      transactionId: verification.transactionId ?? transactionId,
      originalTransactionId: verification.originalTransactionId ?? transactionId,
      productId: verification.productId ?? productId,
      expiresAt: verification.expiresAt ?? null,
    });

    if (!activation.ok) {
      return NextResponse.json(
        {
          error: activation.message,
          code: activation.code ?? "SERVER",
        },
        { status: activation.code === "PURCHASE_INVALID" ? 400 : 500 }
      );
    }

    const usage = await getPerfilUsageFromAdmin(admin, user.id);

    return NextResponse.json({
      ok: true,
      usage,
    });
  } catch (err) {
    reportError(err, { route: "POST /api/premium/verify-apple" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
