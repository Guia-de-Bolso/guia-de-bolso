"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useOfflineMode } from "@/components/OfflineModeProvider";
import { BOTTOM_NAV_ROUTES } from "@/lib/bottomNavRoutes";
import { resolveBottomNavTab } from "@/lib/tabShell";
import {
  OFFLINE_NAV_BLOCKED_MESSAGE,
  isOfflineNavHrefAllowed,
} from "@/lib/offlineNavigation";

function IconHome({ className = "h-5 w-5", active = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.75}
      aria-hidden
    >
      <path d="M3 10.5L12 3l9 7.5V21h-6v-6H9v6H3V10.5z" />
    </svg>
  );
}

function IconCompass({ className = "h-5 w-5", active = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.75}
      aria-hidden
    >
      {active ? (
        <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.5 6.5l-2.2 5.3-5.3 2.2 2.2-5.3 5.3-2.2z" />
      ) : (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M15.5 8.5l-2.2 5.3-5.3 2.2 2.2-5.3 5.3-2.2z" />
        </>
      )}
    </svg>
  );
}

function IconLandscape({ className = "h-5 w-5", active = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.75}
      aria-hidden
    >
      {active ? (
        <path d="M3 5a2 2 0 012-2h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm4.5 7.5L5 16h14l-4.5-6-3 4-2-2.5z" />
      ) : (
        <>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 15l4.5-4.5 3 3 3.5-4.5L21 15" />
        </>
      )}
    </svg>
  );
}

function IconHeart({ className = "h-5 w-5", active = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.75}
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function IconPerson({ className = "h-5 w-5", active = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.75}
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <path d="M12 11a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  );
}

const NAV_ICONS = {
  "/": IconHome,
  "/categorias": IconCompass,
  "/atrativos": IconLandscape,
  "/favoritos": IconHeart,
  "/perfil": IconPerson,
};

const items = BOTTOM_NAV_ROUTES.map((route) => ({
  ...route,
  Icon: NAV_ICONS[route.href],
}));

const navItemClass = (active, blocked) =>
  `group relative flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1.5 rounded-[16px] px-1 py-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
    blocked
      ? "cursor-not-allowed text-[#9aaba5] opacity-55"
      : active
        ? "bg-[#e7f3ef] text-[#1a4a3a] active:scale-[0.98]"
        : "text-[#6f837d] hover:bg-[#f4f8f6]/80 hover:text-[#4f635d] active:scale-[0.98]"
  }`;

/**
 * BottomNav - Floating bottom navigation bar with primary app routes.
 */
export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { offlineLimited } = useOfflineMode();
  const [offlineToast, setOfflineToast] = useState("");

  const prefetchRoute = useCallback(
    (href) => {
      if (offlineLimited && !isOfflineNavHrefAllowed(href)) return;
      router.prefetch(href);
    },
    [router, offlineLimited]
  );

  useEffect(() => {
    items.forEach(({ href }) => prefetchRoute(href));
  }, [prefetchRoute]);

  function showOfflineMessage() {
    setOfflineToast(OFFLINE_NAV_BLOCKED_MESSAGE);
    window.setTimeout(() => setOfflineToast(""), 4500);
  }

  return (
    <>
      {offlineToast ? (
        <div
          className="pointer-events-none fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border border-[#1a4a3a]/15 bg-[#1a4a3a] px-4 py-3 text-center text-sm font-medium leading-snug text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {offlineToast}
        </div>
      ) : null}

      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[max(0.65rem,env(safe-area-inset-bottom))] app-bottom-nav"
        aria-label="Navegação principal"
      >
        <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-0.5 rounded-[26px] bg-white/94 px-1.5 py-1.5 shadow-[0_8px_24px_rgba(12,30,25,0.1)] ring-1 ring-[#dce8e3]/75 backdrop-blur-xl backdrop-saturate-150">
          {items.map(({ href, label, Icon }) => {
            const active = resolveBottomNavTab(pathname).root === href;
            const blocked = offlineLimited && !isOfflineNavHrefAllowed(href);

            if (blocked) {
              return (
                <button
                  key={href}
                  type="button"
                  onClick={showOfflineMessage}
                  aria-label={`${label} — indisponível offline`}
                  aria-disabled="true"
                  className={navItemClass(active, true)}
                >
                  <Icon active={active} />
                  <span className="text-[11px] font-semibold leading-none tracking-wide">
                    {label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={href}
                href={href}
                prefetch
                aria-label={label}
                className={navItemClass(active, false)}
                aria-current={active ? "page" : undefined}
                onTouchStart={() => prefetchRoute(href)}
                onMouseEnter={() => prefetchRoute(href)}
                onFocus={() => prefetchRoute(href)}
              >
                <Icon active={active} />
                <span
                  className={`text-[11px] font-semibold leading-none tracking-wide transition-colors ${
                    active ? "text-[#1a4a3a]" : "text-[#6f837d]"
                  }`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
