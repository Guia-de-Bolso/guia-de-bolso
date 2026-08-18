"use client";

import { motion } from "framer-motion";
import LandingAmbient from "@/components/landing/LandingAmbient";
import LandingButton from "@/components/landing/LandingButton";
import LandingPhoneMockup from "@/components/landing/LandingPhoneMockup";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { floatDevice } from "@/components/landing/landingMotion";
import {
  useLandingRevealMotion,
  useLandingRichMotion,
} from "@/components/landing/useLandingRichMotion";
import {
  LANDING_DOWNLOAD,
  LANDING_DOWNLOAD_HREF,
  LANDING_HERO,
  LANDING_SECTION_IDS,
} from "@/lib/landingContent";

const APP_POINTS = [
  "Categorias com fotos reais da cidade",
  "Busca com IA e filtros por intenção",
  "Destaques das mais visitadas",
  "Tudo atualizado em tempo real",
];

/**
 * Showcase do app — mockup Explorar + bullets.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingPageData['categorias']} props.categorias
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} props.stats
 * @returns {import('react').ReactElement}
 */
export default function LandingAppShowcase({ categorias = [], stats }) {
  const richMotion = useLandingRichMotion();
  const { reveal, viewport } = useLandingRevealMotion();
  const PhoneWrap = richMotion ? motion.div : "div";

  return (
    <LandingSection id={LANDING_SECTION_IDS.app} tone="canvas" bridge={false} className="overflow-hidden">
      <LandingAmbient variant="section" />
      <div className="relative z-[1] grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
        <div>
          <LandingSectionHeader
            eyebrow="O app"
            title="Explore Imbituba por categoria."
            subtitle="A mesma tela Explorar do app — praias, gastronomia, natureza e muito mais."
          />

          <motion.ul
            className="mt-12 space-y-5"
            role="list"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={reveal}
          >
            {APP_POINTS.map((point) => (
              <li key={point} className="flex gap-3 text-[#5c6f68]">
                <span
                  className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1a4a3a]"
                  aria-hidden
                />
                <span className="text-base leading-relaxed">{point}</span>
              </li>
            ))}
          </motion.ul>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={reveal}
            className="mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center"
          >
            <LandingButton href={LANDING_DOWNLOAD_HREF} variant="primary" size="md">
              {LANDING_HERO.ctaDownload}
            </LandingButton>
            <p className="inline-flex rounded-full bg-[#e8f2ee]/90 px-4 py-2 text-sm font-medium text-[#1a4a3a] backdrop-blur-sm">
              {LANDING_DOWNLOAD.stores}
            </p>
          </motion.div>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="landing-device-glow pointer-events-none absolute -inset-12" aria-hidden />
          <PhoneWrap {...(richMotion ? floatDevice : {})}>
            <LandingPhoneMockup
              screen="explorar"
              size="showcase"
              categorias={categorias}
              stats={stats}
              animateEntrance={richMotion}
            />
          </PhoneWrap>
        </div>
      </div>
    </LandingSection>
  );
}
