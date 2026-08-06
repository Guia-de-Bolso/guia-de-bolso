"use client";

import Link from "next/link";
import AdminNavSections from "@/components/admin/AdminNavSections";
import Logo from "@/components/Logo";
import {
  AdminNavIcon,
  getAdminInitials,
} from "@/components/admin/adminNavConfig";
import { getRoleLabel } from "@/lib/adminRoles";

/**
 * Sidebar verde fixa (desktop / notebook).
 * @param {object} props
 * @param {string} props.pathname
 * @param {boolean} props.collapsed
 * @param {() => void} props.onToggleCollapse
 * @param {{ nome?: string, foto_url?: string, role?: string }|null} [props.perfil]
 * @returns {import("react").JSX.Element}
 */
export default function AdminSidebar({ pathname, collapsed, onToggleCollapse, perfil }) {
  const displayName = perfil?.nome || "Administrador";
  const initials = getAdminInitials(displayName);
  const roleLabel = getRoleLabel(perfil?.role);

  return (
    <aside
      className={`hidden shrink-0 flex-col border-r border-[#0f3d2f] bg-[#1a4a3a] text-white transition-[width] duration-200 ease-out lg:flex ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      <div
        className={`flex h-16 items-center border-b border-white/10 ${
          collapsed ? "justify-center px-2" : "justify-between gap-2 px-4"
        }`}
      >
        {!collapsed ? (
          <Link
            href="/admin"
            className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ede8]/50"
          >
            <Logo size="sm" variant="light" />
            <span className="min-w-0">
              <span className="block truncate text-[11px] font-medium uppercase tracking-wider text-white/55">
                Painel admin
              </span>
            </span>
          </Link>
        ) : (
          <Link
            href="/admin"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ede8]/50"
            title="Guia de Bolso — Admin"
          >
            <Logo size="xs" variant="light" />
          </Link>
        )}
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ede8]/50"
            aria-label="Recolher menu"
          >
            <AdminNavIcon name="collapse" className="h-5 w-5" />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center border-b border-white/10 py-2">
          <button
            type="button"
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ede8]/50"
            aria-label="Expandir menu"
          >
            <AdminNavIcon name="collapse" className="h-5 w-5 rotate-180" />
          </button>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Menu do painel">
        <AdminNavSections
          pathname={pathname}
          role={perfil?.role}
          collapsed={collapsed}
        />
      </nav>

      <div
        className={`mt-auto border-t border-white/10 p-3 ${
          collapsed ? "flex flex-col items-center gap-2" : ""
        }`}
      >
        <Link
          href="/"
          className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-white/75 transition hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ede8]/50 ${
            collapsed ? "justify-center px-2" : ""
          }`}
          title={collapsed ? "Voltar ao app" : undefined}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
            <AdminNavIcon name="home" className="h-5 w-5" />
          </span>
          {!collapsed && <span>Voltar ao app</span>}
        </Link>

        <div
          className={`mt-2 flex items-center gap-3 rounded-xl bg-white/6 px-3 py-2.5 ${
            collapsed ? "justify-center px-2" : ""
          }`}
          title={collapsed ? displayName : undefined}
        >
          {perfil?.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={perfil.foto_url}
              alt=""
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/20"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d4ede8] text-xs font-bold text-[#1a4a3a]">
              {initials}
            </span>
          )}
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">{displayName}</p>
              <p className="truncate text-[11px] text-white/50">{roleLabel}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
