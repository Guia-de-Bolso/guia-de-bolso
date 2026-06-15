"use client";

import { ATRATIVO_MAPS_CTA_CLASS } from "@/components/atrativos/atrativoDetalheTokens";

function NavigateIcon() {
  return (
    <svg
      className="h-4 w-4 shrink-0"
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
 * CTA principal para abrir a rota no Google Maps.
 * @param {object} props
 * @param {string} props.href
 * @param {string|null} [props.subtitulo]
 */
export default function AtrativoMapsCta({ href, subtitulo }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={ATRATIVO_MAPS_CTA_CLASS}>
      <span className="flex items-center gap-2 text-[15px] font-bold">
        <NavigateIcon />
        Navegar no Maps
      </span>
      {subtitulo ? (
        <span className="text-xs font-medium text-white/75">{subtitulo}</span>
      ) : null}
    </a>
  );
}
