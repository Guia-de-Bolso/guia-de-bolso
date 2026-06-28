"use client";

import { formatOfflineSavedAt } from "@/lib/favoritosOffline";

/**
 * Indicador de visualização offline em detalhe de favorito.
 * @param {object} props
 * @param {string|null|undefined} [props.savedAt]
 * @returns {import("react").ReactElement|null}
 */
export default function OfflineFavoritoBadge({ savedAt }) {
  const label = formatOfflineSavedAt(savedAt);

  return (
    <div
      className="mx-auto mb-4 max-w-md px-4 pt-safe-top"
      role="status"
    >
      <div className="rounded-xl border border-[#1a4a3a]/15 bg-[#e8f5f1] px-3 py-2 text-xs leading-relaxed text-[#1a4a3a]">
        <span className="font-semibold">Modo offline</span>
        {label ? (
          <span className="text-[#3d5c52]">{` — salvo em ${label}`}</span>
        ) : (
          <span className="text-[#3d5c52]">{` — conteúdo salvo neste aparelho`}</span>
        )}
      </div>
    </div>
  );
}
