"use client";

import { useEffect, useState } from "react";
import AdminNavLinkItem from "@/components/admin/AdminNavLinkItem";
import { AdminNavIcon } from "@/components/admin/adminNavConfig";
import {
  getVisibleAdminNavGroups,
  isAdminNavGroupActive,
  shouldAdminNavGroupStartOpen,
} from "@/lib/adminNav";

/**
 * Lista agrupada do menu admin (sidebar expandida ou drawer).
 * @param {object} props
 * @param {string} props.pathname
 * @param {string} [props.role]
 * @param {boolean} [props.collapsed]
 * @param {() => void} [props.onNavigate]
 * @returns {import("react").JSX.Element}
 */
export default function AdminNavSections({
  pathname,
  role,
  collapsed = false,
  onNavigate,
}) {
  const groups = getVisibleAdminNavGroups(role);
  const [openById, setOpenById] = useState({});

  useEffect(() => {
    const visible = getVisibleAdminNavGroups(role);
    setOpenById((prev) => {
      const next = { ...prev };
      let changed = false;

      for (const group of visible) {
        if (!(group.id in next)) {
          next[group.id] = shouldAdminNavGroupStartOpen(group, pathname);
          changed = true;
          continue;
        }
        if (group.collapsible && isAdminNavGroupActive(group, pathname) && !next[group.id]) {
          next[group.id] = true;
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [pathname, role]);

  if (collapsed) {
    return (
      <div className="space-y-3">
        {groups.map((group, index) => (
          <div key={group.id}>
            {index > 0 && (
              <div className="mx-auto mb-3 h-px w-8 bg-white/10" aria-hidden />
            )}
            <div className="space-y-1">
              {group.links.map((link) => (
                <AdminNavLinkItem
                  key={link.href}
                  link={link}
                  pathname={pathname}
                  collapsed
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const isOpen = group.collapsible
          ? group.id in openById
            ? Boolean(openById[group.id])
            : shouldAdminNavGroupStartOpen(group, pathname)
          : true;
        const groupActive = isAdminNavGroupActive(group, pathname);

        return (
          <section key={group.id} aria-labelledby={`admin-nav-${group.id}`}>
            {group.collapsible ? (
              <button
                type="button"
                id={`admin-nav-${group.id}`}
                onClick={() =>
                  setOpenById((prev) => ({
                    ...prev,
                    [group.id]: !prev[group.id],
                  }))
                }
                aria-expanded={isOpen}
                className={`mb-1.5 flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left transition hover:bg-white/6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d4ede8]/50 ${
                  groupActive ? "text-white/90" : "text-white/45"
                }`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]">
                  {group.label}
                </span>
                <AdminNavIcon
                  name="chevron"
                  className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                    isOpen ? "rotate-0" : "-rotate-90"
                  }`}
                />
              </button>
            ) : (
              <h2
                id={`admin-nav-${group.id}`}
                className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40"
              >
                {group.label}
              </h2>
            )}

            {isOpen && (
              <div className="space-y-0.5">
                {group.links.map((link) => (
                  <AdminNavLinkItem
                    key={link.href}
                    link={link}
                    pathname={pathname}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
