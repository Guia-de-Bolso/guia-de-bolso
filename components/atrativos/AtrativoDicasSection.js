"use client";

import { ATRATIVO_SECTION_TITLE_CLASS } from "@/components/atrativos/atrativoDetalheTokens";

/**
 * Lista completa de dicas da rota (largura total, texto legível).
 * @param {object} props
 * @param {Array<{ id: string, texto?: string, ordem?: number }>} props.dicas
 */
export default function AtrativoDicasSection({ dicas = [] }) {
  const itens = dicas.filter((d) => d.texto?.trim());
  if (!itens.length) return null;

  return (
    <section className="mt-10">
      <h2 className={ATRATIVO_SECTION_TITLE_CLASS}>Dicas</h2>
      <ol className="mt-4 grid list-none gap-3 p-0">
        {itens.map((dica, index) => (
          <li
            key={dica.id}
            className="flex gap-3 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(26,46,40,0.06)] ring-1 ring-[#e8eeee] transition-transform active:scale-[0.99]"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#d4ede8] text-sm font-bold text-[#1a4a3a]">
              {dica.ordem || index + 1}
            </span>
            <p className="min-w-0 flex-1 text-[15px] leading-[1.65] text-[#5a6b66]">
              {dica.texto.trim()}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
