"use client";

import { motion } from "framer-motion";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { LANDING_GENERIC_BUSINESS_TESTIMONIALS } from "@/lib/landingPartnerCopy";
import { NEGOCIOS_TESTIMONIALS } from "@/lib/negociosContent";

/**
 * Depoimentos de estabelecimentos — prova social B2B.
 * @param {object} [props]
 * @param {string} [props.sectionId]
 * @param {boolean} [props.genericPartners]
 * @returns {import('react').ReactElement}
 */
export default function LandingBusinessTestimonials({
  sectionId = "depoimentos-negocios",
  genericPartners = false,
}) {
  const { reveal, stagger, viewport } = useLandingRevealMotion();
  const testimonials = genericPartners
    ? LANDING_GENERIC_BUSINESS_TESTIMONIALS
    : NEGOCIOS_TESTIMONIALS;

  return (
    <LandingSection id={sectionId} tone="mist" bridge={false}>
      <LandingSectionHeader
        eyebrow="Quem anuncia"
        title="Estabelecimentos que já confiam."
        subtitle="Restaurantes, hospedagem e comércio usando o guia para chegar ao turista certo."
        center
      />

      <motion.ul
        className="mt-14 grid gap-6 md:grid-cols-3"
        role="list"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        {testimonials.map((t) => (
          <motion.li
            key={t.name}
            variants={reveal}
            className="landing-card-hover landing-fluid-panel flex flex-col rounded-[1.5rem] p-8"
          >
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1a4a3a]/55">
              {genericPartners ? "Anunciante no guia" : "Estabelecimento parceiro"}
            </p>
            <p className="flex-1 font-display text-lg font-medium leading-snug tracking-tight text-[#0d1f19]">
              &ldquo;{t.quote}&rdquo;
            </p>
            <footer className="mt-8 border-t border-[#1a4a3a]/8 pt-6">
              <cite className="not-italic">
                <span className="block text-sm font-semibold text-[#0d1f19]">{t.name}</span>
                <span className="mt-0.5 block text-xs text-[#8a9b94]">{t.role}</span>
              </cite>
            </footer>
          </motion.li>
        ))}
      </motion.ul>
    </LandingSection>
  );
}
