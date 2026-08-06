"use client";

import Link from "next/link";
import { useEffect } from "react";
import AdminNavSections from "@/components/admin/AdminNavSections";
import Logo from "@/components/Logo";
import {
  AdminNavIcon,
  getAdminInitials,
} from "@/components/admin/adminNavConfig";
import { getRoleLabel } from "@/lib/adminRoles";

/**
 * Drawer de navegação (mobile e tablet).
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string} props.pathname
 * @param {{ nome?: string, foto_url?: string, role?: string }|null} [props.perfil]
 * @returns {import("react").JSX.Element|null}
 */
export default function AdminNavDrawer({ open, onClose, pathname, perfil }) {
  const displayName = perfil?.nome || "Administrador";
  const initials = getAdminInitials(displayName);
  const roleLabel = getRoleLabel(perfil?.role);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fecha ao mudar de rota
  }, [pathname]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] transition-opacity lg:hidden"
        aria-hidden
        onClick={onClose}
      />
      <aside
        className="fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,280px)] flex-col bg-[#1a4a3a] text-white shadow-2xl transition-transform duration-200 ease-out lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu do painel admin"
      >
        <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
          <Link
            href="/admin"
            onClick={onClose}
            className="flex min-w-0 items-center gap-2.5"
          >
            <Logo size="sm" variant="light" />
            <span className="min-w-0">
              <span className="block text-[11px] font-medium uppercase tracking-wider text-white/55">
                Painel admin
              </span>
            </span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-white/80 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ede8]/50"
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu do painel">
          <AdminNavSections
            pathname={pathname}
            role={perfil?.role}
            onNavigate={onClose}
          />
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            onClick={onClose}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/8 hover:text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <AdminNavIcon name="home" />
            </span>
            Voltar ao app
          </Link>

          <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/6 px-3 py-2.5">
            {perfil?.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={perfil.foto_url}
                alt=""
                className="h-9 w-9 rounded-full object-cover ring-2 ring-white/20"
              />
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d4ede8] text-xs font-bold text-[#1a4a3a]">
                {initials}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{displayName}</p>
              <p className="truncate text-[11px] text-white/50">{roleLabel}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
