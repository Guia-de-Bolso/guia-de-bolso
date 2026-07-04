"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LoginModal from "@/components/LoginModal";
import Onboarding from "@/components/Onboarding";
import DailyLimitCountdown from "@/components/DailyLimitCountdown";
import PremiumPaywallSheet from "@/components/PremiumPaywallSheet";
import BaleiasTemporadaCard from "@/components/home/BaleiasTemporadaCard";
import EmAltaHoje from "@/components/home/EmAltaHoje";
import HomeContextHeader from "@/components/home/HomeContextHeader";
import OQueFazerAgora from "@/components/home/OQueFazerAgora";
import ParceirosCarrossel from "@/components/home/ParceirosCarrossel";
import PertoDeVoce from "@/components/home/PertoDeVoce";
import PlanosRapidos from "@/components/home/PlanosRapidos";
import HomePageSkeleton from "@/components/loading/HomePageSkeleton";
import SupabaseConfigAlert from "@/components/SupabaseConfigAlert";
import SearchBrowsePanel from "@/components/home/SearchBrowsePanel";
import SearchResultsPanel from "@/components/home/SearchResultsPanel";
import SearchStatusFilter from "@/components/home/SearchStatusFilter";
import SmartSearch from "@/components/home/SmartSearch";
import { useStickyShellRef } from "@/hooks/useHomeHeaderScroll";
import { useHomePrimaryFeed } from "@/hooks/useHomePrimaryFeed";
import { useUserPosition } from "@/hooks/useUserPosition";
import {
  createFavoritosSyncGuard,
  fetchFavoritoIds,
  toggleFavoritoLugar,
} from "@/lib/favoritos";
import { FILTRO_STATUS_BUSCA } from "@/lib/busca";
import { buildReportContext } from "@/lib/reportContext";
import { getNetworkErrorMessage, mapApiErrorResponse } from "@/lib/userMessages";
import { fetchClimaApisCached } from "@/lib/clima";
import { fetchApi } from "@/lib/fetchApi";
import { isCapacitorNative } from "@/lib/capacitorNavigation";
import { IMBITUBA_COORDS, sortLugaresPorDistancia } from "@/lib/homeContext";
import { enrichLugaresFlags } from "@/lib/lugarBadges";
import { pickEmAltaCuradoria, pickParceirosPorCategoria } from "@/lib/homeSelection";
import { resolveAtrativoDoDia } from "@/lib/atrativoDoDia";
import { fetchLugaresFromApi } from "@/lib/fetchLugaresApi";
import { fetchLugaresPopulares } from "@/lib/lugaresPopulares";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";
import { getLugaresVisitados } from "@/lib/lugaresVisitados";
import { withDistanciaDinamica } from "@/lib/localizacao";
import { shouldLogAcessouAppToday } from "@/lib/acessouAppLog";
import { ensurePerfil } from "@/lib/ensurePerfil";
import { LIMITS, canUseBusca, isDailyBuscaLimitReached } from "@/lib/premium";
import { usePremiumUsage } from "@/lib/usePremiumUsage";
import { createClient } from "@/lib/supabase";
import { registrarLog } from "@/lib/logs";

/** Timeout de segurança se `getSession`/`getUser` não responder (ex.: OAuth no tablet). */
const AUTH_RESOLVE_TIMEOUT_MS = 8000;

/**
 * First letter of the user's display name for the avatar fallback.
 * @param {import("@supabase/supabase-js").User | null} user - Auth user.
 * @returns {string} Uppercase initial.
 */
function getUserInitial(user) {
  const name =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    "?";
  return name.charAt(0).toUpperCase();
}

/**
 * Aplica feed principal da home ao estado local.
 * @param {Awaited<ReturnType<import('@/lib/fetchHomePrimaryFeed').fetchHomePrimaryFeed>>} feed
 * @param {object} actions
 */
