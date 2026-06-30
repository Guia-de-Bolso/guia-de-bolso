"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useOfflineMode } from "@/components/OfflineModeProvider";
import { GALLERY_FLOAT_BTN_CLASS, GALLERY_FLOAT_ICON_CLASS } from "@/components/lugar/airbnb/lugarAirbnbTokens";
import { OFFLINE_MAPS_PREPARE_BANNER, shouldShowOfflineMapsPrepareBanner } from "@/lib/offlineMaps";

function InfoIcon({ className = GALLERY_FLOAT_ICON_CLASS }) {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

/**
 * Ícone de dica de mapas offline — toast ao tocar (só online, rotas relevantes).
 * @param {object} props
 * @param {string} [props.categoria]
 * @param {string} [props.buttonClassName]
 * @param {string} [props.iconClassName]
 * @returns {import("react").ReactElement|null}
 */
export default function OfflineMapsInfoButton({
  categoria,
  buttonClassName = GALLERY_FLOAT_BTN_CLASS,
  iconClassName = GALLERY_FLOAT_ICON_CLASS,
}) {
  const pathname = usePathname();
  const { isOnline } = useOfflineMode();
  const [visible, setVisible] = useState(false);

  if (!shouldShowOfflineMapsPrepareBanner(pathname, isOnline, categoria)) {
    return null;
  }

  function handleClick() {
    setVisible(true);
    window.setTimeout(() => setVisible(false), 5000);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={`${buttonClassName} transition-transform active:scale-95`}
        aria-label="Dica: baixar mapa antes de sair"
      >
        <InfoIcon className={iconClassName} />
      </button>

      {visible ? (
        <div
          className="pointer-events-none fixed left-4 right-4 top-[max(4.5rem,env(safe-area-inset-top))] z-[65] mx-auto max-w-md rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <p className="font-semibold">Dica antes de sair</p>
          <p className="mt-1 text-amber-900/90">{OFFLINE_MAPS_PREPARE_BANNER}</p>
        </div>
      ) : null}
    </>
  );
}
