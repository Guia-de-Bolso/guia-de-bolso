"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconHome({ className = "h-[22px] w-[22px]", active = false }) {
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

function IconHeart({ className = "h-[22px] w-[22px]", active = false }) {
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

function IconGrid({ className = "h-[22px] w-[22px]", active = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.75}
      aria-hidden
    >
      <path d="M4 4h6v6H4V4zM14 4h6v6h-6V4zM4 14h6v6H4v-6zM14 14h6v6h-6v-6z" />
    </svg>
  );
}

function IconMap({ className = "h-[22px] w-[22px]", active = false }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={active ? 0 : 1.75}
      aria-hidden
    >
      <path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3z" />
      <path d="M9 3v15M15 6v15" />
    </svg>
  );
}

function IconPerson({ className = "h-[22px] w-[22px]", active = false }) {
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

const items = [
  { href: "/", label: "Início", Icon: IconHome },
  { href: "/categorias", label: "Explorar", Icon: IconGrid },
  { href: "/atrativos", label: "Atrativos", Icon: IconMap },
  { href: "/favoritos", label: "Favoritos", Icon: IconHeart },
  { href: "/perfil", label: "Perfil", Icon: IconPerson },
];

/**
 * BottomNav - Floating bottom navigation bar with primary app routes.
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-5 pb-[max(0.85rem,env(safe-area-inset-bottom))]"
      aria-label="Navegação principal"
    >
      <div className="pointer-events-auto flex w-full max-w-md items-center justify-between gap-1 rounded-[32px] border border-[#dce8e3]/90 bg-white/84 px-2 py-2 shadow-[0_-1px_0_rgba(255,255,255,0.92),0_10px_30px_rgba(12,30,25,0.11),0_2px_10px_rgba(12,30,25,0.06)] backdrop-blur-2xl backdrop-saturate-150">
        {items.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`group relative flex min-h-12 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[20px] px-1 py-1.5 transition-all duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/55 focus-visible:ring-offset-2 focus-visible:ring-offset-white ${
                active
                  ? "text-[#1a4a3a]"
                  : "text-[#6f837d] hover:bg-white/60 hover:text-[#4f635d] active:bg-white/80"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 ${
                  active
                    ? "border-[#cfe5dd] bg-[#ddf0ea] text-[#1a4a3a] shadow-[0_1px_0_rgba(255,255,255,0.85),inset_0_0_0_1px_rgba(26,74,58,0.04)]"
                    : "border-[#d7e3de] bg-white/72 text-[#6f837d] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7)] group-hover:border-[#c6d8d1] group-hover:bg-white"
                }`}
              >
                <Icon active={active} />
              </span>
              <span
                className={`text-[12px] font-semibold leading-tight transition-colors ${
                  active ? "text-[#1a4a3a]" : "text-[#6f837d]"
                }`}
              >
                {label}
              </span>
              <span
                aria-hidden
                className={`h-0.5 rounded-full bg-[#1a4a3a] transition-all duration-200 ${
                  active ? "w-6 opacity-80" : "w-2 opacity-0"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
