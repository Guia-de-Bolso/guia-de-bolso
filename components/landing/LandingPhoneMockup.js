"use client";

import { motion } from "framer-motion";
import LandingPhoneDeviceShell from "@/components/landing/LandingPhoneDeviceShell";
import LandingPhoneBuscaScreen from "@/components/landing/LandingPhoneBuscaScreen";
import LandingPhoneDetalheScreen from "@/components/landing/LandingPhoneDetalheScreen";
import LandingPhoneExplorarScreen from "@/components/landing/LandingPhoneExplorarScreen";
import LandingPhoneHomeScreen from "@/components/landing/LandingPhoneHomeScreen";
import { easePremium } from "@/components/landing/landingMotion";
import {
  getLandingPhoneMetrics,
  PHONE_OUTER_WIDTH,
} from "@/lib/landingPhoneSpecs";
import { LANDING_MOCK_PARTNER_PLACE } from "@/lib/landingPartnerCopy";

/**
 * Mockup de smartphone — chassi matte, proporção 19,5:9, punch-hole.
 * @param {object} props
 * @param {'home'|'explorar'|'detalhe'|'busca'} [props.screen]
 * @param {'hero'|'showcase'} [props.size]
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} [props.emAlta]
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} [props.parceiros]
 * @param {import('@/lib/landingPageData').LandingPageData['categorias']} [props.categorias]
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} [props.stats]
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} [props.places]
 * @param {string} [props.className]
 * @param {boolean} [props.animateEntrance]
 * @param {boolean} [props.genericPartners]
 * @returns {import('react').ReactElement}
 */
export default function LandingPhoneMockup({
  screen = "home",
  size = "hero",
  emAlta = [],
  parceiros = [],
  categorias = [],
  stats,
  places = [],
  className = "",
  animateEntrance = true,
  genericPartners = false,
}) {
  const outerWidth = PHONE_OUTER_WIDTH[size] ?? PHONE_OUTER_WIDTH.hero;
  const m = getLandingPhoneMetrics(outerWidth);
  const alta = emAlta.length > 0 ? emAlta : places;

  const ariaLabels = {
    explorar: "Prévia da tela Explorar do Guia de Bolso em um smartphone",
    detalhe: "Prévia da página de detalhe de um parceiro no Guia de Bolso",
    busca: "Prévia da busca com IA destacando um parceiro no Guia de Bolso",
    home: "Prévia da home do Guia de Bolso em um smartphone",
  };
  const ariaLabel = ariaLabels[screen] ?? ariaLabels.home;

  const featuredParceiro = genericPartners
    ? LANDING_MOCK_PARTNER_PLACE
    : parceiros.find((p) => p.capa) ?? alta.find((p) => p.ehParceiro && p.capa) ?? alta[0];

  const screenContent = (() => {
    if (screen === "explorar") {
      return <LandingPhoneExplorarScreen categorias={categorias} stats={stats} />;
    }
    if (screen === "detalhe") {
      return <LandingPhoneDetalheScreen lugar={featuredParceiro} genericPartners={genericPartners} />;
    }
    if (screen === "busca") {
      return <LandingPhoneBuscaScreen lugar={featuredParceiro} genericPartners={genericPartners} />;
    }
    return (
      <LandingPhoneHomeScreen
        emAlta={alta}
        parceiros={genericPartners ? [] : parceiros}
        categorias={categorias}
        genericPartners={genericPartners}
        parceirosCount={stats?.parceirosCount}
      />
    );
  })();

  const shell = (
    <>
      {animateEntrance ? (
        <div
          className="pointer-events-none absolute -bottom-4 left-1/2 -z-10 h-6 w-[55%] -translate-x-1/2 rounded-[100%] bg-black/20 blur-md"
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute -bottom-3 left-1/2 -z-10 h-4 w-[50%] -translate-x-1/2 rounded-[100%] bg-black/12"
          aria-hidden
        />
      )}
      <LandingPhoneDeviceShell metrics={m}>{screenContent}</LandingPhoneDeviceShell>
    </>
  );

  const boxStyle = {
    width: m.outerWidth,
    maxWidth: `min(${m.outerWidth}px, calc(100vw - 2rem))`,
  };

  if (!animateEntrance) {
    return (
      <div
        className={`relative mx-auto shrink-0 ${className}`}
        style={boxStyle}
        role="img"
        aria-label={ariaLabel}
      >
        {shell}
      </div>
    );
  }

  return (
    <motion.div
      className={`relative mx-auto shrink-0 ${className}`}
      style={boxStyle}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.75, ease: easePremium, delay: 0.08 }}
      role="img"
      aria-label={ariaLabel}
    >
      {shell}
    </motion.div>
  );
}
