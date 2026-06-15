"use client";

import { useState } from "react";
import { ATRATIVO_INFO_MINI_CARD_CLASS, ATRATIVO_SECTION_TITLE_CLASS } from "@/components/atrativos/atrativoDetalheTokens";

const PREVIEW_CHARS = 160;

/**
 * Seção "Sobre este atrativo" com mini cards e descrição expansível.
 * @param {object} props
 * @param {string} props.descricao
 * @param {Array<{ titulo: string, icone: string, accent: string, texto: string }>} props.infoCards
 */
export default function AtrativoSobreSection({ descricao, infoCards = [] }) {
  const [expandido, setExpandido] = useState(false);
  const texto = descricao?.trim() || "Descrição não informada.";
  const precisaExpandir = texto.length > PREVIEW_CHARS;

  return (
    <section className="mt-9">
      <div className="flex items-center justify-between gap-3">
        <h2 className={ATRATIVO_SECTION_TITLE_CLASS}>Sobre este atrativo</h2>
        {precisaExpandir && (
          <button
            type="button"
            onClick={() => setExpandido((v) => !v)}
            className="shrink-0 text-sm font-semibold text-[#1a4a3a] transition-opacity active:opacity-70"
          >
            {expandido ? "ver menos" : "ver mais"}
          </button>
        )}
      </div>

      {infoCards.length > 0 && (
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {infoCards.map((card) => (
            <article key={card.titulo} className={ATRATIVO_INFO_MINI_CARD_CLASS}>
              <span
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-lg ${card.accent}`}
                aria-hidden
              >
                {card.icone}
              </span>
              <h3 className="text-sm font-bold text-[#1a2e28]">{card.titulo}</h3>
              <p className="text-[13px] leading-relaxed text-[#5a6b66]">{card.texto}</p>
            </article>
          ))}
        </div>
      )}

      <p
        className={`mt-4 text-[15px] leading-[1.7] text-[#5a6b66] ${
          expandido || !precisaExpandir ? "" : "line-clamp-4"
        }`}
      >
        {texto}
      </p>
    </section>
  );
}
