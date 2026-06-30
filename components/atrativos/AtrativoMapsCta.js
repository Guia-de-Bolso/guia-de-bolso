"use client";

import { useState } from "react";
import { ATRATIVO_MAPS_CTA_CLASS } from "@/components/atrativos/atrativoDetalheTokens";
import { useOfflineMode } from "@/components/OfflineModeProvider";
import OfflineCoordinatesCard from "@/components/maps/OfflineCoordinatesCard";
import OfflineMapsSheet from "@/components/maps/OfflineMapsSheet";
import { getAtrativoNome } from "@/lib/atrativoDetalheDisplay";
import {
  buildMapsUrlsForAtrativo,
  getMapAddressLabel,
  parseMapCoordinates,
} from "@/lib/mapsCoordinates";

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
 * CTA para abrir rota no mapa — com fluxo offline dedicado.
 * @param {object} props
 * @param {string} props.href
 * @param {string|null} [props.subtitulo]
 * @param {object} [props.rota]
 * @param {object|null} [props.localizacao]
 * @returns {import("react").ReactElement}
 */
export default function AtrativoMapsCta({ href, subtitulo, rota, localizacao }) {
  const { offlineLimited } = useOfflineMode();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState("");

  const destinationName = rota ? getAtrativoNome(rota) : "Destino";
  const coordinates = parseMapCoordinates(localizacao);
  const mapsUrls = buildMapsUrlsForAtrativo(rota, localizacao);
  const address = getMapAddressLabel(localizacao);

  function openMaps() {
    if (offlineLimited) {
      setSheetOpen(true);
      return;
    }
    window.open(href, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {offlineLimited ? <OfflineCoordinatesCard coordinates={coordinates} /> : null}

      <button type="button" onClick={openMaps} className={`${ATRATIVO_MAPS_CTA_CLASS} w-full text-left`}>
        <span className="flex items-center gap-2 text-[15px] font-bold">
          <NavigateIcon />
          Navegar no Maps
        </span>
        {subtitulo ? (
          <span className="text-xs font-medium text-white/75">{subtitulo}</span>
        ) : null}
      </button>

      {toast ? (
        <p className="mt-2 text-center text-xs font-medium text-[#1a4a3a]" role="status">
          {toast}
        </p>
      ) : null}

      <OfflineMapsSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        destinationName={destinationName}
        coordinates={coordinates}
        address={address}
        mapsUrls={mapsUrls}
        onToast={(message) => {
          setToast(message);
          window.setTimeout(() => setToast(""), 2500);
        }}
      />
    </>
  );
}
