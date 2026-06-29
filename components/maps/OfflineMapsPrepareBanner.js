"use client";

import { OFFLINE_MAPS_PREPARE_BANNER } from "@/lib/offlineMaps";

/**
 * Banner preventivo — baixar mapa antes de ir à trilha/praia.
 * @returns {import("react").ReactElement}
 */
export default function OfflineMapsPrepareBanner() {
  return (
    <div
      className="mb-5 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950"
      role="note"
    >
      <p className="font-semibold">Dica antes de sair</p>
      <p className="mt-1 text-amber-900/90">{OFFLINE_MAPS_PREPARE_BANNER}</p>
    </div>
  );
}
