import { NextResponse } from "next/server";
import { canAccessContratosAdmin } from "@/lib/adminRoles";
import { createClient } from "@/lib/supabase/server";
import { USER_MESSAGES } from "@/lib/userMessages";

/**
 * Exige sessão autenticada com papel admin (contratos comerciais — dados sensíveis).
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
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json(
        { error: USER_MESSAGES.UNAUTHORIZED, code: "UNAUTHORIZED" },
        { status: 401 }
      ),
    };
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("perfis")
    .select("id, role, nome, email")
    .eq("id", user.id)
    .maybeSingle();

  if (perfilError || !canAccessContratosAdmin(perfil?.role)) {
    return {
      error: NextResponse.json(
        { error: USER_MESSAGES.FORBIDDEN, code: "FORBIDDEN" },
        { status: 403 }
      ),
    };
  }

  return {
    supabase,
    adminUser: user,
    adminPerfil: perfil,
  };
}
