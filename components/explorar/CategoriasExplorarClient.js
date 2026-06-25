"use client";

import { useEffect, useMemo, useState } from "react";
import BottomNav from "@/components/BottomNav";
import ExplorarAtalhos from "@/components/explorar/ExplorarAtalhos";
import ExplorarBuscaBar from "@/components/explorar/ExplorarBuscaBar";
import ExplorarCategoriaCard from "@/components/explorar/ExplorarCategoriaCard";
import ExplorarHeader from "@/components/explorar/ExplorarHeader";
import { useStickyShellRef } from "@/hooks/useHomeHeaderScroll";
import ExplorarSkeleton from "@/components/explorar/ExplorarSkeleton";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import SupabaseConfigAlert from "@/components/SupabaseConfigAlert";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";
import { CATEGORIAS_EXPLORE, sortCategoriasPorContagem } from "@/lib/categorias";
import { fetchExplorarFromApi } from "@/lib/fetchExplorarApi";

/**
 * Tela Explorar — descoberta por categorias, intenções e busca IA.
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
  }, [hasInitial]);

  const totalLugares = useMemo(
    () =>
      CATEGORIAS_EXPLORE.reduce((acc, item) => acc + (counts[item.nome] || 0), 0),
    [counts]
  );

  const categoriasOrdenadas = useMemo(
    () => sortCategoriasPorContagem(CATEGORIAS_EXPLORE, counts),
    [counts]
  );

  const categoriasComConteudo = useMemo(
    () => categoriasOrdenadas.filter((item) => (counts[item.nome] || 0) > 0),
    [categoriasOrdenadas, counts]
  );

  const categoriasEmBreve = useMemo(
    () => categoriasOrdenadas.filter((item) => (counts[item.nome] || 0) === 0),
    [categoriasOrdenadas, counts]
  );

  const categoriasComLugares = categoriasComConteudo.length;

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto max-w-md px-4 pb-32">
        <ExplorarHeader
          loading={loading}
          totalLugares={totalLugares}
          categoriasComLugares={categoriasComLugares}
        />

        <div ref={stickyShellRef} className="explorar-header-shell -mx-4 px-4 pb-2 pt-1">
          {loading ? (
            <div
              className="home-explorar-search-section mb-4 mt-1 h-[48px] animate-pulse rounded-[20px] bg-[#e8eeee]"
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
            {categoriasComConteudo.length > 0 && (
              <section
                className="home-reveal mb-10"
                style={{ animationDelay: "100ms" }}
                aria-labelledby="explorar-grid-title"
              >
                <HomeSectionHeader
                  eyebrow="Com conteúdo"
                  title="Explore por categoria"
                  titleId="explorar-grid-title"
                />
                <div className="grid grid-cols-2 gap-3">
                  {categoriasComConteudo.map((categoria) => (
                    <ExplorarCategoriaCard
                      key={categoria.nome}
                      categoria={categoria}
                      count={counts[categoria.nome] || 0}
                      imagemUrl={capas[categoria.nome]}
                    />
                  ))}
                </div>
              </section>
            )}

            {categoriasEmBreve.length > 0 && (
              <section
                className="home-reveal mb-10"
                style={{ animationDelay: "140ms" }}
                aria-labelledby="explorar-em-breve-title"
              >
                <HomeSectionHeader
                  eyebrow="Em curadoria"
                  title="Em breve no guia"
                  titleId="explorar-em-breve-title"
                />
                <p className="-mt-2 mb-4 text-sm leading-relaxed text-[#5a6b66]">
                  Estamos preparando estas categorias. Toque para saber mais sobre cada uma.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {categoriasEmBreve.map((categoria) => (
                    <ExplorarCategoriaCard
                      key={categoria.nome}
                      categoria={categoria}
                      count={0}
                      imagemUrl={capas[categoria.nome]}
                    />
                  ))}
                </div>
              </section>
            )}

            {categoriasComConteudo.length === 0 && categoriasEmBreve.length === 0 && (
              <div className="home-reveal mb-10 rounded-[28px] bg-white p-6 text-center ring-1 ring-[#e8eeee]">
                <p className="text-sm text-[#5a6b66]">
                  Nenhuma categoria disponível no momento. Tente a busca inteligente abaixo.
                </p>
              </div>
            )}

            <ExplorarAtalhos />
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
