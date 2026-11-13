import { NextResponse } from "next/server";
import { decideAdminApiAccess } from "@/lib/adminRoles";
import { createClient } from "@/lib/supabase/server";
import { getVerifiedUser } from "@/lib/supabase/session";
import { USER_MESSAGES } from "@/lib/userMessages";

/**
 * Exige sessão autenticada com papel dev (contratos comerciais — dados sensíveis).
 * @returns {Promise<
 *   | { error: import('next/server').NextResponse }
 *   | {
 *       supabase: import('@supabase/supabase-js').SupabaseClient;
 *       adminUser: import('@supabase/supabase-js').User;
 *       adminPerfil: { id: string; role?: string; nome?: string; email?: string };
 *     }
 * >}
 */
export async function requireAdminOnlyApi() {
  const supabase = await createClient();
  const user = await getVerifiedUser(supabase);

  const { data: perfil, error: perfilError } = user?.id
    ? await supabase
        .from("perfis")
        .select("id, role, nome, email")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null, error: null };

  if (perfilError) {
    console.error("[requireAdminOnlyApi]", perfilError.message);
  }

  const decision = decideAdminApiAccess({
    user,
    perfil: perfilError ? null : perfil,
    devOnly: true,
  });

  if (!decision.ok) {
    const code = decision.code;
    return {
      error: NextResponse.json(
        { error: code === "UNAUTHORIZED" ? USER_MESSAGES.UNAUTHORIZED : USER_MESSAGES.FORBIDDEN, code },
        { status: decision.status }
      ),
    };
  }

  return {
    supabase,
    adminUser: user,
    adminPerfil: perfil,
  };
}
