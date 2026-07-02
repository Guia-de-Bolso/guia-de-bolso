"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AdminNavDrawer from "@/components/admin/AdminNavDrawer";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";
import { canAccessAdmin, canAccessAdminSection } from "@/lib/adminRoles";
import { createClient } from "@/lib/supabase";

/**
 * Hook que valida sessão Supabase e role admin; redireciona para home se não autorizado.
 * @returns {{ loading: boolean, user: import("@supabase/supabase-js").User|null, perfil: object|null }}
 */
export function useAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    /** Carrega usuário e perfil; redireciona se não autenticado ou sem permissão admin. */
    async function checkAdmin() {
      if (!supabase) {
        console.error("[admin] Supabase não configurado no cliente.");
        router.replace("/");
        return;
      }

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!currentUser) {
        router.replace("/login?next=/admin");
        return;
      }

      const { data: perfilData, error: perfilError } = await supabase
        .from("perfis")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (cancelled) return;

      if (perfilError) {
        console.error("[admin] Erro ao ler perfil (RLS?):", perfilError.message);
        router.replace("/?admin=rls");
        return;
      }

      if (!canAccessAdmin(perfilData?.role)) {
        console.warn(
          "[admin] Sem permissão. role=",
          perfilData?.role ?? "(perfil ausente)"
        );
        router.replace("/?admin=denied");
        return;
      }

      if (!canAccessAdminSection(perfilData?.role, pathname)) {
        router.replace("/admin?section=denied");
        return;
      }

      setUser(currentUser);
      setPerfil(perfilData);
      setLoading(false);
    }

    checkAdmin();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  return { loading, user, perfil };
}

/**
 * Layout do painel admin: sidebar verde (desktop), drawer (mobile/tablet) e top bar sticky.
 * @param {object} props
 * @param {string} props.title - Título da página no header.
 * @param {string} [props.subtitle] - Subtítulo opcional abaixo do título.
 * @param {import("react").ReactNode} [props.headerAction] - Ação extra alinhada à direita do header.
 * @param {string} [props.contentClassName] - Classes extras no `<main>`.
 * @param {boolean} [props.showPageHeading=true] - Exibe bloco título/subtítulo abaixo da top bar.
 * @param {import("react").ReactNode} props.children - Conteúdo da página.
 * @returns {import("react").JSX.Element}
 */
export default function AdminShell({
  title,
  subtitle,
  headerAction,
  contentClassName = "",
  showPageHeading = true,
  children,
}) {
  const pathname = usePathname();
  const [adminUserId, setAdminUserId] = useState(null);
  const [adminPerfil, setAdminPerfil] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      const id = data.user?.id ?? null;
      setAdminUserId(id);

      if (!id) {
        setAdminPerfil(null);
        return;
      }

      const { data: perfilData } = await supabase
        .from("perfis")
        .select("nome, foto_url, role")
        .eq("id", id)
        .maybeSingle();

      setAdminPerfil(perfilData);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="flex min-h-screen">
        <AdminSidebar
          pathname={pathname}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
          perfil={adminPerfil}
        />

        <AdminNavDrawer
          open={mobileNavOpen}
          onClose={closeMobileNav}
          pathname={pathname}
          perfil={adminPerfil}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <AdminTopBar
            title={title}
            adminUserId={adminUserId}
            adminRole={adminPerfil?.role}
            headerAction={headerAction}
            onOpenMobileNav={() => setMobileNavOpen(true)}
            onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
            showSidebarToggle
          />

          <main className={`flex-1 ${contentClassName}`}>
            {showPageHeading && (
              <div className="border-b border-[#dce5e2]/60 px-4 pb-4 pt-5 md:px-6 md:pb-5 md:pt-6 lg:px-8 lg:pt-6">
                <h1 className="text-2xl font-bold tracking-tight text-[#1a2e28] md:text-3xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1 max-w-2xl text-sm text-[#5a6b66] md:text-base">{subtitle}</p>
                )}
              </div>
            )}

            <div
              className={`mx-auto w-full max-w-7xl px-4 pb-8 md:px-6 lg:px-8 ${
                showPageHeading ? "pt-6 md:pt-8" : "pt-4 md:pt-6"
              }`}
            >
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
