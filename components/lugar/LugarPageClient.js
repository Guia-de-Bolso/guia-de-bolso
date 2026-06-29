"use client";

import LugarDetalheAirbnb from "@/components/lugar/LugarDetalheAirbnb";
import LugarDetalheLegacy, {
  LugarDetalheShell,
} from "@/components/lugar/LugarDetalheLegacy";
import OfflineFavoritoBadge from "@/components/favoritos/OfflineFavoritoBadge";
import OfflineCoordinatesCard from "@/components/maps/OfflineCoordinatesCard";
import OfflineMapsPrepareBanner from "@/components/maps/OfflineMapsPrepareBanner";
import OfflineMapsSheet from "@/components/maps/OfflineMapsSheet";
import { useOfflineMode } from "@/components/OfflineModeProvider";
import { useLugarDetalhe } from "@/hooks/useLugarDetalhe";
import { useLugarDetalheV2 } from "@/lib/lugarDetalheFeature";
import { shouldShowOfflineMapsPrepareBanner } from "@/lib/offlineMaps";
import { usePathname } from "next/navigation";

/**
 * Detalhe do lugar (client) — `lugarId` vem do servidor após resolver slug/UUID.
 * @param {{ lugarId: string, offlinePreferred?: boolean }} props
 * @returns {import("react").ReactElement}
 */
export default function LugarPageClient({ lugarId, offlinePreferred = false }) {
  const pathname = usePathname();
  const { isOnline } = useOfflineMode();
  const data = useLugarDetalhe(lugarId, { offlinePreferred });
  const useV2 = useLugarDetalheV2();
  const showPrepareBanner = shouldShowOfflineMapsPrepareBanner(
    pathname,
    isOnline,
    data.lugar?.categoria
  );

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
          {(showPrepareBanner || data.offlineLimited) && (
            <div className="mx-auto max-w-md px-4">
              {showPrepareBanner ? <OfflineMapsPrepareBanner /> : null}
              {data.offlineLimited ? (
                <OfflineCoordinatesCard coordinates={data.mapCoordinates} />
              ) : null}
            </div>
          )}

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
