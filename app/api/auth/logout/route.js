import { NextResponse } from "next/server";
import { registrarLog } from "@/lib/logs";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";
import { USER_MESSAGES } from "@/lib/userMessages";

/**
 * Encerra a sessão no servidor (cookies) para logout confiável no app.
 * @returns {Promise<import("next/server").NextResponse>}
 */
export async function POST() {
  try {
    const supabase = await createClient();
    const user = await getSessionUser(supabase);

    if (user) {
      await registrarLog(supabase, user, "logout");
    }

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      console.error("POST /api/auth/logout:", signOutError.message);
      return NextResponse.json(
        { error: USER_MESSAGES.SERVER, code: "SERVER" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/logout:", err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: USER_MESSAGES.SERVER, code: "SERVER" },
      { status: 500 }
    );
  }
}
