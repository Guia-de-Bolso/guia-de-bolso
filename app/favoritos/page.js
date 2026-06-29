"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import LoginModal from "@/components/LoginModal";
import Logo from "@/components/Logo";
import PlaceCard from "@/components/PlaceCard";
import PlaceCardSkeleton from "@/components/home/PlaceCardSkeleton";
import AtrativoFavoritoCard from "@/components/atrativos/AtrativoFavoritoCard";
import UserErrorAlert from "@/components/UserErrorAlert";
import OfflineFavoritosBanner from "@/components/favoritos/OfflineFavoritosBanner";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { buildReportContext } from "@/lib/reportContext";
import {
  formatOfflineSavedAt,
  listOfflineFavoritos,
  FAVORITO_OFFLINE_TYPES,
} from "@/lib/favoritosOffline";
import {
  purgeOfflineFavorito,
  syncAllFavoritosOffline,
} from "@/lib/favoritosOfflineFetch";
import { buildFavoritosPrecachePaths } from "@/lib/serviceWorkerPaths";
import { precacheFavoritosShell } from "@/lib/serviceWorker";
import { createClient } from "@/lib/supabase";
import { registrarLog } from "@/lib/logs";

/**
 * Empty-state illustration for the favorites page.
 * @returns {import("react").ReactElement}
 */
function EmptyIllustration() {
  return (
    <div className="mx-auto flex flex-col items-center gap-4">
      <Logo size="lg" showWordmark />
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#d4ede8] text-[#1a4a3a]">
        <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
        </svg>
      </div>
    </div>
  );
}

/**
 * User favorites list with login gate and optimistic remove.
 * @returns {import("react").ReactElement}
 */
