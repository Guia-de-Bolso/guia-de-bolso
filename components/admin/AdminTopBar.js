"use client";

import AdminAlertsBell from "@/components/admin/AdminAlertsBell";
import { AdminNavIcon } from "@/components/admin/adminNavConfig";

/**
 * Barra superior sticky do painel admin.
 * @param {object} props
 * @param {string} props.title
 * @param {() => void} props.onOpenMobileNav
 * @param {() => void} [props.onToggleSidebar]
 * @param {boolean} [props.showSidebarToggle]
 * @param {string} [props.adminUserId]
 * @param {string} [props.adminRole]
 * @param {import("react").ReactNode} [props.headerAction]
 * @returns {import("react").JSX.Element}
 */
export default function AdminTopBar({
  title,
  onOpenMobileNav,
  onToggleSidebar,
  showSidebarToggle = false,
  adminUserId,
  adminRole,
  headerAction,
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-[#dce5e2] bg-[#f0f4f3]/95 backdrop-blur-md">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:gap-3 md:px-6 md:py-3 lg:px-8">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={onOpenMobileNav}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1a4a3a] shadow-sm ring-1 ring-black/5 transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30 lg:hidden"
            aria-label="Abrir menu de navegação"
          >
            <AdminNavIcon name="menu" />
          </button>

          {showSidebarToggle && onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1a4a3a] shadow-sm ring-1 ring-black/5 transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30 lg:flex"
              aria-label="Alternar largura do menu"
            >
              <AdminNavIcon name="collapse" />
            </button>
          )}

          <nav
            className="min-w-0 flex-1 text-sm text-[#5a6b66]"
            aria-label="Breadcrumb"
          >
            <ol className="flex items-center gap-1.5">
              <li className="shrink-0 font-semibold text-[#1a4a3a]">Admin</li>
              <li aria-hidden className="shrink-0 text-[#9aa8a3]">
                /
              </li>
              <li className="truncate font-medium text-[#1a2e28]">{title}</li>
            </ol>
          </nav>
        </div>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto md:gap-3">
          {headerAction ? (
            <div className="order-1 flex max-w-full items-center overflow-x-auto sm:order-none">
              {headerAction}
            </div>
          ) : null}
          <div className="order-2 shrink-0 sm:order-none">
            <AdminAlertsBell userId={adminUserId} adminRole={adminRole} />
          </div>
        </div>
      </div>
    </header>
  );
}
