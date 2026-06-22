"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import LandingButton from "@/components/landing/LandingButton";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { LANDING_SECTION_IDS, landingContactMailto } from "@/lib/landingContent";
import {
  NEGOCIOS_CONTACT_MAILTO,
  NEGOCIOS_PLANO_PARCEIRO,
  NEGOCIOS_VALUE_PROPS,
} from "@/lib/negociosContent";
import {
  LANDING_GENERIC_BUSINESS_TESTIMONIALS,
  formatParceirosNoGuia,
} from "@/lib/landingPartnerCopy";

/**
 * Benefícios para negócios — valor claro + plano + prova social.
 * @param {object} [props]
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} [props.stats]
 * @returns {import('react').ReactElement}
 */
export default function LandingBusinessBenefits({ stats }) {
  const { reveal, stagger, viewport } = useLandingRevealMotion();
  const featuredTestimonial = LANDING_GENERIC_BUSINESS_TESTIMONIALS[0];
  const plano = NEGOCIOS_PLANO_PARCEIRO;
  const parceirosLabel = formatParceirosNoGuia(stats?.parceirosCount);

  return (
    <LandingSection id={LANDING_SECTION_IDS.negocios} className="bg-[#0f2e24] text-white">
      <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div>
          <LandingSectionHeader
            eyebrow="Para estabelecimentos"
            title="Turistas decidem aqui."
            subtitle="Plano Parceiro do Guia — carrossel na home, badge verificado, perfil completo e prioridade na busca com IA."
            dark
          />

          <motion.ul
            className="mt-12 grid gap-4 sm:grid-cols-2"
            role="list"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={stagger}
          >
            {NEGOCIOS_VALUE_PROPS.slice(0, 6).map((item) => (
              <motion.li
                key={item.title}
                variants={reveal}
                className="landing-card-hover rounded-[1.25rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-md"
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                <h3 className="mt-3 font-display text-base font-semibold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/65">{item.body}</p>
              </motion.li>
            ))}
          </motion.ul>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <LandingButton href="/para-negocios" variant="secondary" className="!text-[#0d1f19]">
              Página para anunciantes
            </LandingButton>
            <LandingButton
              href={NEGOCIOS_CONTACT_MAILTO}
              variant="ghost"
              external
              className="!text-white hover:!bg-white/10"
            >
              Falar com a equipe
            </LandingButton>
          </div>
        </div>

        <motion.aside
          className="space-y-6"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={reveal}
        >
          <div className="rounded-[1.5rem] border border-[#f5e6b8]/30 bg-gradient-to-br from-[#1a4a3a] to-[#0f2e24] p-8 shadow-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#f5e6b8]">
              Plano {plano.nome}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-white/75">{plano.descricao}</p>
            <p className="mt-4 rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-[#f5e6b8]">
              {plano.notaLead}
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-white/80" role="list">
              {plano.features.slice(0, 6).map((feature) => (
                <li key={feature} className="flex gap-2">
                  <span className="shrink-0 text-[#7fd4ae]" aria-hidden>
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <LandingButton
              href={landingContactMailto(plano.mailtoSubject)}
              variant="secondary"
              className="mt-8 w-full !text-[#0d1f19]"
              external
            >
              {plano.cta}
            </LandingButton>
            <p className="mt-4 text-center text-xs text-white/50">
              <Link href="/para-negocios#planos" className="underline hover:text-white/70">
                Ver todos os benefícios
              </Link>
            </p>
          </div>

          <blockquote className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-6">
            <p className="font-display text-base font-medium leading-snug text-white/90">
              &ldquo;{featuredTestimonial.quote.slice(0, 120)}…&rdquo;
            </p>
            <footer className="mt-4 border-t border-white/10 pt-4">
              <cite className="not-italic">
                <span className="block text-sm font-semibold text-white">
                  {featuredTestimonial.name}
                </span>
                <span className="mt-0.5 block text-xs text-white/55">
                  {featuredTestimonial.role}
                </span>
              </cite>
            </footer>
          </blockquote>

          {parceirosLabel ? (
            <p className="text-center text-xs text-white/45">{parceirosLabel}</p>
          ) : null}
        </motion.aside>
      </div>
    </LandingSection>
  );
}
