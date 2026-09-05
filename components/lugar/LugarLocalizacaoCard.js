"use client";

import { useEffect, useState } from "react";

function MapIcon({ className = "h-10 w-10" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <path d="M12 21s7-4.5 7-11a7 7 0 10-14 0c0 6.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function ExternalLinkIcon({ className = "h-4 w-4" }) {
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
      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
      <path d="M15 3h6v6" />
      <path d="M10 14L21 3" />
    </svg>
  );
}

function LayersIcon({ className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function MapaFallbackLink({ href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-52 w-full flex-col items-center justify-center gap-2 bg-[#eef6f2] text-[#1a4a3a]"
    >
      <MapIcon />
      <span className="text-sm font-semibold">Ver no Google Maps</span>
    </a>
  );
}

function MapPinOverlay() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-[42%] z-10 -translate-x-1/2 -translate-y-full"
      aria-hidden
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a4a3a] shadow-[0_6px_20px_rgba(26,74,58,0.45)] ring-4 ring-white/90">
        <MapIcon className="h-5 w-5 text-white" />
      </div>
      <div className="mx-auto -mt-1 h-2 w-2 rotate-45 bg-[#1a4a3a]" />
    </div>
  );
}

/**
 * Seção de localização com mapa estático, endereço e CTA para abrir no app de mapas.
 * @param {object} props
 * @param {"default"|"airbnb"} [props.variant="default"]
 * @returns {import("react").ReactElement}
 */
export default function LugarLocalizacaoCard({
  nome,
  endereco,
  mapUrl,
  staticMapSrc,
  latitude,
  longitude,
  onAbrirMapa,
  variant = "default",
}) {
  const [mapLoadFailed, setMapLoadFailed] = useState(false);
  const isAirbnb = variant === "airbnb";

  const lat = Number(latitude);
  const lng = Number(longitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
  const googleMapsHref = hasCoords
    ? `https://www.google.com/maps?q=${lat},${lng}`
    : mapUrl;

  const showStaticMap = Boolean(staticMapSrc) && !mapLoadFailed;

  useEffect(() => {
    setMapLoadFailed(false);
  }, [staticMapSrc]);

  if (!endereco?.trim()) return null;

  const mapHeight = isAirbnb ? "h-52" : "h-48";
  const shellClass = isAirbnb
    ? "overflow-hidden rounded-[24px] bg-white shadow-[0_8px_32px_rgba(26,46,40,0.07)] ring-1 ring-[#e8eeee]"
    : "overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e8eeee]";

  return (
    <section className={isAirbnb ? "" : "mt-5"}>
      {!isAirbnb && (
        <h2 className="mb-3 text-sm font-bold text-[#1a2e28]">Localização</h2>
      )}
      <div className={shellClass}>
        {showStaticMap ? (
          <button
            type="button"
            onClick={onAbrirMapa}
            className="relative block w-full"
            aria-label="Ver no mapa"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={staticMapSrc}
              alt={`Mapa de ${nome}`}
              className={`${mapHeight} w-full object-cover`}
              onError={() => setMapLoadFailed(true)}
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1a2e28]/40 via-transparent to-black/5" />
            {isAirbnb && <MapPinOverlay />}
            {isAirbnb && (
              <span
                className="pointer-events-none absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/90 text-[#1a4a3a] shadow-md backdrop-blur-md"
                aria-hidden
              >
                <LayersIcon />
              </span>
            )}
          </button>
        ) : googleMapsHref ? (
          <MapaFallbackLink href={googleMapsHref} />
        ) : (
          <div
            className={`flex ${mapHeight} items-center justify-center bg-[#eef6f2] text-sm text-[#5a6b66]`}
          >
            Mapa indisponível
          </div>
        )}
        <div className={isAirbnb ? "px-4 pb-4 pt-3" : "p-4"}>
          <p className="text-sm leading-relaxed text-[#5a6b66]">{endereco}</p>
          <button
            type="button"
            onClick={onAbrirMapa}
            className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a4a3a] py-3 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(26,74,58,0.25)] transition-transform active:scale-[0.98] ${
              isAirbnb ? "" : "py-2.5 active:opacity-90"
            }`}
          >
            {isAirbnb && <ExternalLinkIcon />}
            Ver no mapa
          </button>
          {mapUrl && (
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sr-only"
            >
              Abrir endereço no Google Maps
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
