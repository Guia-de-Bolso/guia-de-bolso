import { redirect } from "next/navigation";
import { canAccessAdmin } from "@/lib/adminRoles";
import { createClient } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/supabase/session";

/**
 * Guard de servidor para todas as rotas /admin (complementa useAdminAuth no cliente).
 */
export default async function AdminLayout({ children }) {
  const supabase = await createClient();
  const user = await getSessionUser(supabase);

  if (!user) {
    redirect("/login?next=/admin");
  }

  const { data: perfil, error } = await supabase
    .from("perfis")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !canAccessAdmin(perfil?.role)) {
    redirect("/?admin=denied");
  }

  return children;
}
