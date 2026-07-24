"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useVoiceSearch } from "@/hooks/useVoiceSearch";
import { useUserPosition } from "@/hooks/useUserPosition";
import {
  createFavoritosSyncGuard,
  fetchFavoritoIds,
  toggleFavoritoLugar,
} from "@/lib/favoritos";
import { FILTRO_STATUS_BUSCA } from "@/lib/busca";
import { buildReportContext } from "@/lib/reportContext";
import { getNetworkErrorMessage, mapApiErrorResponse } from "@/lib/userMessages";
import { fetchApi } from "@/lib/fetchApi";
import { fetchLugaresPopulares } from "@/lib/lugaresPopulares";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";
import { getLugaresVisitados } from "@/lib/lugaresVisitados";
import { withDistanciaDinamica } from "@/lib/localizacao";
import { LIMITS, canUseBusca, isDailyBuscaLimitReached } from "@/lib/premium";
import { usePremiumUsage } from "@/lib/usePremiumUsage";
import { createClient } from "@/lib/supabase";

/**
 * Controller compartilhado da busca IA (barra, voz, painéis, gates).
 * @param {{ reportRoute?: string }} [options]
 */
export function useSmartSearch(options = {}) {
  const reportRoute = options.reportRoute || "/";

  const [user, setUser] = useState(null);
  const [termoBusca, setTermoBusca] = useState("");
  const [termoResultado, setTermoResultado] = useState("");
  const [searchMode, setSearchMode] = useState(null);
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [visitadosRecentes, setVisitadosRecentes] = useState([]);
  const [lugaresPopulares, setLugaresPopulares] = useState([]);
  const [loadingPopulares, setLoadingPopulares] = useState(false);
  const [favoritos, setFavoritos] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [motivoModal, setMotivoModal] = useState("busca");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("geral");
  const [erroBusca, setErroBusca] = useState("");
  const [erroBuscaReportavel, setErroBuscaReportavel] = useState(false);
  const [erroBuscaContext, setErroBuscaContext] = useState(null);
  const [filtroBuscaStatus, setFiltroBuscaStatus] = useState(FILTRO_STATUS_BUSCA.TODOS);

  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const executarBuscaRef = useRef(/** @type {(query: string, filtro?: string) => Promise<void>} */ (async () => {}));
  const favoritosSyncGuardRef = useRef(createFavoritosSyncGuard());
  const { userPosition } = useUserPosition();

  const {
    usage: premiumUsage,
    loading: premiumUsageLoading,
    synced: premiumUsageSynced,
    refresh: refreshPremiumUsage,
    setUsage: setPremiumUsage,
  } = usePremiumUsage(user);

  const voiceSearch = useVoiceSearch({
    onTranscriptChange: setTermoBusca,
    onFinalTranscript: (text) => {
      setTermoBusca(text);
      void executarBuscaRef.current(text);
    },
  });

  useEffect(() => {
    if (!isSupabasePublicConfigured()) return undefined;

    const supabase = createClient();
    if (!supabase) return undefined;

    function applySession(sessionUser) {
      setUser(sessionUser);
      if (!sessionUser) setFavoritos([]);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (searchMode !== "browse") return undefined;

    setVisitadosRecentes(getLugaresVisitados());
    let cancelled = false;
    setLoadingPopulares(true);
    const supabase = createClient();

    fetchLugaresPopulares(supabase, 5)
      .then((data) => {
        if (cancelled) return;
        setLugaresPopulares(data ?? []);
        setVisitadosRecentes(getLugaresVisitados());
      })
      .catch((err) => {
        console.error("[smart-search] lugares populares:", err);
        if (!cancelled) setLugaresPopulares([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingPopulares(false);
      });

    return () => {
      cancelled = true;
    };
  }, [searchMode]);

  useEffect(() => {
    if (!searchMode) return undefined;

    function handleEscape(event) {
      if (event.key !== "Escape") return;
      setSearchMode(null);
      setTermoBusca("");
      setTermoResultado("");
      setResultadosBusca([]);
      setLoadingBusca(false);
      setFiltroBuscaStatus(FILTRO_STATUS_BUSCA.TODOS);
      searchInputRef.current?.blur();
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [searchMode]);

  useEffect(() => {
    if (!user?.id || !isSupabasePublicConfigured()) {
      if (!user?.id) setFavoritos([]);
      return undefined;
    }

    const supabase = createClient();
    if (!supabase) return undefined;

    const fetchGen = favoritosSyncGuardRef.current.bump();
    fetchFavoritoIds(supabase, user.id).then((ids) => {
      if (!favoritosSyncGuardRef.current.isCurrent(fetchGen)) return;
      setFavoritos(ids);
    });

    return undefined;
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id || !isSupabasePublicConfigured()) return undefined;

    const supabase = createClient();
    if (!supabase) return undefined;

    function resyncFavoritos() {
      if (document.visibilityState !== "visible") return;
      const fetchGen = favoritosSyncGuardRef.current.bump();
      fetchFavoritoIds(supabase, user.id).then((ids) => {
        if (!favoritosSyncGuardRef.current.isCurrent(fetchGen)) return;
        setFavoritos(ids);
      });
    }

    window.addEventListener("focus", resyncFavoritos);
    document.addEventListener("visibilitychange", resyncFavoritos);

    return () => {
      window.removeEventListener("focus", resyncFavoritos);
      document.removeEventListener("visibilitychange", resyncFavoritos);
    };
  }, [user?.id]);

  function fecharBusca() {
    setSearchMode(null);
    setTermoBusca("");
    setTermoResultado("");
    setResultadosBusca([]);
    setLoadingBusca(false);
    setFiltroBuscaStatus(FILTRO_STATUS_BUSCA.TODOS);
    searchInputRef.current?.blur();
  }

  function handleSearchFocus() {
    setVisitadosRecentes(getLugaresVisitados());
    if (searchMode === "results" && termoBusca.trim()) return;
    setSearchMode("browse");
  }

  /**
   * @param {import("react").FocusEvent<HTMLInputElement>} event
   */
  function handleSearchBlur(event) {
    if (termoBusca.trim()) return;
    const next = event.relatedTarget;
    if (next?.closest?.("[data-search-interactive='true']")) return;
    if (next && searchContainerRef.current?.contains(next)) return;
    window.setTimeout(() => {
      if (searchInputRef.current === document.activeElement) return;
      if (termoBusca.trim()) return;
      if (searchMode === "browse") fecharBusca();
    }, 150);
  }

  function abrirPaywall(feature) {
    setPaywallFeature(feature);
    setPaywallOpen(true);
  }

  /**
   * @param {string} query
   * @param {string} [filtroOverride]
   */
  async function executarBusca(query, filtroOverride) {
    const termo = query.trim();
    if (!termo) return;

    if (!user) {
      setMotivoModal("busca");
      setIsModalOpen(true);
      return;
    }

    let usageForGate = premiumUsage;
    let usageSyncedForGate = premiumUsageSynced;

    if (!premiumUsageSynced || premiumUsageLoading) {
      usageForGate = (await refreshPremiumUsage()) ?? premiumUsage;
      usageSyncedForGate = true;
    }

    const access = canUseBusca(usageForGate, Boolean(user), {
      synced: usageSyncedForGate,
    });

    if (!access.allowed) {
      if (access.code === "LIMIT_REACHED") abrirPaywall("busca");
      else if (access.code === "LOGIN_REQUIRED") {
        setMotivoModal("busca");
        setIsModalOpen(true);
      }
      return;
    }

    const filtro = filtroOverride ?? filtroBuscaStatus;

    setTermoBusca(termo);
    setTermoResultado(termo);
    setSearchMode("results");
    setLoadingBusca(true);
    setResultadosBusca([]);
    setErroBusca("");
    setErroBuscaReportavel(false);
    setErroBuscaContext(null);

    try {
      const response = await fetchApi("/api/buscar", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: termo, filtroStatus: filtro }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "LOGIN_REQUIRED") {
          setMotivoModal("busca");
          setIsModalOpen(true);
          setSearchMode("browse");
          return;
        }
        if (data.code === "LIMIT_REACHED") {
          if (data.usage) setPremiumUsage(data.usage);
          else await refreshPremiumUsage();
          abrirPaywall("busca");
          setSearchMode("browse");
          return;
        }
        const mapped = mapApiErrorResponse(data, response.status);
        setErroBusca(mapped.message);
        setErroBuscaReportavel(true);
        setErroBuscaContext(
          buildReportContext({
            code: mapped.code ?? data.code,
            route: reportRoute,
            message: mapped.message,
            extra: { query: termo },
          })
        );
        setResultadosBusca([]);
        await refreshPremiumUsage();
        return;
      }

      setResultadosBusca(data.lugares ?? []);
      if (data.message && !(data.lugares ?? []).length) {
        setErroBusca(data.message);
        setErroBuscaReportavel(false);
      }
      if (data.usage) setPremiumUsage(data.usage);
      else await refreshPremiumUsage();
    } catch {
      setErroBusca(getNetworkErrorMessage());
      setErroBuscaReportavel(true);
      setErroBuscaContext(
        buildReportContext({ code: "NETWORK", route: reportRoute, extra: { query: termo } })
      );
      setResultadosBusca([]);
      await refreshPremiumUsage();
    } finally {
      setLoadingBusca(false);
    }
  }

  executarBuscaRef.current = executarBusca;

  const handleVoiceToggle = useCallback(() => {
    if (!voiceSearch.listening && !voiceSearch.busy) {
      setVisitadosRecentes(getLugaresVisitados());
      if (searchMode !== "results") setSearchMode("browse");
      voiceSearch.clearError();
    }
    void voiceSearch.toggle();
  }, [
    searchMode,
    voiceSearch.busy,
    voiceSearch.clearError,
    voiceSearch.listening,
    voiceSearch.toggle,
  ]);

  /**
   * @param {{ query: string, filtro?: string }} chip
   */
  function handleChipClick(chip) {
    const filtro = chip.filtro ?? FILTRO_STATUS_BUSCA.TODOS;
    setFiltroBuscaStatus(filtro);
    void executarBusca(chip.query, filtro);
  }

  /**
   * @param {string} nextFiltro
   */
  function handleFiltroBuscaChange(nextFiltro) {
    setFiltroBuscaStatus(nextFiltro);
    const termoAtivo = termoBusca.trim() || termoResultado.trim();
    if (!termoAtivo) return;
    void executarBusca(termoAtivo, nextFiltro);
  }

  /**
   * @param {object} lugar
   */
  async function handleFavoritar(lugar) {
    if (!user) {
      setMotivoModal("favoritar");
      setIsModalOpen(true);
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    favoritosSyncGuardRef.current.bump();
    await toggleFavoritoLugar(supabase, user, lugar, setFavoritos);
  }

  /** Abre o modo browse e foca o input (atalhos externos). */
  function openBrowse() {
    setVisitadosRecentes(getLugaresVisitados());
    setSearchMode("browse");
    window.setTimeout(() => searchInputRef.current?.focus(), 50);
  }

  const isFavorito = useCallback(
    (lugar) => favoritos.includes(String(lugar.id)),
    [favoritos]
  );

  const buscaLimiteDiarioAtingido =
    Boolean(user) && isDailyBuscaLimitReached(premiumUsage);

  const resultadosComDistancia = resultadosBusca.map((l) =>
    withDistanciaDinamica(l, userPosition)
  );

  return {
    user,
    searchContainerRef,
    searchInputRef,
    termoBusca,
    setTermoBusca,
    termoResultado,
    searchMode,
    resultadosBusca: resultadosComDistancia,
    loadingBusca,
    visitadosRecentes,
    lugaresPopulares,
    loadingPopulares,
    filtroBuscaStatus,
    erroBusca,
    erroBuscaReportavel,
    erroBuscaContext,
    premiumUsage,
    premiumUsageLoading,
    buscaLimiteDiarioAtingido,
    limitsBusca: LIMITS.busca,
    isModalOpen,
    motivoModal,
    setIsModalOpen,
    setMotivoModal,
    paywallOpen,
    paywallFeature,
    setPaywallOpen,
    setPremiumUsage,
    refreshPremiumUsage,
    voiceSupported: voiceSearch.supported,
    voiceListening: voiceSearch.listening,
    voiceError: voiceSearch.errorMessage,
    onVoiceToggle: handleVoiceToggle,
    fecharBusca,
    handleSearchFocus,
    handleSearchBlur,
    executarBusca,
    handleChipClick,
    handleFiltroBuscaChange,
    handleFavoritar,
    isFavorito,
    openBrowse,
  };
}
