"use client";

import { STICKY_CTA_ABOVE_NAV_CLASS } from "@/lib/appChrome";

function NavigateIcon({ className = "h-4 w-4 shrink-0" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 11l19-9-9 19-2-8-8-2z" />
    </svg>
  );
}

/**
 * Barra fixa inferior com CTA centralizado.
 * @param {{ label: string, onClick: () => void }} props
 * @returns {import("react").JSX.Element}
 */
export default function LugarCtaBarAirbnb({ label, onClick }) {
  return (
    <div className={`${STICKY_CTA_ABOVE_NAV_CLASS} border-t border-[#e8eeee]/90 bg-white/92 backdrop-blur-xl`}>
      <div className="mx-auto flex max-w-md justify-center px-4 py-3">
        <button
          type="button"
          onClick={onClick}
          className="flex w-full max-w-sm items-center justify-center gap-2.5 rounded-xl bg-[#1a4a3a] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_6px_24px_rgba(26,74,58,0.28)] transition-transform active:scale-[0.98]"
        >
          <NavigateIcon className="h-4 w-4 shrink-0 text-white/95" />
          <span>{label}</span>
        </button>
      </div>
    </div>
  );
}