function applyHomePrimaryFeed(feed, actions) {
  const rotas = feed.atrativosAtivos ?? [];
  const enriched = feed.lugaresAtivos ?? [];
  const emAlta = feed.lugaresEmAlta ?? pickEmAltaCuradoria(enriched);

  actions.setAtrativosAtivos(rotas);
  actions.setLugaresAtivos(enriched);
  actions.setLugaresParceiros(feed.lugaresParceiros ?? pickParceirosPorCategoria(enriched));
  actions.setLugaresEmAlta(emAlta);
  actions.setLugaresProximos(feed.lugaresProximos ?? enriched.slice(0, 6));
  actions.setSectionErrors({
    hero: !resolveAtrativoDoDia(rotas, { requireCapa: true }).rota,
    emAlta: emAlta.length === 0,
    perto: false,
    clima: false,
  });
  actions.setHomeLoading(false);
  actions.setPertoLoading(false);
}

/**
 * Loads nearby candidates for "Perto de você".
 * @returns {Promise<object[]>}
 */
async function fetchLugaresProximos() {
  const data = await fetchLugaresFromApi({ limit: 20 });
  return data.slice(0, 6);
}

/**
 * Discreet placeholder when a home section fails to load.
 * @param {object} props
 * @param {string} [props.title] - Optional section heading.
 * @returns {import("react").ReactElement}
 */
function SectionUnavailable({ title }) {
  return (
    <section className="mb-8">
      {title ? <h2 className="mb-3 text-lg font-bold text-[#1a2e28]">{title}</h2> : null}
      <p className="py-4 text-center text-sm text-[#5a6b66]">
        Conteúdo indisponível no momento
      </p>
    </section>
  );
}

/**
 * Home page: contextual feed, smart search, favorites, and premium gates.
 * @param {object} props
 * @param {import('@/lib/homePageData').fetchHomePageInitialData extends () => Promise<infer R> ? R : null} [props.initialHomeData]
 * @returns {import("react").ReactElement}
 */
