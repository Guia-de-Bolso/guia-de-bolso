"use client";

import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import ExplorarAtalhos from "@/components/explorar/ExplorarAtalhos";
import ExplorarBuscaBar from "@/components/explorar/ExplorarBuscaBar";
import ExplorarCategoriaCard from "@/components/explorar/ExplorarCategoriaCard";
import ExplorarDestaqueCard from "@/components/explorar/ExplorarDestaqueCard";
import ExplorarHeader from "@/components/explorar/ExplorarHeader";
import { useStickyShellRef } from "@/hooks/useHomeHeaderScroll";
import ExplorarSkeleton from "@/components/explorar/ExplorarSkeleton";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { HOME_CAROUSEL_TRACK_CLASS } from "@/components/home/homeTokens";
import SupabaseConfigAlert from "@/components/SupabaseConfigAlert";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";
import {
  CATEGORIAS_EXPLORE,
  getCategoriasEmDestaque,
  sortCategoriasPorContagem,
} from "@/lib/categorias";
import { fetchExplorarFromApi } from "@/lib/fetchExplorarApi";

/**
 * Tela Explorar — descoberta por categorias, intenções e busca IA.
 * @param {object} [props]
 * @param {Awaited<ReturnType<import('@/lib/explorarPageData').fetchExplorarPageData>>} [props.initialData]
 * @returns {import("react").JSX.Element}
 */
export default function CategoriasExplorarClient({ initialData = null }) {
  const hasInitial = Boolean(initialData?.totalLugares);
  const stickyShellRef = useStickyShellRef();
  const [counts, setCounts] = useState(initialData?.counts ?? {});
  const [capas, setCapas] = useState(initialData?.capas ?? {});
  const [loading, setLoading] = useState(!hasInitial);

  useEffect(() => {
    if (hasInitial) return undefined;

    if (!isSupabasePublicConfigured()) {
      setLoading(false);
      return undefined;
    }

    fetchExplorarFromApi()
      .then((data) => {
        setCounts(data?.counts ?? {});
        setCapas(data?.capas ?? {});
        setLoading(false);
      })
      .catch((err) => {
        console.error("[Explorar] lugares:", err);
        setCounts({});
        setCapas({});
        setLoading(false);
      });

    return undefined;
  }, []);

  const totalLugares = useMemo(
    () =>
      CATEGORIAS_EXPLORE.reduce((acc, item) => acc + (counts[item.nome] || 0), 0),
    [counts]
  );

  const categoriasOrdenadas = useMemo(
    () => sortCategoriasPorContagem(CATEGORIAS_EXPLORE, counts),
    [counts]
  );

  const destaques = useMemo(
    () => getCategoriasEmDestaque(CATEGORIAS_EXPLORE, counts, 3),
    [counts]
  );

  const categoriasComLugares = useMemo(
    () => categoriasOrdenadas.filter((item) => (counts[item.nome] || 0) > 0).length,
    [categoriasOrdenadas, counts]
  );

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto max-w-md px-4 pb-32">
        <ExplorarHeader
          loading={loading}
          totalLugares={totalLugares}
          categoriasComLugares={categoriasComLugares}
        />

        <div ref={stickyShellRef} className="explorar-header-shell -mx-4 px-4 pb-4 pt-2">
          {loading ? (
            <div
              className="home-explorar-search-section mb-6 mt-1 h-[60px] animate-pulse rounded-[24px] bg-[#e8eeee]"
              aria-hidden
            />
          ) : (
            <ExplorarBuscaBar />
          )}
        </div>

        <SupabaseConfigAlert />
        {loading ? (
          <ExplorarSkeleton />
        ) : (
          <>
            {destaques.length > 0 && (
              <section
                className="home-reveal mb-10 overflow-visible"
                style={{ animationDelay: "60ms" }}
                aria-labelledby="explorar-destaques-title"
              >
                <HomeSectionHeader
                  eyebrow="Em destaque"
                  title="Mais visitadas agora"
                  titleId="explorar-destaques-title"
                />
                <div className={`${HOME_CAROUSEL_TRACK_CLASS} -mx-4 px-4`}>
                  {destaques.map((categoria, index) => (
                    <ExplorarDestaqueCard
                      key={categoria.nome}
                      categoria={{
                        ...categoria,
                        destaque: index === 0 ? "Mais popular" : undefined,
                      }}
                      count={counts[categoria.nome] || 0}
                      imagemUrl={capas[categoria.nome]}
                    />
                  ))}
                </div>
              </section>
            )}

            <section
              className="home-reveal mb-10"
              style={{ animationDelay: "100ms" }}
              aria-labelledby="explorar-grid-title"
            >
              <HomeSectionHeader title="Todas as categorias" titleId="explorar-grid-title" />
              <div className="grid grid-cols-2 gap-3">
                {categoriasOrdenadas.map((categoria) => (
                  <ExplorarCategoriaCard
                    key={categoria.nome}
                    categoria={categoria}
                    count={counts[categoria.nome] || 0}
                    imagemUrl={capas[categoria.nome]}
                  />
                ))}
              </div>
            </section>

            <ExplorarAtalhos />
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
