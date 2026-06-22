"use client";

import { motion } from "framer-motion";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { LANDING_SECTION_IDS } from "@/lib/landingContent";
import { formatParceirosCadastrados } from "@/lib/landingPartnerCopy";

/**
 * Parceiros na landing — apenas contagem genérica, sem identificar estabelecimentos.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} [props.stats]
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @returns {import('react').ReactElement|null}
 */
export default function LandingPartners({
  stats,
  title = "Parceiros que definem o padrão.",
  subtitle = "Estabelecimentos verificados no guia oficial da cidade.",
}) {
  const { reveal, viewport } = useLandingRevealMotion();
  const parceirosCount = stats?.parceirosCount ?? 0;
  const countLabel = formatParceirosCadastrados(parceirosCount);

  if (!countLabel) return null;

  return (
    <LandingSection id={LANDING_SECTION_IDS.parceiros} tone="canvas" bridge={false}>
      <LandingSectionHeader
        eyebrow="Parceiros"
        title={title}
        subtitle={subtitle}
        center
      />

      <motion.div
        className="landing-fluid-panel mx-auto mt-10 max-w-3xl rounded-2xl px-5 py-4 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={reveal}
      >
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-[#5d6d67]">
          <span className="font-semibold text-[#1a4a3a]">{countLabel}</span>
          <span className="hidden h-1 w-1 rounded-full bg-[#9fb7ad] sm:inline-block" />
          <span>Presença ativa nas categorias mais buscadas</span>
          <span className="hidden h-1 w-1 rounded-full bg-[#9fb7ad] sm:inline-block" />
          <span>Atualização recorrente de perfil e conteúdo</span>
        </div>
      </motion.div>

      <motion.div
        className="mx-auto mt-12 max-w-2xl text-center sm:mt-14"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={reveal}
      >
        <p className="landing-display text-4xl font-semibold tabular-nums tracking-tight text-[#1a4a3a] sm:text-5xl">
          {parceirosCount}
        </p>
        <p className="mt-3 text-sm font-medium text-[#5d6d67] sm:text-base">
          {countLabel} no ecossistema oficial do guia
        </p>
      </motion.div>
    </LandingSection>
  );
}
