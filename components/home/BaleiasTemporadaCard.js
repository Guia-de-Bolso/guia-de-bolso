"use client";

import {
  BALEIAS_AVISTAGENS_URL,
  BALEIAS_FONTE_NOME,
  BALEIAS_INSTITUTO_URL,
  getTemporadaBaleiasSubtitulo,
  isTemporadaBaleiasAtiva,
} from "@/lib/baleiasTemporada";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";

/**
 * Card sazonal na home com link para o mapa oficial de avistagens do ProFRANCA.
 * Visível apenas de julho a novembro (America/Sao_Paulo).
 * @returns {import("react").ReactElement|null}
 */
export default function BaleiasTemporadaCard() {
  if (!isTemporadaBaleiasAtiva()) return null;

  const subtitulo = getTemporadaBaleiasSubtitulo();

  return (
    <section
      className="mb-10 home-reveal"
      style={{ animationDelay: "60ms" }}
      aria-labelledby="baleias-temporada-title"
    >
      <HomeSectionHeader eyebrow="Natureza · temporada" title="🐋 Onde tem baleia?" />

      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0c2f4a] via-[#134a5c] to-[#1a4a3a] p-5 text-white shadow-[0_12px_40px_rgba(12,47,74,0.22)] ring-1 ring-white/10">
        <span
          className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full bg-[#5eb8d4]/25 blur-3xl"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-[#7dd3b0]/15 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <p className="text-sm leading-relaxed text-white/85">{subtitulo}</p>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Consulte avistagens das últimas 24 horas no mapa oficial do{" "}
            <a
              href={BALEIAS_INSTITUTO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-white underline underline-offset-2"
            >
              {BALEIAS_FONTE_NOME}
            </a>
            . Registros de monitoramento científico e colaboradores locais.
          </p>

          <a
            href={BALEIAS_AVISTAGENS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-3.5 text-sm font-bold text-[#0c2f4a] transition-transform active:scale-[0.98]"
          >
            Ver avistagens ao vivo
            <span aria-hidden>↗</span>
          </a>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-white/50">
            Dados e conservação:{" "}
            <a
              href={BALEIAS_INSTITUTO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              baleiafranca.org.br
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
