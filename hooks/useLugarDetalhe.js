"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAvaliacoesLugar,
  fetchFavoritoLugar,
  fetchFotosLugarLegado,
  fetchJaAvaliouLugar,
  fetchLocalizacaoLugar,
  fetchLugarAtivo,
  fetchSubcategoria,
  fetchTagsLugar,
} from "@/lib/data/lugarDetalheQueries";
import { useUserPosition } from "@/hooks/useUserPosition";
import { AVALIACAO_STATUS_APROVADOS } from "@/lib/avaliacoes";
import { getCapaFromLugar, getFotosFromLugar } from "@/lib/fotos";
import {
  getAcoesRapidasEstabelecimento,
  getAcoesRapidasLocais,
  getCtaIrAgoraText,
  getFraseConvencimento,
  getHorarioResumo,
  getResumoAvaliacoes,
  getStaticMapUrl,
  isLugarEstabelecimento,
} from "@/lib/lugarDetalhe";
import {
  appleMapsUrl,
  CATEGORIA_STYLES,
  facebookUrl,
  googleMapsUrl,
  instagramUrl,
  wazeUrl,
} from "@/lib/lugarDetalheMaps";
import {
  buildMapsUrlsForLugar,
  getMapAddressLabel,
  parseMapCoordinates,
} from "@/lib/mapsCoordinates";
import { isConteudoCuradoria, isParceiro } from "@/lib/lugarBadges";
import {
  getFotosParaExibicao,
  getTextoHistoriaCultura,
  getTextoSobre,
  getVisibilidadePerfil,
} from "@/lib/lugarVisibilidade";
import { createFavoritosSyncGuard, toggleFavoritoLugarBoolean, FAVORITO_OFFLINE_SAVED_MESSAGE } from "@/lib/favoritos";
import { useOfflineMode } from "@/components/OfflineModeProvider";
import {
  FAVORITO_OFFLINE_TYPES,
  getOfflineFavorito,
} from "@/lib/favoritosOffline";
import { isBrowserOnline } from "@/lib/networkStatus";
import { saveLugarVisitado } from "@/lib/lugaresVisitados";
import { getDistanciaLugar } from "@/lib/localizacao";
import { registrarLog } from "@/lib/logs";
import { MAP_PREFERENCE_STORAGE_KEY } from "@/lib/perfil";
import { createClient } from "@/lib/supabase";
import { getDiaAtualKey, getStatusFuncionamento } from "@/lib/horarios";
import { getReturnPathFromSearch } from "@/lib/navigationReturn";

/**
 * Estado e ações compartilhados entre layout legado e redesign Airbnb.
 * @param {string} [lugarIdFromServer] - UUID resolvido no servidor (rota por slug).
 * @param {{ offlinePreferred?: boolean }} [options]
 * @returns {object}
 */
