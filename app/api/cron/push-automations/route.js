import { NextResponse } from "next/server";
import { processPushCampaigns } from "@/lib/pushCampaigns";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyCronSecret } from "@/lib/verifyCronSecret";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron diário das campanhas automáticas de push.
 * Auth: CRON_SECRET (Bearer ou header x-cron-secret).
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<import("next/server").NextResponse>}
 */
export async function GET(request) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY ausente" },
      { status: 503 }
    );
  }

  try {
    const result = await processPushCampaigns(admin);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[cron/push-automations]", error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Falha nas automações de push.",
      },
      { status: 500 }
    );
  }
}
