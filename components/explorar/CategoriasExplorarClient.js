"use client";

import { useMemo } from "react";
import ExplorarAtalhos from "@/components/explorar/ExplorarAtalhos";
import ExplorarCategoriaCard from "@/components/explorar/ExplorarCategoriaCard";
import ExplorarHeader from "@/components/explorar/ExplorarHeader";
import ExplorarSkeleton from "@/components/explorar/ExplorarSkeleton";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import SmartSearchExperience from "@/components/home/SmartSearchExperience";
import SupabaseConfigAlert from "@/components/SupabaseConfigAlert";
import { useStickyShellRef } from "@/hooks/useHomeHeaderScroll";
import { useExplorarData } from "@/hooks/useExplorarData";
import { getCategoriasVisiveis, sortCategoriasPorContagem } from "@/lib/categorias";

/**
 * Tela Explorar — descoberta por categorias, intenções e busca IA.
 */
export default function CategoriasExplorarClient({ initialData = null }) {
  const stickyShellRef = useStickyShellRef();
  const { data: explorarData, loading } = useExplorarData(initialData);
  const counts = explorarData?.counts ?? {};
  const capas = explorarData?.capas ?? {};

  const totalLugares = useMemo(
    () =>
      getCategoriasVisiveis().reduce((acc, item) => acc + (counts[item.nome] || 0), 0),
    [counts]
  );

  const categoriasOrdenadas = useMemo(
    () => sortCategoriasPorContagem(getCategoriasVisiveis(), counts),
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

        <SmartSearchExperience
          stickyShellRef={stickyShellRef}
          shellClassName="explorar-header-shell -mx-4 px-4 pb-2 pt-1"
          reportRoute="/categorias"
        >
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
                    Nenhuma categoria disponível no momento. Use a busca inteligente acima.
                  </p>
                </div>
              )}

              <ExplorarAtalhos />
            </>
          )}
        </SmartSearchExperience>
      </div>
    </div>
  );
}
