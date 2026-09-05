"use client";

import RoteiroSection from "@/components/atrativos/RoteiroSection";
import AtrativosCatalogo from "@/components/atrativos/AtrativosCatalogo";
import { useAtrativosPageData } from "@/hooks/useAtrativosPageData";

function IconMapEmpty() {
  return (
    <svg className="h-11 w-11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  );
}

/**
 * Aba Atrativos — lista e roteiros com cache client-side.
 * @param {{ initialData: { atrativos: object[], roteiros: object[] } }} props
 * @returns {import("react").ReactElement}
 */
export default function AtrativosPageClient({ initialData }) {
  const { data, loading } = useAtrativosPageData(initialData);
  const atrativos = data?.atrativos ?? [];
  const roteiros = data?.roteiros ?? [];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto box-border w-full min-w-0 max-w-md overflow-x-hidden px-4 pb-28 pt-safe-top">
        <header className="pb-5">
          <h1 className="text-2xl font-bold tracking-tight text-[#1a2e28]">Roteiros</h1>
          <p className="mt-1 text-sm text-[#5a6b66]">Trilhas e experiências selecionadas</p>
        </header>

        <div className="min-w-0 space-y-0 pt-5">
          <RoteiroSection roteirosIniciais={roteiros} />

          {loading && atrativos.length === 0 ? (
            <section className="animate-pulse space-y-3" aria-hidden>
              {[1, 2, 3].map((item) => (
                <div key={item} className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm">
                  <div className="h-24 w-24 shrink-0 rounded-xl bg-[#e8eeee]" />
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-5 w-3/4 rounded-xl bg-[#e8eeee]" />
                    <div className="h-4 w-full rounded-xl bg-[#e8eeee]" />
                  </div>
                </div>
              ))}
            </section>
          ) : atrativos.length === 0 ? (
            <section className="overflow-hidden rounded-2xl bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4ede8] text-[#1a4a3a]">
                <IconMapEmpty />
              </div>
              <h2 className="mt-4 text-lg font-bold text-[#1a2e28]">
                Nenhum roteiro cadastrado ainda
              </h2>
              <p className="mt-2 text-sm text-[#5a6b66]">
                Em breve novos roteiros aparecerão aqui.
              </p>
            </section>
          ) : (
            <AtrativosCatalogo atrativos={atrativos} />
          )}
        </div>
      </div>
    </div>
  );
}
