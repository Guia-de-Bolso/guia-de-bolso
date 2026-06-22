"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import LandingPhoneMockup from "@/components/landing/LandingPhoneMockup";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { floatDevice } from "@/components/landing/landingMotion";
import {
  useLandingRevealMotion,
  useLandingRichMotion,
} from "@/components/landing/useLandingRichMotion";
import { LANDING_SECTION_IDS } from "@/lib/landingContent";
import { formatParceirosCadastrados } from "@/lib/landingPartnerCopy";
import { NEGOCIOS_APP_TOUCHPOINTS } from "@/lib/negociosContent";

/**
 * Showcase B2B — onde o estabelecimento aparece no app (mockups reais).
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} [props.parceiros]
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} [props.showcase]
 * @param {import('@/lib/landingPageData').LandingPageData['categorias']} [props.categorias]
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} [props.stats]
 * @param {string} [props.sectionId]
 * @param {boolean} [props.compact]
 * @param {boolean} [props.genericPartners]
 * @returns {import('react').ReactElement}
 */
export default function LandingBusinessShowcase({
  parceiros = [],
  showcase = [],
  categorias = [],
  stats,
  sectionId = LANDING_SECTION_IDS.negociosShowcase,
  compact = false,
  genericPartners = false,
}) {
  const richMotion = useLandingRichMotion();
  const { reveal, viewport } = useLandingRevealMotion();
  const [activeId, setActiveId] = useState(NEGOCIOS_APP_TOUCHPOINTS[0].id);
  const PhoneWrap = richMotion ? motion.div : "div";

  const active =
    NEGOCIOS_APP_TOUCHPOINTS.find((t) => t.id === activeId) ?? NEGOCIOS_APP_TOUCHPOINTS[0];

  const emAlta = showcase.length > 0 ? showcase : genericPartners ? [] : parceiros;
  const parceirosLabel = formatParceirosCadastrados(stats?.parceirosCount);

  return (
    <LandingSection
      id={sectionId}
      tone={compact ? "white" : "canvas"}
      bridge={!compact}
      className={compact ? "" : "overflow-hidden"}
    >
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <LandingSectionHeader
            eyebrow="No app de verdade"
            title="Veja onde seu negócio aparece."
            subtitle={
              genericPartners
                ? "Prévia do Guia de Bolso — carrossel, perfil completo e busca com IA."
                : "Exemplos reais do Guia de Bolso — carrossel, perfil completo e busca com IA."
            }
          />

          <div
            className="mt-8 flex flex-wrap gap-2"
            role="tablist"
            aria-label="Onde aparece no app"
          >
            {NEGOCIOS_APP_TOUCHPOINTS.map((item) => {
              const selected = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActiveId(item.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
                    selected
                      ? "bg-[#1a4a3a] text-white shadow-md"
                      : "bg-white/80 text-[#4a5c56] ring-1 ring-[rgba(13,31,25,0.08)] hover:bg-white"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <motion.div
            key={active.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mt-8"
            role="tabpanel"
          >
            <h3 className="font-display text-xl font-semibold tracking-tight text-[#0a1612]">
              {active.title}
            </h3>
            <p className="mt-3 text-base leading-relaxed text-[#5c6f68]">{active.body}</p>
          </motion.div>

          {!compact && parceirosLabel ? (
            <motion.p
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              variants={reveal}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#e8f2ee]/90 px-4 py-2 text-sm font-medium text-[#1a4a3a]"
            >
              <span aria-hidden>📍</span>
              {parceirosLabel}
            </motion.p>
          ) : null}
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="landing-device-glow pointer-events-none absolute -inset-12" aria-hidden />
          <PhoneWrap {...(richMotion ? floatDevice : {})}>
            <LandingPhoneMockup
              screen={active.screen}
              size="showcase"
              parceiros={genericPartners ? [] : parceiros}
              emAlta={emAlta}
              places={emAlta}
              categorias={categorias}
              stats={stats}
              genericPartners={genericPartners}
              animateEntrance={richMotion}
            />
          </PhoneWrap>
        </div>
      </div>
    </LandingSection>
  );
}