export function useLugarDetalhe(lugarIdFromServer, options = {}) {
  const offlinePreferred = Boolean(options.offlinePreferred);
  const params = useParams();
  const routeParam = params.slug ?? params.id;
  const id = lugarIdFromServer ?? routeParam;
  const router = useRouter();
  const searchParams = useSearchParams();
  const backHref = useMemo(
    () => (offlinePreferred ? "/favoritos" : getReturnPathFromSearch(searchParams, "/")),
    [offlinePreferred, searchParams]
  );
  const supabase = useMemo(() => createClient(), []);
  const [lugar, setLugar] = useState(null);
  const [fotos, setFotos] = useState([]);
  const viewLoggedRef = useRef(false);
  const favoritoSyncGuardRef = useRef(createFavoritosSyncGuard());
  const avaliacaoSyncGuardRef = useRef(createFavoritosSyncGuard());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [isFavorito, setIsFavorito] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHorarios, setShowHorarios] = useState(false);
  const [showRotas, setShowRotas] = useState(false);
  const [mapPreference, setMapPreference] = useState("google");
  const [sobreExpandido, setSobreExpandido] = useState(false);
  const [historiaExpandido, setHistoriaExpandido] = useState(false);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [jaAvaliou, setJaAvaliou] = useState(false);
  const [showAvaliacaoForm, setShowAvaliacaoForm] = useState(false);
  const [toast, setToast] = useState("");
  const [motivoModal, setMotivoModal] = useState("favoritar");
  const [localizacao, setLocalizacao] = useState(null);
  const [subcategoria, setSubcategoria] = useState(null);
  const [tags, setTags] = useState([]);
  const { userPosition } = useUserPosition();
  const [showQrBanner, setShowQrBanner] = useState(false);
  const [isOfflineView, setIsOfflineView] = useState(false);
  const [offlineSavedAt, setOfflineSavedAt] = useState(null);
  const [showOfflineMapsSheet, setShowOfflineMapsSheet] = useState(false);
  const [offlineMapsToast, setOfflineMapsToast] = useState("");
  const { offlineLimited } = useOfflineMode();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsFavorito(false);
        setJaAvaliou(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setIsFavorito(false);
        setJaAvaliou(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    async function applyOfflineBundle(userId) {
      if (!userId) return false;
      const cached = await getOfflineFavorito(userId, FAVORITO_OFFLINE_TYPES.LUGAR, String(id));
      if (!cached?.payload?.lugar || cancelled) return false;

      setLugar(cached.payload.lugar);
      setLocalizacao(cached.payload.localizacao ?? null);
      setTags(cached.payload.tags ?? []);
      setFotos(cached.payload.fotos ?? getFotosFromLugar(cached.payload.lugar));
      setFetchError(false);
      setIsOfflineView(true);
      setOfflineSavedAt(cached.savedAt);
      return true;
    }

    async function load() {
      setLoading(true);

      const hadOffline = user?.id ? await applyOfflineBundle(user.id) : false;
      if (hadOffline) setLoading(false);

      if (!isBrowserOnline()) {
        if (!hadOffline) {
          setFetchError(true);
          setLugar(null);
        }
        setLoading(false);
        return;
      }

      fetchLugarAtivo(supabase, id).then(async ({ data, error }) => {
        if (cancelled) return;

        if (error || !data) {
          const applied = await applyOfflineBundle(user?.id);
          if (!applied) {
            setFetchError(true);
            setLugar(null);
          }
          setLoading(false);
          return;
        }

        setFetchError(false);
        setLugar(data);
        setIsOfflineView(false);
        setOfflineSavedAt(null);
        saveLugarVisitado(data, getCapaFromLugar(data));
        const fotosJson = getFotosFromLugar(data);
        if (fotosJson.length > 0) {
          setFotos(fotosJson);
        }
        setLoading(false);
      });

      fetchFotosLugarLegado(supabase, id).then(({ data }) => {
        if (cancelled) return;
        setFotos((current) => {
          if (current.length > 0) return current;
          return (data ?? [])
            .map((foto) => foto.url || foto.imagem_url || foto.foto_url)
            .filter(Boolean);
        });
      });

      fetchLocalizacaoLugar(supabase, id).then(({ data }) => {
        if (!cancelled) setLocalizacao(data);
      });

      fetchTagsLugar(supabase, id).then(({ data }) => {
        if (!cancelled) {
          setTags((data ?? []).map((item) => item.tags).filter(Boolean));
        }
      });
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [id, supabase, user?.id, offlinePreferred]);

  useEffect(() => {
    viewLoggedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!lugar?.id || viewLoggedRef.current) return;

    viewLoggedRef.current = true;

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      registrarLog(supabase, currentUser, "visualizou_lugar", {
        lugar_id: lugar.id,
        lugar_nome: lugar.nome,
        pagina: lugar.slug ? `/lugares/${lugar.slug}` : `/lugares/${lugar.id}`,
      });
    });
  }, [lugar, supabase]);

  useEffect(() => {
    if (searchParams.get("ref") !== "qr" || !lugar?.id || !lugar?.nome) return;

    const key = `qr_banner_${lugar.id}`;
    if (sessionStorage.getItem(key)) {
      setShowQrBanner(false);
      return;
    }

    sessionStorage.setItem(key, "1");
    setShowQrBanner(true);
  }, [searchParams, lugar?.id, lugar?.nome]);

  useEffect(() => {
    if (!lugar?.categoria || !lugar?.subcategoria) {
      const timer = setTimeout(() => setSubcategoria(null), 0);
      return () => clearTimeout(timer);
    }

    fetchSubcategoria(supabase, lugar.categoria, lugar.subcategoria).then(({ data }) =>
      setSubcategoria(data)
    );
  }, [lugar, supabase]);

  useEffect(() => {
    if (!user?.id || !lugar?.id) {
      if (!user?.id) {
        setIsFavorito(false);
        setJaAvaliou(false);
      }
      return undefined;
    }

    const userId = user.id;
    const lugarId = lugar.id;
    const favoritoFetchGen = favoritoSyncGuardRef.current.bump();
    const avaliacaoFetchGen = avaliacaoSyncGuardRef.current.bump();

    fetchFavoritoLugar(supabase, userId, lugarId).then(({ data }) => {
      if (!favoritoSyncGuardRef.current.isCurrent(favoritoFetchGen)) return;
      setIsFavorito(Boolean(data));
    });

    fetchJaAvaliouLugar(supabase, userId, lugarId).then(({ data }) => {
      if (!avaliacaoSyncGuardRef.current.isCurrent(avaliacaoFetchGen)) return;
      setJaAvaliou(Boolean(data));
    });

    return undefined;
  }, [user?.id, lugar?.id, supabase]);

  useEffect(() => {
    const stored = localStorage.getItem(MAP_PREFERENCE_STORAGE_KEY);
    if (stored) setMapPreference(stored);
  }, []);

  useEffect(() => {
    if (!id) return;

    fetchAvaliacoesLugar(supabase, id).then(async ({ data, error }) => {
      if (!error) {
        setAvaliacoes(data ?? []);
        return;
      }

      const { data: fallbackData } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("lugar_id", id)
        .in("status", AVALIACAO_STATUS_APROVADOS)
        .order("created_at", { ascending: false });

      setAvaliacoes(fallbackData ?? []);
    });
  }, [id, supabase]);

  async function handleFavoritar() {
    if (!user) {
      setMotivoModal("favoritar");
      setIsModalOpen(true);
      return;
    }

    favoritoSyncGuardRef.current.bump();
    const result = await toggleFavoritoLugarBoolean(supabase, user, lugar, setIsFavorito);
    if (result === "added") {
      setToast(FAVORITO_OFFLINE_SAVED_MESSAGE);
      setTimeout(() => setToast(""), 3500);
    }
  }

  async function handleOpenAvaliacao() {
    if (!user) {
      setMotivoModal("avaliar");
      setIsModalOpen(true);
      return;
    }

    const { data } = await supabase
      .from("avaliacoes")
      .select("id")
      .eq("user_id", user.id)
      .eq("lugar_id", lugar.id)
      .maybeSingle();

    if (data) {
      setJaAvaliou(true);
      return;
    }

    setShowAvaliacaoForm(true);
  }

  function handleAvaliacaoEnviada() {
    setJaAvaliou(true);
    setToast(
      "Obrigado! Sua avaliação será analisada pela nossa equipe e publicada em breve."
    );
    setTimeout(() => setToast(""), 4000);
  }

  function launchNavigationApp(appKey, remember = true) {
    if (!lugar) return;

    if (remember) {
      localStorage.setItem(MAP_PREFERENCE_STORAGE_KEY, appKey);
      setMapPreference(appKey);
    }

    setShowRotas(false);
    registrarLog(supabase, user, "ir_agora", {
      lugar_id: lugar.id,
      lugar_nome: lugar.nome,
      app: appKey,
    });

    const urls = {
      google: googleMapsUrl(lugar, localizacao),
      apple: appleMapsUrl(lugar, localizacao),
      waze: wazeUrl(lugar, localizacao),
    };

    window.open(urls[appKey], "_blank", "noopener,noreferrer");
  }

  function openRoute(preference) {
    if (offlineLimited) {
      setShowOfflineMapsSheet(true);
      return;
    }

    const selected =
      preference || localStorage.getItem(MAP_PREFERENCE_STORAGE_KEY);

    if (!selected) {
      setShowRotas(true);
      return;
    }

    launchNavigationApp(selected, true);
  }

  async function handleShare() {
    if (!lugar) return;

    const shareData = {
      title: lugar.nome,
      text: lugar.descricao,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(window.location.href);
      setToast("Link copiado!");
      setTimeout(() => setToast(""), 2500);
    } catch {
      // Cancelamento do share nativo.
    }
  }

  const ehParceiro = lugar ? isParceiro(lugar) : false;
  const ehCuradoria = lugar ? isConteudoCuradoria(lugar) : false;
  const visibilidade = lugar ? getVisibilidadePerfil(ehParceiro, ehCuradoria) : null;
  const capaUrl = lugar ? getCapaFromLugar(lugar) : null;
  const fotosCompletas = lugar
    ? fotos.length > 0
      ? fotos
      : getFotosFromLugar(lugar)
    : [];
  const imagens =
    lugar && visibilidade
      ? getFotosParaExibicao(
          fotosCompletas,
          capaUrl,
          visibilidade.showGaleriaCompleta
        )
      : [];
  const status = lugar ? getStatusFuncionamento(lugar.horarios) : null;
  const diaAtual = getDiaAtualKey();
  const enderecoExibicao = lugar
    ? localizacao?.endereco_completo?.trim() || lugar.endereco?.trim() || ""
    : "";
  const descricaoLonga =
    lugar && visibilidade
      ? getTextoSobre(lugar, visibilidade.showDescricaoLonga)
      : null;
  const historiaCultura = lugar ? getTextoHistoriaCultura(lugar) : null;
  const totalAvaliacoes = avaliacoes.length;
  const mediaAvaliacoes =
    totalAvaliacoes > 0
      ? avaliacoes.reduce((sum, a) => sum + Number(a.nota || 0), 0) /
        totalAvaliacoes
      : 0;
  const distancia = lugar
    ? getDistanciaLugar({ ...lugar, localizacoes: localizacao }, userPosition)
    : null;
  const tagsExibidas =
    lugar && visibilidade && visibilidade.showTags ? tags : [];
  const fraseConvencimento = lugar
    ? getFraseConvencimento({ ...lugar, ehParceiro }, tagsExibidas)
    : "";
  const resumoAvaliacoes = lugar
    ? getResumoAvaliacoes(avaliacoes, lugar.categoria)
    : null;
  const horarioResumo = status ? getHorarioResumo(status) : "";
  const ehEstabelecimento = lugar ? isLugarEstabelecimento(lugar) : true;
  const ctaLabel = status ? getCtaIrAgoraText(status, ehEstabelecimento) : "";
  const staticMapSrc = getStaticMapUrl(localizacao);
  const mapsLink = lugar ? googleMapsUrl(lugar, localizacao) : "";
  const acoesRapidasBase =
    lugar && visibilidade
      ? ehEstabelecimento
        ? visibilidade.showAcoesRapidasEstabelecimento
          ? getAcoesRapidasEstabelecimento({
              telefone: lugar.telefone?.trim() || undefined,
              instagramHref: lugar.instagram?.trim()
                ? instagramUrl(lugar.instagram)
                : null,
              facebookHref: lugar.facebook_url?.trim()
                ? facebookUrl(lugar.facebook_url)
                : null,
              cardapioUrl: lugar.cardapio_url?.trim() || undefined,
              siteUrl: lugar.site_url?.trim() || undefined,
            })
          : []
        : getAcoesRapidasLocais(lugar, tags, distancia)
      : [];
  const acoesRapidas = ehEstabelecimento
    ? acoesRapidasBase.filter((acao) => acao.href)
    : acoesRapidasBase;
  const modoAcoes = ehEstabelecimento ? "estabelecimento" : "publico";
  const badgeStyle = lugar
    ? CATEGORIA_STYLES[lugar.categoria] ?? "bg-white text-[#1a4a3a]"
    : "";

  const mapCoordinates = parseMapCoordinates(localizacao);
  const offlineMapsUrls = lugar ? buildMapsUrlsForLugar(lugar, localizacao) : null;
  const mapAddressLabel = getMapAddressLabel(localizacao);

  return {
    id,
    router,
    backHref,
    lugar,
    loading,
    fetchError,
    user,
    isFavorito,
    toast,
    showQrBanner,
    setShowQrBanner,
    showHorarios,
    setShowHorarios,
    showRotas,
    setShowRotas,
    mapPreference,
    sobreExpandido,
    setSobreExpandido,
    historiaExpandido,
    setHistoriaExpandido,
    avaliacoes,
    jaAvaliou,
    showAvaliacaoForm,
    setShowAvaliacaoForm,
    isModalOpen,
    setIsModalOpen,
    motivoModal,
    localizacao,
    subcategoria,
    tags,
    ehParceiro,
    visibilidade,
    imagens,
    status,
    diaAtual,
    enderecoExibicao,
    descricaoLonga,
    historiaCultura,
    totalAvaliacoes,
    mediaAvaliacoes,
    distancia,
    tagsExibidas,
    fraseConvencimento,
    resumoAvaliacoes,
    horarioResumo,
    ehEstabelecimento,
    ctaLabel,
    staticMapSrc,
    mapsLink,
    acoesRapidas,
    modoAcoes,
    badgeStyle,
    handleFavoritar,
    handleShare,
    handleOpenAvaliacao,
    handleAvaliacaoEnviada,
    launchNavigationApp,
    openRoute,
    isOfflineView,
    offlineSavedAt,
    showOfflineMapsSheet,
    setShowOfflineMapsSheet,
    offlineMapsToast,
    setOfflineMapsToast,
    mapCoordinates,
    offlineMapsUrls,
    mapAddressLabel,
    offlineLimited,
  };
}
