"use client";

import { motion } from "framer-motion";
import LandingAmbient from "@/components/landing/LandingAmbient";
import LandingButton from "@/components/landing/LandingButton";
import LandingDownloadCta from "@/components/landing/LandingDownloadCta";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import {
  LANDING_DOWNLOAD_HREF,
  LANDING_HERO,
  landingContactMailto,
} from "@/lib/landingContent";

/**
 * CTA final — dual audience, visual cinematográfico.
 * @returns {import('react').ReactElement}
 */
export default function LandingFinalCta() {
  const { reveal, viewport } = useLandingRevealMotion();

  return (
    <section
      className="relative overflow-hidden px-5 py-28 sm:px-8 sm:py-36 lg:px-12 lg:py-44"
      aria-labelledby="landing-final-cta"
    >
      <motion.div
        className="relative mx-auto max-w-[76rem]"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={reveal}
      >
        <div className="landing-final-cta-panel relative overflow-hidden rounded-[2rem] px-8 py-16 text-center sm:rounded-[2.5rem] sm:px-16 sm:py-24">
          <LandingAmbient variant="dark" className="rounded-[inherit]" />
          <div
            className="landing-final-cta-glow landing-ambient-drift pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgba(127,212,174,0.2),transparent_50%)]"
            aria-hidden
          />
          <div
            className="landing-final-cta-glow landing-ambient-drift-slow pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_100%,rgba(127,212,174,0.12),transparent_45%)]"
            aria-hidden
          />

          <h2
            id="landing-final-cta"
            className="landing-display relative text-[clamp(2rem,5vw,3.25rem)] font-semibold leading-[1.08] text-white"
          >
            Sua próxima experiência em Imbituba começa aqui.
          </h2>
          <p className="relative mx-auto mt-5 max-w-md text-base text-white/65 sm:text-lg">
            Baixe o app nas lojas ou coloque seu negócio no mapa da cidade.
          </p>

          <div className="relative mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
            <LandingButton
              href={LANDING_DOWNLOAD_HREF}
              variant="primary"
              size="lg"
              className="!bg-white !text-[#1a4a3a] hover:!bg-[#f0f4f3]"
            >
              {LANDING_HERO.ctaDownload}
            </LandingButton>
            <LandingButton
              href={landingContactMailto("Cadastrar meu negócio")}
              variant="secondary"
              size="lg"
              external
            >
              {LANDING_HERO.ctaBusiness}
            </LandingButton>
          </div>

          <LandingDownloadCta variant="dark" id="baixar-app-final" />
        </div>
      </motion.div>
    </section>
  );
}
