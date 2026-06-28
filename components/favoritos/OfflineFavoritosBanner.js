"use client";

/**
 * Banner de modo offline na lista de favoritos.
 * @param {object} props
 * @param {boolean} props.isOffline
 * @param {string|null} [props.lastSyncedLabel]
 * @returns {import("react").ReactElement|null}
 */
export default function OfflineFavoritosBanner({ isOffline, lastSyncedLabel }) {
  if (!isOffline && !lastSyncedLabel) return null;

  return (
    <div
      className="mb-5 rounded-2xl border border-[#1a4a3a]/15 bg-[#e8f5f1] px-4 py-3 text-sm leading-relaxed text-[#1a4a3a]"
      role="status"
    >
      {isOffline ? (
        <>
          <p className="font-semibold">Modo offline</p>
          <p className="mt-1 text-[#3d5c52]">
            Exibindo seus favoritos salvos neste aparelho
            {lastSyncedLabel ? ` (atualizados em ${lastSyncedLabel})` : ""}.
          </p>
        </>
      ) : (
        <>
          <p className="font-semibold">Disponível offline</p>
          <p className="mt-1 text-[#3d5c52]">
            Seus favoritos ficam salvos automaticamente neste aparelho
            {lastSyncedLabel ? ` — última atualização em ${lastSyncedLabel}` : ""}.
          </p>
        </>
      )}
    </div>
  );
}
