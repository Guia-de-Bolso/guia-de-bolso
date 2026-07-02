"use client";

import LugarDetalheAirbnb from "@/components/lugar/LugarDetalheAirbnb";
import LugarDetalheLegacy, {
  LugarDetalheShell,
} from "@/components/lugar/LugarDetalheLegacy";
import OfflineFavoritoBadge from "@/components/favoritos/OfflineFavoritoBadge";
import OfflineCoordinatesCard from "@/components/maps/OfflineCoordinatesCard";
import OfflineMapsSheet from "@/components/maps/OfflineMapsSheet";
import { useLugarDetalhe } from "@/hooks/useLugarDetalhe";
import { useLugarDetalheV2 } from "@/lib/lugarDetalheFeature";

/**
 * Detalhe do lugar (client) — `lugarId` vem do servidor após resolver slug/UUID.
 * @param {object} props
 * @param {string} props.lugarId
 * @param {boolean} [props.offlinePreferred]
 * @param {import('@/lib/lugarPageData').fetchLugarPageInitialData extends (...args: unknown[]) => Promise<infer R> ? Omit<R, 'error'> : null} [props.initialData]
 * @returns {import("react").ReactElement}
 */
export default function LugarPageClient({
  lugarId,
  offlinePreferred = false,
  initialData = null,
}) {
  const data = useLugarDetalhe(lugarId, { offlinePreferred, initialData });
  const useV2 = useLugarDetalheV2();

  return (
    <LugarDetalheShell
      id={lugarId}
      loading={data.loading}
      fetchError={data.fetchError}
      router={data.router}
    >
      {data.isOfflineView ? <OfflineFavoritoBadge savedAt={data.offlineSavedAt} /> : null}
      {data.lugar ? (
        <>
          {data.offlineLimited ? (
            <div className="mx-auto max-w-md px-4">
              <OfflineCoordinatesCard coordinates={data.mapCoordinates} />
            </div>
          ) : null}

          {useV2 ? <LugarDetalheAirbnb {...data} /> : <LugarDetalheLegacy {...data} />}

          <OfflineMapsSheet
            isOpen={data.showOfflineMapsSheet}
            onClose={() => data.setShowOfflineMapsSheet(false)}
            destinationName={data.lugar.nome}
            coordinates={data.mapCoordinates}
            address={data.mapAddressLabel}
            mapsUrls={data.offlineMapsUrls}
            onToast={(message) => {
              data.setOfflineMapsToast(message);
              window.setTimeout(() => data.setOfflineMapsToast(""), 2500);
            }}
          />

          {data.offlineMapsToast ? (
            <div
              className="fixed left-4 right-4 top-4 z-[70] mx-auto max-w-md rounded-2xl bg-[#1a4a3a] px-4 py-3 text-center text-sm font-semibold text-white shadow-lg"
              role="status"
            >
              {data.offlineMapsToast}
            </div>
          ) : null}
        </>
      ) : null}
    </LugarDetalheShell>
  );
}
