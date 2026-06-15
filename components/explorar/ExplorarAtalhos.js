"use client";

import Link from "next/link";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";

/**
 * @param {object} props
 * @returns {import("react").JSX.Element}
 */
function AtalhoCard({ href, titulo, descricao, emoji, destaque = false }) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-3 overflow-hidden rounded-[24px] p-4 transition-transform duration-300 active:scale-[0.98] ${
        destaque
          ? "bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54] text-white shadow-[0_8px_28px_rgba(26,74,58,0.25)]"
          : "bg-white text-[#1a2e28] ring-1 ring-[#e8eeee]"
      }`}
    >
      {destaque && (
        <span
          className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl"
          aria-hidden
        />
      )}
      <span
        className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl ${
          destaque ? "bg-white/15" : "bg-[#f0f4f3]"
        }`}
        aria-hidden
      >
        {emoji}
      </span>
      <span className="relative min-w-0 flex-1">
        <span className="block text-sm font-bold">{titulo}</span>
        <span
          className={`mt-0.5 block text-xs leading-snug ${
            destaque ? "text-white/85" : "text-[#5a6b66]"
          }`}
        >
          {descricao}
        </span>
      </span>
      <span className="relative shrink-0 text-lg opacity-70" aria-hidden>
        →
      </span>
    </Link>
  );
}

/**
 * Atalhos secundários: rotas e busca IA.
 */
export default function ExplorarAtalhos() {
  return (
    <section className="home-reveal mb-4 space-y-3" style={{ animationDelay: "160ms" }}>
      <HomeSectionHeader eyebrow="Descoberta" title="Mais formas de descobrir" />
      <AtalhoCard
        href="/atrativos"
        emoji="🗺️"
        titulo="Atrativos guiados"
        descricao="Trilhas e percursos com etapas e dicas"
        destaque
      />
      <AtalhoCard
        href="/?busca=1"
        emoji="✨"
        titulo="Busca inteligente"
        descricao='Ex: "restaurante com vista" ou "praia tranquila"'
      />
    </section>
  );
}
