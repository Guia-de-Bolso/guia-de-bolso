"use client";

import { useState } from "react";
import { OFFLINE_MAPS_COORDS_HINT } from "@/lib/offlineMaps";
import { formatCoordinatesLabel } from "@/lib/mapsCoordinates";

/**
 * Card com coordenadas para uso offline.
 * @param {object} props
 * @param {{ latitude: number, longitude: number }|null} props.coordinates
 * @returns {import("react").ReactElement|null}
 */
export default function OfflineCoordinatesCard({ coordinates }) {
  const [toast, setToast] = useState("");
  const label = formatCoordinatesLabel(coordinates);

  if (!label) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(label);
      setToast("Coordenadas copiadas!");
      window.setTimeout(() => setToast(""), 2500);
    } catch {
      setToast("Não foi possível copiar automaticamente.");
      window.setTimeout(() => setToast(""), 3000);
    }
  }

  return (
    <div className="mb-5 rounded-2xl border border-[#1a4a3a]/15 bg-[#e8f5f1] px-4 py-3">
      <p className="text-sm font-semibold text-[#1a4a3a]">Localização (offline)</p>
      <p className="mt-1 text-xs leading-relaxed text-[#3d5c52]">{OFFLINE_MAPS_COORDS_HINT}</p>
      <p className="mt-2 font-mono text-sm text-[#1a2e28]">{label}</p>
      <button
        type="button"
        onClick={handleCopy}
        className="mt-3 rounded-xl bg-[#1a4a3a] px-4 py-2 text-xs font-semibold text-white active:scale-[0.98]"
      >
        Copiar coordenadas
      </button>
      {toast ? (
        <p className="mt-2 text-xs font-medium text-[#1a4a3a]" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
