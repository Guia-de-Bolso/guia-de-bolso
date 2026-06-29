"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AtrativoDetalhePremium from "@/components/atrativos/AtrativoDetalhePremium";
import OfflineFavoritoBadge from "@/components/favoritos/OfflineFavoritoBadge";
import OfflineFavoritoDetailShell from "@/components/favoritos/OfflineFavoritoDetailShell";
import {
  formatAtrativoDistancia,
  formatAtrativoDuracao,
  getAtrativoMapsSubtitulo,
  getAtrativoNome,
} from "@/lib/atrativoDetalheDisplay";
import { getGoogleMapsDirectionsUrlForAtrativo } from "@/lib/atrativoMaps";
import { getCategoriaAtrativoMeta } from "@/lib/atrativos";
import {
  FAVORITO_OFFLINE_TYPES,
  getOfflineFavorito,
} from "@/lib/favoritosOffline";
import {
  cacheAtrativoFavoritoFromServer,
  fetchAtrativoOfflineBundle,
} from "@/lib/favoritosOfflineFetch";
import { getFotosFromAtrativo } from "@/lib/fotos";
import { isBrowserOnline } from "@/lib/networkStatus";
import { createClient } from "@/lib/supabase";

/**
 * Detalhe de atrativo favorito — cache offline com refresh opcional online.
 * @returns {import("react").ReactElement}
 */
export default function FavoritoAtrativoPage() {
  const params = useParams();
  const rotaId = String(params.id ?? "");
  const [bundle, setBundle] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOfflineView, setIsOfflineView] = useState(false);

  useEffect(() => {
    if (!rotaId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.id) {
        if (!cancelled) {
          setBundle(null);
          setLoading(false);
        }
        return;
      }

      async function applyCached() {
        const cached = await getOfflineFavorito(
          user.id,
          FAVORITO_OFFLINE_TYPES.ATIVO,
          rotaId
        );
        if (!cached?.payload?.rota || cancelled) return false;
        setBundle(cached.payload);
        setSavedAt(cached.savedAt);
        setIsOfflineView(true);
        return true;
      }

      const hadCache = await applyCached();

      if (!isBrowserOnline()) {
        if (!cancelled) setLoading(false);
        if (!hadCache && !cancelled) setBundle(null);
        return;
      }

      const fresh = await fetchAtrativoOfflineBundle(supabase, rotaId);
      if (cancelled) return;

      if (fresh?.rota) {
        setBundle(fresh);
        setIsOfflineView(false);
        setSavedAt(null);
        void cacheAtrativoFavoritoFromServer(supabase, user.id, rotaId);
      } else if (!hadCache) {
        setBundle(null);
      }

      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [rotaId]);

  const rota = bundle?.rota;
  const nome = rota ? getAtrativoNome(rota) : "";
  const categoria = rota ? getCategoriaAtrativoMeta(rota.categoria) : { nome: "", icone: "" };
  const tags = (bundle?.tags ?? []).map((tag) => ({
    id: tag.id,
    nome: tag.nome,
    icone: tag.icone,
  }));
  const fotos = bundle?.fotos?.length ? bundle.fotos : getFotosFromAtrativo(rota);

  return (
    <OfflineFavoritoDetailShell
      loading={loading}
      notFound={!loading && !rota}
      backHref="/favoritos"
    >
      {isOfflineView ? <OfflineFavoritoBadge savedAt={savedAt} /> : null}
      {rota ? (
        <AtrativoDetalhePremium
          rotaId={rotaId}
          rota={rota}
          localizacao={bundle?.localizacao}
          nome={nome}
          descricao={rota.descricao || ""}
          fotos={fotos}
          categoria={{ nome: categoria.nome, icone: categoria.icone }}
          tags={tags}
          duracao={formatAtrativoDuracao(rota)}
          distancia={formatAtrativoDistancia(rota)}
          dificuldade={rota.dificuldade || "Fácil"}
          mapsHref={getGoogleMapsDirectionsUrlForAtrativo(rota, bundle?.localizacao)}
          mapsSubtitulo={getAtrativoMapsSubtitulo(rota, bundle?.localizacao)}
          infoCards={[]}
          pontos={bundle?.pontos ?? []}
          dicas={bundle?.dicas ?? []}
          backHref="/favoritos"
        />
      ) : null}
    </OfflineFavoritoDetailShell>
  );
}
