import { NextResponse } from "next/server";
import { processPushCampaigns } from "@/lib/pushCampaigns";
import { requireAdminApi } from "@/lib/requireAdminApi";
import { createServiceClient } from "@/lib/supabase/service";
import { buildApiErrorBody, USER_MESSAGES } from "@/lib/userMessages";

export const maxDuration = 60;

/**
 * Processa eventos pendentes após uma alteração de conteúdo no admin.
 * Não cria campanhas manuais; exige role admin/dev.
 * @returns {Promise<import("next/server").NextResponse>}
 */
export async function POST() {
  try {
    const auth = await requireAdminApi();
    if (auth.error) return auth.error;

    const admin = createServiceClient();
    if (!admin) {
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 503 });
    }

    const result = await processPushCampaigns(admin, { prepareScheduled: false });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("POST /api/admin/push/process:", error);
    return NextResponse.json(
      buildApiErrorBody("SERVER", { error: USER_MESSAGES.SERVER }),
      { status: 500 }
    );
  }
}
