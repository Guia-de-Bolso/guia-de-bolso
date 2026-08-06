"use client";

import Link from "next/link";
import { AdminNavIcon } from "@/components/admin/adminNavConfig";
import { isAdminNavActive } from "@/lib/adminNav";

/**
 * @param {object} props
 * @param {import("@/lib/adminNav").AdminNavLink} props.link
 * @param {string} props.pathname
 * @param {boolean} [props.collapsed]
 * @param {() => void} [props.onNavigate]
 * @returns {import("react").JSX.Element}
 */
export default function AdminNavLinkItem({ link, pathname, collapsed = false, onNavigate }) {
  const active = isAdminNavActive(pathname, link.href);

  return (
    <Link
      href={link.href}
      onClick={onNavigate}
      title={collapsed ? link.label : undefined}
      aria-current={active ? "page" : undefined}
      className={`group relative flex items-center gap-2.5 rounded-xl py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ede8]/60 ${
        active
          ? "bg-white/12 px-3 text-white shadow-sm ring-1 ring-inset ring-white/10"
          : "px-3 text-white/70 hover:bg-white/8 hover:text-white"
      } ${collapsed ? "justify-center px-2" : ""}`}
    >
      {active && (
        <span
          className="absolute bottom-1.5 left-0 top-1.5 w-1 rounded-r-full bg-[#d4ede8]"
          aria-hidden
        />
      )}
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
          active ? "bg-white/15 text-white" : "text-white/75 group-hover:bg-white/10 group-hover:text-white"
        }`}
      >
        <AdminNavIcon name={link.icon} className="h-[18px] w-[18px]" />
      </span>
      {!collapsed && <span className="truncate">{link.label}</span>}
    </Link>
  );
}
