"use client";

import { motion } from "framer-motion";
import RemotePhoto from "@/components/shared/RemotePhoto";
import LandingAmbient from "@/components/landing/LandingAmbient";
import LandingPlaceCard from "@/components/landing/LandingPlaceCard";
import { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { LANDING_SECTION_IDS } from "@/lib/landingContent";

/** @param {object} p */
function LandingDiscoverSection({ id, className, children }) {
  return (
    <section
      id={id}
      className={`landing-section-bridge relative py-28 sm:py-36 lg:py-44 ${className}`}
    >
      <LandingAmbient variant="section" />
      <div className="relative z-[1] mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:px-12">
        {children}
      </div>
    </section>
  );
}

/**
 * Experiências locais — dados reais.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} props.discoverShowcase
 * @param {import('@/lib/landingPageData').LandingPageData['categorias']} props.categorias
 * @param {boolean} props.hasLiveData
 * @returns {import('react').ReactElement}
 */
export default function LandingDiscover({ discoverShowcase = [], categorias, hasLiveData }) {
  const { stagger, scaleReveal: scaleRevealVariant, viewport } = useLandingRevealMotion();

  return (
    <LandingDiscoverSection
      id={LANDING_SECTION_IDS.categorias}
      className="landing-section-flow--canvas relative z-[2] -mt-2 bg-transparent pt-10 sm:pt-14"
    >
      <LandingSectionHeader
        eyebrow="Experiências"
        title="Lugares que valem o desvio."
        subtitle={
          hasLiveData
            ? "Seleção curada pela nossa equipe — praias, trilhas e favoritos de morador."
            : "Em breve, os endereços essenciais da cidade."
        }
      />

      {discoverShowcase.length > 0 && (
        <motion.div
          className="mt-16 flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={stagger}
          role="list"
        >
          {discoverShowcase.map((lugar, i) => (
            <div
              key={lugar.id}
              className="w-[min(88vw,320px)] shrink-0 snap-center md:w-auto"
              role="listitem"
            >
              <LandingPlaceCard lugar={lugar} priority={i < 2} className="h-full" />
            </div>
          ))}
        </motion.div>
      )}

      {categorias.length > 0 && (
        <div className="mt-20">
          <p className="text-center text-sm font-medium text-[#8a9b94]">Por categoria</p>
          <motion.ul
            className="mt-8 grid grid-cols-2 justify-items-stretch gap-3 sm:grid-cols-4 sm:gap-4"
            role="list"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={stagger}
          >
            {categorias.slice(0, 8).map((cat) => (
              <motion.li
                key={cat.nome}
                variants={scaleRevealVariant}
                className="landing-category-card landing-card-hover group relative overflow-hidden rounded-2xl bg-white/85 p-4 ring-1 ring-[rgba(13,31,25,0.04)] backdrop-blur-sm"
              >
                {cat.capa && (
                  <>
                    <div className="landing-category-card__media pointer-events-none absolute inset-0">
                      <RemotePhoto src={cat.capa} alt="" fill className="object-cover" />
                    </div>
                    <div className="landing-category-card__scrim pointer-events-none absolute inset-0" />
                  </>
                )}
                <span className="relative text-xl" aria-hidden>
                  {cat.icone}
                </span>
                <p className="relative mt-2 font-display text-sm font-semibold text-[#0d1f19]">
                  {cat.nome}
                </p>
                {cat.count > 0 && (
                  <p className="relative mt-0.5 text-xs text-[#8a9b94]">{cat.count} lugares</p>
                )}
              </motion.li>
            ))}
          </motion.ul>
        </div>
      )}
    </LandingDiscoverSection>
  );
}