export default function FavoritosPage() {
  const router = useRouter();
  const { isOnline, ready: networkReady } = useNetworkStatus();
  const isOffline = networkReady && !isOnline;
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lugares, setLugares] = useState([]);
  const [atrativos, setAtrativos] = useState([]);
  const [loadingFavoritos, setLoadingFavoritos] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [fetchAtrativosError, setFetchAtrativosError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastSyncedLabel, setLastSyncedLabel] = useState(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (!currentUser) {
        setLugares([]);
        setAtrativos([]);
      }
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setLugares([]);
        setAtrativos([]);
      }
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user || !networkReady) return;

    let cancelled = false;
    const supabase = createClient();
    const loadingTimer = setTimeout(() => {
      if (!cancelled) setLoadingFavoritos(true);
    }, 0);

    async function loadFromOfflineCache() {
      const cached = await listOfflineFavoritos(user.id);
      if (cancelled) return;
      setLugares(cached.lugares);
      setAtrativos(cached.atrativos);
      setLastSyncedLabel(formatOfflineSavedAt(cached.lastSyncedAt));
      setFetchError(false);
      setFetchAtrativosError(false);
      setLoadingFavoritos(false);
    }

    async function loadFavoritos() {
      if (!isOnline) {
        await loadFromOfflineCache();
        return;
      }

      try {
        const synced = await syncAllFavoritosOffline(supabase, user.id);
        if (cancelled) return;

        setLugares(synced.lugares);
        setAtrativos(synced.atrativos);
        setLastSyncedLabel(formatOfflineSavedAt(synced.syncedAt));
        setFetchError(false);
        setFetchAtrativosError(false);
        await precacheFavoritosShell(
          buildFavoritosPrecachePaths(synced.lugares, synced.atrativos)
        );
      } catch {
        if (cancelled) return;
        await loadFromOfflineCache();
      } finally {
        if (!cancelled) setLoadingFavoritos(false);
      }
    }

    loadFavoritos();

    return () => {
      cancelled = true;
      clearTimeout(loadingTimer);
    };
  }, [user, isOnline, networkReady]);

  /**
   * Removes a place from the user's favorites with optimistic UI update.
   * @param {object} lugar - Place to unfavorite.
   * @returns {Promise<void>}
   */
  async function handleRemoverFavorito(lugar) {
    if (!user) {
      setIsModalOpen(true);
      return;
    }

    const supabase = createClient();
    const anteriores = lugares;

    setLugares((atuais) =>
      atuais.filter((item) => String(item.id) !== String(lugar.id))
    );

    const { error } = await supabase
      .from("favoritos")
      .delete()
      .eq("user_id", user.id)
      .eq("lugar_id", lugar.id);

    if (error) {
      setLugares(anteriores);
    } else {
      await purgeOfflineFavorito(user.id, FAVORITO_OFFLINE_TYPES.LUGAR, String(lugar.id));
      await registrarLog(supabase, user, "desfavoritou", {
        lugar_id: lugar.id,
        lugar_nome: lugar.nome,
      });
    }
  }

  async function handleRemoverAtrativoFavorito(rota) {
    if (!user) {
      setIsModalOpen(true);
      return;
    }

    const supabase = createClient();
    if (!supabase) return;

    const anteriores = atrativos;
    const nome = rota.nome || rota.titulo || "Atrativo";

    setAtrativos((atuais) => atuais.filter((item) => String(item.id) !== String(rota.id)));

    const { error } = await supabase
      .from("rotas_favoritas")
      .delete()
      .eq("user_id", user.id)
      .eq("rota_id", rota.id);

    if (error) {
      console.error("[rotas_favoritas] delete favoritos page:", error);
      setAtrativos(anteriores);
      return;
    }

    await purgeOfflineFavorito(user.id, FAVORITO_OFFLINE_TYPES.ATIVO, String(rota.id));

    await registrarLog(supabase, user, "desfavoritou", {
      rota_id: rota.id,
      rota_nome: nome,
    });
  }

  const totalFavoritos = lugares.length + atrativos.length;
  const showCount = user && !authLoading && !loadingFavoritos && totalFavoritos > 0;
  const hasAnyFavorito = totalFavoritos > 0;
  const showEmptyState =
    user && !loadingFavoritos && !fetchError && !hasAnyFavorito && !fetchAtrativosError;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto box-border w-full min-w-0 max-w-md overflow-x-hidden px-4 pb-28 pt-safe-top">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Logo size="sm" className="mb-3" />
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#1a2e28]">
              Favoritos
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-[#5a6b66]">
              Seus lugares e atrativos salvos — disponíveis offline automaticamente.
            </p>
          </div>
          {showCount && (
            <span
              className="shrink-0 rounded-full bg-[#d4ede8] px-3 py-1.5 text-sm font-bold tabular-nums text-[#1a4a3a]"
              aria-label={`${totalFavoritos} favoritos`}
            >
              {totalFavoritos}
            </span>
          )}
        </header>

        {user && !authLoading && !loadingFavoritos && (isOffline || lastSyncedLabel) ? (
          <OfflineFavoritosBanner
            isOffline={isOffline}
            lastSyncedLabel={lastSyncedLabel}
          />
        ) : null}

        {fetchAtrativosError && user && !loadingFavoritos && (
          <UserErrorAlert
            message="Não foi possível carregar seus atrativos favoritos. Tente novamente."
            reportContext={buildReportContext({ code: "SERVER", route: "/favoritos" })}
            action={
              <button
                type="button"
                onClick={() => router.refresh()}
                className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-800"
              >
                Tentar novamente
              </button>
            }
          />
        )}

        {fetchError && user && !loadingFavoritos && (
          <UserErrorAlert
            message="Não foi possível carregar seus favoritos. Tente novamente."
            reportContext={buildReportContext({ code: "SERVER", route: "/favoritos" })}
            action={
              <button
                type="button"
                onClick={() => router.refresh()}
                className="rounded-lg bg-red-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-800"
              >
                Tentar novamente
              </button>
            }
          />
        )}

        {authLoading ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <PlaceCardSkeleton key={item} />
            ))}
          </div>
        ) : !user ? (
          <section className="rounded-3xl bg-white p-6 text-center shadow-[0_2px_14px_-4px_rgba(26,46,40,0.08)]">
            <EmptyIllustration />
            <h2 className="mt-5 font-display text-xl font-extrabold text-[#1a4a3a]">
              Faça login para ver seus favoritos
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5a6b66]">
              Salve lugares especiais e acesse tudo depois — inclusive sem sinal de celular.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#153d30] active:bg-[#123528]"
            >
              Fazer login
            </button>
          </section>
        ) : loadingFavoritos ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <PlaceCardSkeleton key={item} />
            ))}
          </div>
        ) : showEmptyState ? (
          <section className="rounded-3xl bg-white p-6 text-center shadow-[0_2px_14px_-4px_rgba(26,46,40,0.08)]">
            <EmptyIllustration />
            <h2 className="mt-5 font-display text-xl font-extrabold text-[#1a4a3a]">
              Nenhum favorito ainda
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5a6b66]">
              Explore o guia e toque no coração para salvar lugares e atrativos.
            </p>
            <div className="mt-6 grid gap-3">
              <Link
                href="/categorias"
                className="block w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#153d30] active:bg-[#123528]"
              >
                Explorar categorias
              </Link>
              <Link
                href="/atrativos"
                className="block w-full rounded-xl border border-[#1a4a3a]/20 bg-white py-3.5 text-sm font-semibold text-[#1a4a3a] transition-colors hover:bg-[#eef5f2]"
              >
                Ver atrativos
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid min-w-0 gap-8">
            {lugares.length > 0 ? (
              <section className="min-w-0">
                {atrativos.length > 0 ? (
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-[#5a6b66]">
                    Lugares
                  </h2>
                ) : null}
                <ul className="grid min-w-0 list-none gap-4 p-0">
                  {lugares.map((lugar) => (
                    <li key={lugar.id} className="min-w-0">
                      <div className="box-border w-full min-w-0 max-w-full overflow-hidden">
                        <PlaceCard
                          lugar={lugar}
                          isFavorito
                          hrefOverride={`/favoritos/lugar/${lugar.id}`}
                          preferDocumentNavWhenOffline
                          onFavoritar={handleRemoverFavorito}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {atrativos.length > 0 ? (
              <section className="min-w-0">
                {lugares.length > 0 ? (
                  <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.12em] text-[#5a6b66]">
                    Atrativos
                  </h2>
                ) : null}
                <ul className="grid min-w-0 list-none gap-4 p-0">
                  {atrativos.map((rota) => (
                    <li key={rota.id} className="min-w-0">
                      <AtrativoFavoritoCard
                        rota={rota}
                        onRemover={() => handleRemoverAtrativoFavorito(rota)}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        )}
      </div>

      <BottomNav />

      <LoginModal
        isOpen={isModalOpen}
        motivo="favoritar"
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
