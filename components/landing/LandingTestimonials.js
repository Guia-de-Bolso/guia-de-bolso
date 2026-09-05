"use client";

import { motion } from "framer-motion";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { LANDING_SECTION_IDS, LANDING_TESTIMONIALS } from "@/lib/landingContent";
import { formatAvaliacoesAprovadas } from "@/lib/landingPartnerCopy";

/**
 * Depoimentos — editorial, carrossel centralizado.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} [props.stats]
 * @returns {import('react').ReactElement}
 */
export default function LandingTestimonials({ stats }) {
  const { reveal, stagger, viewport } = useLandingRevealMotion();
  const avaliacoesLabel = formatAvaliacoesAprovadas(stats?.avaliacoesCount);

  return (
    <LandingSection id={LANDING_SECTION_IDS.depoimentos} tone="white" bridge={false}>
      <LandingSectionHeader
        eyebrow="Confiança"
        title="Vozes de quem vive Imbituba."
        subtitle="Turistas e negócios que já sentiram a diferença."
        center
      />
      <motion.div
        className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[#5d6d67]"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={reveal}
      >
        {avaliacoesLabel ? (
          <span className="rounded-full bg-[#e8f2ee] px-3 py-1 font-semibold text-[#1a4a3a]">
            {avaliacoesLabel}
          </span>
        ) : null}
        <span className="rounded-full bg-[#f3f6f5] px-3 py-1 font-medium">Depoimentos verificados</span>
        <span className="rounded-full bg-[#f3f6f5] px-3 py-1 font-medium">Base local em crescimento</span>
      </motion.div>

      <motion.div
        className="landing-centered-rail mt-16"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        <ul
          className="landing-centered-rail__track landing-centered-rail__track--testimonials"
          role="list"
        >
          {LANDING_TESTIMONIALS.map((t) => (
            <motion.li
              key={t.name}
              variants={reveal}
              className="landing-centered-rail__item"
            >
              <article className="landing-card-hover landing-fluid-panel flex h-full flex-col rounded-[1.5rem] p-8">
                <p className="flex-1 font-display text-lg font-medium leading-snug tracking-tight text-[#0d1f19]">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-8 border-t border-[#1a4a3a]/8 pt-6">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a4a3a]/55">
                    ★★★★★ avaliação verificada
                  </p>
                  <cite className="not-italic">
                    <span className="block text-sm font-semibold text-[#0d1f19]">{t.name}</span>
                    <span className="mt-0.5 block text-xs text-[#8a9b94]">{t.role}</span>
                  </cite>
                </footer>
              </article>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </LandingSection>
  );
}
