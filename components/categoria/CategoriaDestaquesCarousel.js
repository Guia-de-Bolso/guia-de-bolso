"use client";

import EmAltaCard from "@/components/home/EmAltaCard";
import HomeSectionHeader from "@/components/home/HomeSectionHeader";
import { HOME_CAROUSEL_TRACK_CLASS } from "@/components/home/homeTokens";

/**
 * Carrossel horizontal com os primeiros lugares da categoria.
 */
export default function CategoriaDestaquesCarousel({ lugares, returnPath = "" }) {
  if (lugares.length === 0) return null;

  return (
    <section
      className="home-reveal mb-8 overflow-visible"
      style={{ animationDelay: "80ms" }}
      aria-labelledby="categoria-destaques-title"
    >
      <HomeSectionHeader
        eyebrow="Seleção da categoria"
        title="Destaques para começar"
        titleId="categoria-destaques-title"
      />
      <div className={`${HOME_CAROUSEL_TRACK_CLASS} -mx-4 px-4`}>
        {lugares.map((lugar, index) => (
          <EmAltaCard
            key={lugar.id}
            lugar={lugar}
            priority={index === 0}
            returnPath={returnPath}
          />
        ))}
      </div>
    </section>
  );
}
