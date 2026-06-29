"use client";

import { useId, useState } from "react";
import BottomSheetShell from "@/components/BottomSheetShell";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import {
  OFFLINE_MAPS_DOWNLOAD_TIPS,
  OFFLINE_MAPS_SHEET_BODY,
  OFFLINE_MAPS_SHEET_TITLE,
} from "@/lib/offlineMaps";
import { formatCoordinatesLabel } from "@/lib/mapsCoordinates";
import { NAV_APPS } from "@/lib/navApps";

/**
 * Sheet offline — orienta sobre mapas e permite abrir destino ou copiar coordenadas.
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {() => void} props.onClose
 * @param {string} props.destinationName
 * @param {{ latitude: number, longitude: number }|null} [props.coordinates]
 * @param {string|null} [props.address]
 * @param {{ google: string, apple: string, waze: string }|null} [props.mapsUrls]
 * @param {(message: string) => void} [props.onToast]
 * @returns {import("react").ReactElement|null}
 */
export default function OfflineMapsSheet({
  isOpen,
  onClose,
  destinationName,
  coordinates,
  address,
  mapsUrls,
  onToast,
}) {
  const titleId = useId();
  const [showTips, setShowTips] = useState(false);
  const { sheetRef, scrollAreaRef, dragY, isDragging, sheetMotionStyle } = useBottomSheetDrag({
    isOpen,
    onClose,
  });

  const coordsLabel = formatCoordinatesLabel(coordinates);

  function openMapsApp(appKey) {
    const url = mapsUrls?.[appKey];
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  }

  async function copyCoordinates() {
    if (!coordsLabel) return;

    try {
      await navigator.clipboard.writeText(coordsLabel);
      onToast?.("Coordenadas copiadas!");
    } catch {
      onToast?.("Não foi possível copiar. Anote: " + coordsLabel);
    }
  }

  return (
    <BottomSheetShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy={titleId}
      sheetRef={sheetRef}
      scrollRef={scrollAreaRef}
      sheetStyle={sheetMotionStyle}
      isDragging={isDragging}
      dragY={dragY}
    >
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <h2 id={titleId} className="text-lg font-bold text-[#1a2e28]">
          {OFFLINE_MAPS_SHEET_TITLE}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5a6b66]">{OFFLINE_MAPS_SHEET_BODY}</p>

        <div className="mt-4 rounded-2xl bg-[#f0f4f3] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wide text-[#1a4a3a]">Destino</p>
          <p className="mt-1 text-sm font-semibold text-[#1a2e28]">{destinationName}</p>
          {coordsLabel ? (
            <p className="mt-1 font-mono text-xs text-[#5a6b66]">{coordsLabel}</p>
          ) : null}
          {address ? <p className="mt-1 text-xs text-[#5a6b66]">{address}</p> : null}
        </div>

        <div className="mt-4 space-y-2">
          {NAV_APPS.map((app) => (
            <button
              key={app.key}
              type="button"
              disabled={!mapsUrls?.[app.key]}
              onClick={() => openMapsApp(app.key)}
              className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-left ring-1 ring-[#e8eeee] transition active:scale-[0.99] enabled:hover:bg-[#f7faf9] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f0f4f3] text-xl">
                {app.emoji}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-semibold text-[#1a2e28]">Abrir no {app.label}</span>
                <span className="mt-0.5 block text-xs text-[#5a6b66]">
                  Funciona se o mapa da região já estiver baixado
                </span>
              </span>
            </button>
          ))}
        </div>

        {coordsLabel ? (
          <button
            type="button"
            onClick={copyCoordinates}
            className="mt-3 w-full min-h-[48px] rounded-2xl bg-[#e8f5f1] py-3 text-sm font-semibold text-[#1a4a3a] ring-1 ring-[#1a4a3a]/15 active:scale-[0.99]"
          >
            Copiar coordenadas
          </button>
        ) : null}

        <button
          type="button"
          onClick={() => setShowTips((value) => !value)}
          className="mt-3 w-full min-h-[44px] rounded-xl py-2.5 text-sm font-semibold text-[#1a4a3a] underline decoration-[#1a4a3a]/30"
          aria-expanded={showTips}
        >
          {showTips ? "Ocultar dicas" : "Como baixar mapa offline"}
        </button>

        {showTips ? (
          <ul className="mt-2 space-y-2 rounded-2xl bg-[#f7faf9] p-4 ring-1 ring-[#e8eeee]">
            {OFFLINE_MAPS_DOWNLOAD_TIPS.map((tip) => (
              <li key={tip.app} className="text-sm leading-relaxed text-[#5a6b66]">
                <span className="font-semibold text-[#1a2e28]">{tip.app}:</span> {tip.steps}
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full min-h-[44px] rounded-xl py-3 text-sm font-semibold text-[#5a6b66]"
        >
          Fechar
        </button>
      </div>
    </BottomSheetShell>
  );
}
