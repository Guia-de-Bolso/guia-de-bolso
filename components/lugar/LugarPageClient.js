"use client";

import LugarDetalheAirbnb from "@/components/lugar/LugarDetalheAirbnb";
import LugarDetalheLegacy, {
  LugarDetalheShell,
} from "@/components/lugar/LugarDetalheLegacy";
import OfflineFavoritoBadge from "@/components/favoritos/OfflineFavoritoBadge";
import { useLugarDetalhe } from "@/hooks/useLugarDetalhe";
import { useLugarDetalheV2 } from "@/lib/lugarDetalheFeature";

/**
 * Detalhe do lugar (client) — `lugarId` vem do servidor após resolver slug/UUID.
 * @param {{ lugarId: string, offlinePreferred?: boolean }} props
 * @returns {import("react").ReactElement}
 */
export default function LugarPageClient({ lugarId, offlinePreferred = false }) {
  const data = useLugarDetalhe(lugarId, { offlinePreferred });
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
        useV2 ? (
          <LugarDetalheAirbnb {...data} />
        ) : (
          <LugarDetalheLegacy {...data} />
        )
      ) : null}
    </LugarDetalheShell>
  );
}
