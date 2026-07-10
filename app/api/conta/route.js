import { NextResponse } from "next/server";
import { deleteUserAccount } from "@/lib/deleteUserAccount";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { USER_MESSAGES } from "@/lib/userMessages";

/**
 * Exclui a conta autenticada e todos os dados associados (App Store / Play Store).
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);

    if (!user) {
      return NextResponse.json(
        { error: USER_MESSAGES.UNAUTHORIZED, code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const admin = createServiceClient();
    if (!admin) {
      console.error("DELETE /api/conta: SUPABASE_SERVICE_ROLE_KEY ausente");
      return NextResponse.json(
        { error: USER_MESSAGES.SERVER, code: "SERVER" },
        { status: 503 }
      );
    }

    await deleteUserAccount(admin, user.id);

    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : USER_MESSAGES.SERVER;
    console.error("DELETE /api/conta:", message);
    return NextResponse.json(
      { error: message, code: "SERVER" },
      { status: 500 }
    );
  }
}
