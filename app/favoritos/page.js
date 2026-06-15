"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BottomNav from "@/components/BottomNav";
import LoginModal from "@/components/LoginModal";
import Logo from "@/components/Logo";
import PlaceCard from "@/components/PlaceCard";
import PlaceCardSkeleton from "@/components/home/PlaceCardSkeleton";
import UserErrorAlert from "@/components/UserErrorAlert";
import { buildReportContext } from "@/lib/reportContext";
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
 * Extracts the nested lugar record from a favoritos join row.
 * @param {object} favorito - Favorito row with `lugares` or `lugar` relation.
 * @returns {object|undefined} Place object or undefined.
 */
function normalizeLugarFromFavorito(favorito) {
  const nested = favorito.lugares || favorito.lugar;
  if (Array.isArray(nested)) return nested[0];
  return nested;
}

/**
 * User favorites list with login gate and optimistic remove.
 * @returns {import("react").ReactElement}
 */
export default function FavoritosPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [lugares, setLugares] = useState([]);
  const [loadingFavoritos, setLoadingFavoritos] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
      if (!currentUser) setLugares([]);
      setAuthLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setLugares([]);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const supabase = createClient();
    const loadingTimer = setTimeout(() => {
      if (!cancelled) setLoadingFavoritos(true);
    }, 0);

    supabase
      .from("favoritos")
      .select("id,lugar_id,lugares!inner(*)")
      .eq("user_id", user.id)
      .eq("lugares.status", "ativo")
      .then(async ({ data, error }) => {
        if (cancelled) return;

        if (!error) {
          setFetchError(false);
          setLugares((data ?? []).map(normalizeLugarFromFavorito).filter(Boolean));
          setLoadingFavoritos(false);
          return;
        }

        const { data: favoritos, error: favoritosError } = await supabase
          .from("favoritos")
          .select("lugar_id")
          .eq("user_id", user.id);

        if (favoritosError) {
          setFetchError(true);
          setLugares([]);
          setLoadingFavoritos(false);
          return;
        }

        const ids = (favoritos ?? []).map((favorito) => favorito.lugar_id);

        if (ids.length === 0) {
          setFetchError(false);
          setLugares([]);
          setLoadingFavoritos(false);
          return;
        }

        const { data: lugaresData, error: lugaresError } = await supabase
          .from("lugares")
          .select("*")
          .in("id", ids)
          .eq("status", "ativo");

        if (lugaresError) {
          setFetchError(true);
          setLugares([]);
          setLoadingFavoritos(false);
          return;
        }

        setFetchError(false);
        setLugares(lugaresData ?? []);
        setLoadingFavoritos(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(loadingTimer);
    };
  }, [user]);

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
      await registrarLog(supabase, user, "desfavoritou", {
        lugar_id: lugar.id,
        lugar_nome: lugar.nome,
      });
    }
  }

  const showCount =
    user && !authLoading && !loadingFavoritos && !fetchError && lugares.length > 0;

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto max-w-md px-4 pb-28 pt-safe-top">
        <header className="mb-6 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Logo size="sm" className="mb-3" />
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#1a2e28]">
              Favoritos
            </h1>
            <p className="mt-1 text-sm leading-relaxed text-[#5a6b66]">
              Seus lugares salvos para visitar quando quiser.
            </p>
          </div>
          {showCount && (
            <span
              className="shrink-0 rounded-full bg-[#d4ede8] px-3 py-1.5 text-sm font-bold tabular-nums text-[#1a4a3a]"
              aria-label={`${lugares.length} favoritos`}
            >
              {lugares.length}
            </span>
          )}
        </header>

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
              Salve lugares especiais e acesse tudo depois com facilidade.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-6 w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#153d30] active:bg-[#123528]"
            >
              Fazer login
            </button>
          </section>
        ) : fetchError ? null : loadingFavoritos ? (
          <div className="grid gap-4">
            {[0, 1, 2].map((item) => (
              <PlaceCardSkeleton key={item} />
            ))}
          </div>
        ) : lugares.length === 0 ? (
          <section className="rounded-3xl bg-white p-6 text-center shadow-[0_2px_14px_-4px_rgba(26,46,40,0.08)]">
            <EmptyIllustration />
            <h2 className="mt-5 font-display text-xl font-extrabold text-[#1a4a3a]">
              Nenhum favorito ainda
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#5a6b66]">
              Explore o guia e toque no coração para salvar seus lugares.
            </p>
            <Link
              href="/categorias"
              className="mt-6 block w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#153d30] active:bg-[#123528]"
            >
              Explorar categorias
            </Link>
          </section>
        ) : (
          <ul className="grid list-none gap-4 p-0">
            {lugares.map((lugar) => (
              <li key={lugar.id}>
                <PlaceCard
                  lugar={lugar}
                  isFavorito
                  onFavoritar={handleRemoverFavorito}
                />
              </li>
            ))}
          </ul>
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