function Home({ initialHomeData = null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: primaryFeed, loading: primaryFeedLoading } = useHomePrimaryFeed(initialHomeData);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [atrativosAtivos, setAtrativosAtivos] = useState(initialHomeData?.atrativosAtivos ?? []);
  const [lugaresAtivos, setLugaresAtivos] = useState(initialHomeData?.lugaresAtivos ?? []);
  const [lugaresEmAlta, setLugaresEmAlta] = useState(initialHomeData?.lugaresEmAlta ?? []);
  const [lugaresProximos, setLugaresProximos] = useState(initialHomeData?.lugaresProximos ?? []);
  const [lugaresParceiros, setLugaresParceiros] = useState(initialHomeData?.lugaresParceiros ?? []);
  const [temperaturaClima, setTemperaturaClima] = useState(null);
  const [climaEmoji, setClimaEmoji] = useState(null);
  const [climaCondition, setClimaCondition] = useState(null);
  const [homeLoading, setHomeLoading] = useState(!initialHomeData?.lugaresAtivos?.length);
  const [pertoLoading, setPertoLoading] = useState(!initialHomeData?.lugaresAtivos?.length);
  const [sectionErrors, setSectionErrors] = useState({
    hero: false,
    emAlta: false,
    perto: false,
    clima: false,
  });

  const [termoBusca, setTermoBusca] = useState("");
  const [termoResultado, setTermoResultado] = useState("");
  const [searchMode, setSearchMode] = useState(null);
  const [resultadosBusca, setResultadosBusca] = useState([]);
  const [loadingBusca, setLoadingBusca] = useState(false);
  const [visitadosRecentes, setVisitadosRecentes] = useState([]);
  const [lugaresPopulares, setLugaresPopulares] = useState([]);
  const [loadingPopulares, setLoadingPopulares] = useState(false);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [favoritos, setFavoritos] = useState([]);
  const favoritosSyncGuardRef = useRef(createFavoritosSyncGuard());
  const { userPosition } = useUserPosition();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [motivoModal, setMotivoModal] = useState("favoritar");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState("geral");
  const [erroBusca, setErroBusca] = useState("");
  const [erroBuscaReportavel, setErroBuscaReportavel] = useState(false);
  const [erroBuscaContext, setErroBuscaContext] = useState(null);
  const [filtroBuscaStatus, setFiltroBuscaStatus] = useState(FILTRO_STATUS_BUSCA.TODOS);

  const {
    usage: premiumUsage,
    loading: premiumUsageLoading,
    synced: premiumUsageSynced,
    refresh: refreshPremiumUsage,
    setUsage: setPremiumUsage,
  } = usePremiumUsage(user);

  const heroRota = useMemo(
    () => resolveAtrativoDoDia(atrativosAtivos, { requireCapa: true }).rota,
    [atrativosAtivos]
  );

  const emAltaExibidos = useMemo(() => {
    return lugaresEmAlta.map((l) => withDistanciaDinamica(l, userPosition));
  }, [lugaresEmAlta, userPosition]);

  const proximosExibidos = useMemo(() => {
    const sorted = sortLugaresPorDistancia(lugaresProximos, userPosition);
    return sorted.map((l) => withDistanciaDinamica(l, userPosition));
  }, [lugaresProximos, userPosition]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowOnboarding(!localStorage.getItem("onboarding_visto"));
      setOnboardingChecked(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isSupabasePublicConfigured()) {
      setAuthLoading(false);
      return undefined;
    }

    const supabase = createClient();
    if (!supabase) {
      setAuthLoading(false);
      return undefined;
    }

    let accessLogged = false;

    function logAcessouAppOnce(currentUser) {
      if (!currentUser || accessLogged || !shouldLogAcessouAppToday(currentUser.id)) {
        return;
      }
      accessLogged = true;
      registrarLog(supabase, currentUser, "acessou_app");
    }

    function applySession(sessionUser) {
      setUser(sessionUser);
      if (!sessionUser) setFavoritos([]);
      setAuthLoading(false);
    }

    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        const currentUser = session?.user ?? null;
        applySession(currentUser);
        if (currentUser) {
          logAcessouAppOnce(currentUser);
          ensurePerfil(supabase, currentUser);
        }
      })
      .catch((err) => {
        console.error("[home] getSession:", err);
        applySession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      applySession(currentUser);
      if (currentUser && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        ensurePerfil(supabase, currentUser);
      }
      logAcessouAppOnce(currentUser);
    });

    const safetyTimer = window.setTimeout(() => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        applySession(session?.user ?? null);
      });
    }, AUTH_RESOLVE_TIMEOUT_MS);

    return () => {
      window.clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!primaryFeed) return;

    applyHomePrimaryFeed(primaryFeed, {
      setAtrativosAtivos,
      setLugaresAtivos,
      setLugaresParceiros,
      setLugaresEmAlta,
      setLugaresProximos,
      setSectionErrors,
      setHomeLoading,
      setPertoLoading,
    });
  }, [primaryFeed]);

  useEffect(() => {
    if (primaryFeedLoading && !primaryFeed) {
      setHomeLoading(true);
    }
  }, [primaryFeedLoading, primaryFeed]);

  useEffect(() => {
    if (homeLoading) return undefined;

    let cancelled = false;
    setPertoLoading(true);

    async function loadSecondary() {
      try {
        const [proximosResult, climaResult] = await Promise.allSettled([
          fetchLugaresProximos(),
          fetchClimaApisCached(IMBITUBA_COORDS.latitude, IMBITUBA_COORDS.longitude),
        ]);

        if (cancelled) return;

        if (proximosResult.status === "fulfilled") {
          setLugaresProximos(enrichLugaresFlags(proximosResult.value));
          setSectionErrors((prev) => ({ ...prev, perto: false }));
        } else {
          setSectionErrors((prev) => ({ ...prev, perto: true }));
        }

        if (climaResult.status === "fulfilled") {
          const temp = Number(climaResult.value?.temperature);
          setTemperaturaClima(Number.isFinite(temp) ? temp : null);
          setClimaEmoji(climaResult.value?.weatherEmoji ?? null);
          setClimaCondition(climaResult.value?.condition ?? null);
          setSectionErrors((prev) => ({ ...prev, clima: false }));
        } else {
          setTemperaturaClima(null);
          setClimaEmoji(null);
          setClimaCondition(null);
          setSectionErrors((prev) => ({ ...prev, clima: true }));
        }
      } finally {
        if (!cancelled) setPertoLoading(false);
      }
    }

    loadSecondary();

    return () => {
      cancelled = true;
    };
  }, [homeLoading]);

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
        console.error("[home] lugares populares:", err);
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

    /** Closes search overlay when Escape is pressed. @param {KeyboardEvent} event */
    function handleEscape(event) {
      if (event.key === "Escape") fecharBusca();
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
    const userId = user.id;

    fetchFavoritoIds(supabase, userId).then((ids) => {
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

  /**
   * Toggles favorite state for a place; opens login modal if guest.
   * @param {object} lugar - Place to favorite or unfavorite.
   * @returns {Promise<void>}
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

  /** Resets search UI state and blurs the input. */
  function fecharBusca() {
    setSearchMode(null);
    setTermoBusca("");
    setTermoResultado("");
    setResultadosBusca([]);
    setLoadingBusca(false);
    setFiltroBuscaStatus(FILTRO_STATUS_BUSCA.TODOS);
    searchInputRef.current?.blur();
  }

  /** Opens browse mode and refreshes recently visited places. */
  function handleSearchFocus() {
    setVisitadosRecentes(getLugaresVisitados());
    if (searchMode === "results" && termoBusca.trim()) return;
    setSearchMode("browse");
  }

  /**
   * Closes browse mode on blur unless focus moved inside the search container.
   * @param {import("react").FocusEvent<HTMLInputElement>} event - Blur event.
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

  /**
   * Opens the premium paywall sheet for a feature.
   * @param {string} feature - Feature key shown in the paywall.
   */
  function abrirPaywall(feature) {
    setPaywallFeature(feature);
    setPaywallOpen(true);
  }

  /**
   * Runs AI search via `/api/buscar` with premium and login checks.
   * @param {string} query - Search text.
   * @param {string} [filtroOverride] - Optional open/closed status filter.
   * @returns {Promise<void>}
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
            route: "/",
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
        buildReportContext({ code: "NETWORK", route: "/", extra: { query: termo } })
      );
      setResultadosBusca([]);
      await refreshPremiumUsage();
    } finally {
      setLoadingBusca(false);
    }
  }

  /**
   * Runs curated plan search (deterministic, no IA quota).
   * @param {{ id: string, titulo: string, filtro: string }} plano - Quick plan preset.
   * @returns {Promise<void>}
   */
  async function executarPlanoRapido(plano) {
    if (!user) {
      setMotivoModal("busca");
      setIsModalOpen(true);
      return;
    }

    setFiltroBuscaStatus(plano.filtro);
    setTermoBusca(plano.titulo);
    setTermoResultado(plano.titulo);
    setSearchMode("results");
    setLoadingBusca(true);
    setResultadosBusca([]);
    setErroBusca("");
    setErroBuscaReportavel(false);
    setErroBuscaContext(null);
    searchInputRef.current?.focus();

    try {
      const response = await fetchApi("/api/planos-rapidos", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planoId: plano.id,
          filtroStatus: plano.filtro,
          latitude: userPosition?.latitude,
          longitude: userPosition?.longitude,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === "LOGIN_REQUIRED") {
          setMotivoModal("busca");
          setIsModalOpen(true);
          setSearchMode("browse");
          return;
        }
        const mapped = mapApiErrorResponse(data, response.status);
        setErroBusca(mapped.message);
        setErroBuscaReportavel(true);
        setErroBuscaContext(
          buildReportContext({
            code: mapped.code ?? data.code,
            route: "/",
            message: mapped.message,
            extra: { planoId: plano.id },
          })
        );
        setResultadosBusca([]);
        return;
      }

      setResultadosBusca(data.lugares ?? []);
      if (data.message && !(data.lugares ?? []).length) {
        setErroBusca(data.message);
        setErroBuscaReportavel(false);
      }
    } catch {
      setErroBusca(getNetworkErrorMessage());
      setErroBuscaReportavel(true);
      setErroBuscaContext(
        buildReportContext({
          code: "NETWORK",
          route: "/",
          extra: { planoId: plano.id },
        })
      );
      setResultadosBusca([]);
    } finally {
      setLoadingBusca(false);
    }
  }

  /**
   * Applies a quick-plan preset and opens curated results.
   * @param {{ id: string, titulo: string, filtro: string }} plano - Quick plan preset.
   */
  function handlePlanoClick(plano) {
    executarPlanoRapido(plano);
  }

  /**
   * Applies open/closed filter and reruns current query when available.
   * @param {string} nextFiltro
   */
  function handleFiltroBuscaChange(nextFiltro) {
    setFiltroBuscaStatus(nextFiltro);
    const termoAtivo = termoBusca.trim() || termoResultado.trim();
    if (!termoAtivo) return;
    executarBusca(termoAtivo, nextFiltro);
  }

  useEffect(() => {
    if (!onboardingChecked || showOnboarding || authLoading) return undefined;

    const abrirBusca = searchParams.get("busca") === "1";
    const query = searchParams.get("q")?.trim();

    if (!abrirBusca && !query) return undefined;

    if (query) {
      setTermoBusca(query);
      setFiltroBuscaStatus(FILTRO_STATUS_BUSCA.TODOS);
      executarBusca(query);
      return undefined;
    }

    setVisitadosRecentes(getLugaresVisitados());
    setSearchMode("browse");
    const focusTimer = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 200);

    return () => window.clearTimeout(focusTimer);
  }, [onboardingChecked, showOnboarding, authLoading, searchParams]);

  const stickyShellRef = useStickyShellRef();
  const isFavorito = (lugar) => favoritos.includes(String(lugar.id));
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const buscaLimiteDiarioAtingido =
    Boolean(user) && isDailyBuscaLimitReached(premiumUsage);

  /** @param {'login' | 'home'} dest */
  const handleOnboardingComplete = useCallback(
    (dest) => {
      localStorage.setItem("onboarding_visto", "true");
      setShowOnboarding(false);
      if (dest === "login") {
        if (isCapacitorNative()) {
          setMotivoModal("onboarding");
          setIsModalOpen(true);
          return;
        }
        router.replace("/login?from=onboarding");
      }
    },
    [router]
  );

  if (!onboardingChecked) {
    return <HomePageSkeleton />;
  }

  if (showOnboarding) {
    return (
      <Onboarding isLoggedIn={Boolean(user)} onComplete={handleOnboardingComplete} />
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto max-w-md px-4 pb-32">
        <div className="home-context-atmosphere -mx-4">
          <div className="home-context-atmosphere__mesh" aria-hidden="true" />

          <div className="relative z-[1] px-4 pt-safe-top">
            <HomeContextHeader
              user={user}
              avatarUrl={avatarUrl}
              temperatura={temperaturaClima}
              weatherEmoji={climaEmoji}
              weatherCondition={climaCondition}
              climaLoading={!homeLoading && pertoLoading}
              climaErro={!homeLoading && sectionErrors.clima}
              getUserInitial={getUserInitial}
            />
            <SupabaseConfigAlert />
          </div>

          <div ref={stickyShellRef} className="home-header-shell relative z-[1] px-4 pb-4 pt-2">
            <SmartSearch
              searchContainerRef={searchContainerRef}
              searchInputRef={searchInputRef}
              termoBusca={termoBusca}
              searchMode={searchMode}
              onSubmit={(e) => {
                e.preventDefault();
                executarBusca(termoBusca);
              }}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              onChange={setTermoBusca}
              onClose={fecharBusca}
              onChipClick={(chip) => {
                const filtro = chip.filtro ?? FILTRO_STATUS_BUSCA.TODOS;
                setFiltroBuscaStatus(filtro);
                executarBusca(chip.query, filtro);
              }}
              showChips={!searchMode}
            />
          </div>
        </div>

        <div
          className={`transition-all duration-300 ease-out ${
            searchMode
              ? "translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-3 overflow-hidden opacity-0"
          }`}
        >
          {searchMode && (
            <SearchStatusFilter
              value={filtroBuscaStatus}
              onChange={handleFiltroBuscaChange}
            />
          )}
          {user && searchMode && (
            <p className="mb-2 text-center text-[10px] text-[#8a9a95]">
              {premiumUsageLoading && !premiumUsage
                ? "Carregando uso de IA…"
                : premiumUsage?.premium
                  ? "Premium · buscas ilimitadas"
                  : `IA ${premiumUsage?.buscas?.used ?? 0}/${premiumUsage?.buscas?.limit ?? LIMITS.busca} hoje · renova à meia-noite`}
            </p>
          )}
          {buscaLimiteDiarioAtingido && searchMode && (
            <div className="mb-3">
              <DailyLimitCountdown initialMs={premiumUsage?.msUntilReset} />
            </div>
          )}
          {searchMode === "browse" && (
            <SearchBrowsePanel
              visitados={visitadosRecentes}
              populares={lugaresPopulares}
              loadingPopulares={loadingPopulares}
            />
          )}
          {searchMode === "results" && (
            <SearchResultsPanel
              termo={termoResultado}
              loading={loadingBusca}
              resultados={resultadosBusca.map((l) =>
                withDistanciaDinamica(l, userPosition)
              )}
              erro={erroBusca}
              erroReportavel={erroBuscaReportavel}
              erroReportContext={erroBuscaContext}
              onSugestaoClick={executarBusca}
              isFavorito={isFavorito}
              onFavoritar={handleFavoritar}
            />
          )}
        </div>

        <div
          className={`space-y-0 transition-all duration-300 ease-out ${
            searchMode
              ? "pointer-events-none max-h-0 -translate-y-3 overflow-hidden opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          {!homeLoading && (
            <>
              {sectionErrors.hero ? (
                <SectionUnavailable title="O que fazer agora" />
              ) : (
                <OQueFazerAgora rota={heroRota} temperatura={temperaturaClima} />
              )}
              <BaleiasTemporadaCard />
              <ParceirosCarrossel
                lugares={lugaresParceiros.map((l) =>
                  withDistanciaDinamica(l, userPosition)
                )}
              />
              {sectionErrors.emAlta ? (
                <SectionUnavailable title="🔥 Em alta hoje" />
              ) : (
                <EmAltaHoje lugares={emAltaExibidos} />
              )}
              <PlanosRapidos onPlanoClick={handlePlanoClick} />
              {sectionErrors.perto ? (
                <SectionUnavailable title="Perto de você" />
              ) : pertoLoading ? (
                <section className="mb-6 home-reveal">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1a4a3a]/75">
                    Descoberta complementar
                  </p>
                  <h2 className="mt-1 font-display text-xl font-bold text-[#1a2e28]">
                    Perto de você
                  </h2>
                  <div className="mt-4 flex gap-3.5 overflow-hidden">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="h-[420px] w-[300px] shrink-0 animate-pulse rounded-[28px] bg-[#e8eeee]"
                      />
                    ))}
                  </div>
                </section>
              ) : (
                <PertoDeVoce
                  user={user}
                  lugares={proximosExibidos}
                  isFavorito={isFavorito}
                  onFavoritar={handleFavoritar}
                />
              )}
            </>
          )}

          {homeLoading && (
            <div className="py-16 text-center text-sm text-[#5a6b66]">
              Montando sugestões para você...
            </div>
          )}
        </div>
      </div>

      <LoginModal
        isOpen={isModalOpen}
        motivo={motivoModal}
        onClose={() => setIsModalOpen(false)}
      />

      <PremiumPaywallSheet
        isOpen={paywallOpen}
        feature={paywallFeature}
        user={user}
        onLoginRequired={() => {
          setPaywallOpen(false);
          setMotivoModal("premium");
          setIsModalOpen(true);
        }}
        onPremiumActivated={(nextUsage) => {
          if (nextUsage) setPremiumUsage(nextUsage);
          else refreshPremiumUsage();
        }}
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
}

/**
 * @returns {import("react").ReactElement}
 */
/**
 * @param {object} props
 * @param {Awaited<ReturnType<import('@/lib/homePageData').fetchHomePageInitialData>>} [props.initialHomeData]
 * @returns {import("react").ReactElement}
 */
export default function HomePageClient({ initialHomeData = null }) {
  return (
    <Suspense fallback={<HomePageSkeleton />}>
      <Home initialHomeData={initialHomeData} />
    </Suspense>
  );
}
