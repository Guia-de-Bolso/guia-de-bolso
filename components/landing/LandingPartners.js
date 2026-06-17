"use client";

import { motion } from "framer-motion";
import RemotePhoto from "@/components/shared/RemotePhoto";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { LANDING_SECTION_IDS } from "@/lib/landingContent";

/**
 * Parceiros reais — carrossel centralizado com todos os cadastrados.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} props.parceiros
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} [props.stats]
 * @param {string} [props.title]
 * @param {string} [props.subtitle]
 * @returns {import('react').ReactElement|null}
 */
export default function LandingPartners({
  parceiros,
  stats,
  title = "Parceiros que definem o padrão.",
  subtitle = "Estabelecimentos verificados no guia oficial da cidade.",
}) {
  const { reveal, stagger, viewport } = useLandingRevealMotion();

  if (!parceiros?.length) return null;
  const partnerNames = parceiros.map((p) => p.nome).filter(Boolean);

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
          <span className="font-semibold text-[#1a4a3a]">
            {stats?.parceirosCount || parceiros.length}+ parceiros verificados
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-[#9fb7ad] sm:inline-block" />
          <span>Presença ativa nas categorias mais buscadas</span>
          <span className="hidden h-1 w-1 rounded-full bg-[#9fb7ad] sm:inline-block" />
          <span>Atualização recorrente de perfil e conteúdo</span>
        </div>
      </motion.div>

      <div
        className="landing-logo-rail landing-logo-rail--centered mx-auto mt-10 max-w-4xl px-2"
        aria-label="Estabelecimentos parceiros em destaque"
      >
        <div className="landing-logo-rail-track">
          {partnerNames.map((name) => (
            <span key={name} className="landing-logo-pill">
              {name}
            </span>
          ))}
        </div>
      </div>

      <motion.div
        className="landing-centered-rail mt-12 sm:mt-14"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        <ul
          className="landing-centered-rail__track landing-centered-rail__track--partners"
          role="list"
          aria-label="Cards de parceiros verificados"
        >
          {parceiros.map((p) => (
            <motion.li
              key={p.id}
              variants={reveal}
              className="landing-centered-rail__item"
            >
              <article className="landing-card-hover flex h-full items-center gap-4 rounded-[1.35rem] bg-white/90 p-4 ring-1 ring-[rgba(13,31,25,0.05)]">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#e8f2ee]">
                  {p.capa ? (
                    <RemotePhoto src={p.capa} alt="" fill className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-lg text-[#1a4a3a]">
                      ✓
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium text-[#0d1f19]">{p.nome}</p>
                  <p className="text-xs text-[#8a9b94]">{p.categoria}</p>
                </div>
              </article>
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </LandingSection>
  );
}
