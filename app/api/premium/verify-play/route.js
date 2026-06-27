import { NextResponse } from "next/server";
import { activatePremiumFromPlayPurchase } from "@/lib/premiumActivation";
import { verifyPlaySubscription } from "@/lib/playBillingVerify";
import { PLAY_PREMIUM_PRODUCT_ID } from "@/lib/playPremiumConfig";
import { getAuthUser, getPerfilUsageFromAdmin } from "@/lib/premiumServer";
import { reportError } from "@/lib/observability";
import { createServiceClient } from "@/lib/supabase/service";
import { buildApiErrorBody } from "@/lib/userMessages";

/**
 * Valida compra Google Play e ativa Guia Premium no perfil do usuário autenticado.
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
    const purchaseToken =
      typeof body?.purchaseToken === "string" ? body.purchaseToken.trim() : "";
    const productId =
      typeof body?.productId === "string" && body.productId.trim()
        ? body.productId.trim()
        : PLAY_PREMIUM_PRODUCT_ID;

    if (!purchaseToken) {
      return NextResponse.json(
        buildApiErrorBody("VALIDATION", { error: "Token da compra é obrigatório." }),
        { status: 400 }
      );
    }

    const verification = await verifyPlaySubscription({ purchaseToken, productId });

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

    const activation = await activatePremiumFromPlayPurchase(admin, user.id, {
      purchaseToken: verification.purchaseToken,
      productId: verification.productId,
      expiresAt: verification.expiresAt,
      orderId: verification.orderId,
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
    reportError(err, { route: "POST /api/premium/verify-play" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
