"use client";

import Logo from "@/components/Logo";

/**
 * Topo editorial da Explorar (rola com a página; busca IA fica em shell sticky separado).
 * @param {object} props
 * @param {boolean} props.loading
 * @param {number} props.totalLugares
 * @param {number} props.categoriasComLugares
 * @returns {import("react").JSX.Element}
 */
export default function ExplorarHeader({ loading, totalLugares, categoriasComLugares }) {
  const subtitulo = loading
    ? "Carregando lugares da região…"
    : `${totalLugares} lugares em ${categoriasComLugares} categorias`;

  return (
    <div className="-mx-4 px-4 pt-safe-top pb-1">
      <div className="mb-3 flex items-center gap-2.5">
        <Logo size="md" variant="default" />
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]/70">
          Guia de Bolso
        </p>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1a4a3a]/75">
        Descoberta local
      </p>
      <h2 className="mt-1 font-display text-[1.75rem] font-bold leading-[1.12] tracking-tight text-[#1a2e28]">
        Explorar
      </h2>

      <p className="mt-2 text-sm font-medium text-[#5a6b66]">{subtitulo}</p>
    </div>
  );
}
