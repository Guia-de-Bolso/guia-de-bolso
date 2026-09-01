"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import LandingButton from "@/components/landing/LandingButton";
import LandingAmbient from "@/components/landing/LandingAmbient";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { useLandingNav } from "@/hooks/useLandingNav";
import { NEGOCIOS_CONTACT_MAILTO, NEGOCIOS_HERO } from "@/lib/negociosContent";

/**
 * Hero da página para anunciantes.
 * @param {object} [props]
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} [props.stats]
 * @returns {import('react').ReactElement}
 */
export default function NegociosHero({ stats }) {
  const { reveal, viewport } = useLandingRevealMotion();
  const { homePath } = useLandingNav();

  return (
    <section className="relative overflow-hidden bg-[#0a1612] pb-20 pt-28 text-white sm:pb-28 sm:pt-36">
      <LandingAmbient variant="dark" />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#061612]/90 via-[#0f2e24]/75 to-[#1a4a3a]/60"
        aria-hidden
      />
      <div className="relative z-[2] mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:px-12">
        <nav className="mb-10 text-sm text-white/55" aria-label="Breadcrumb">
          <Link href={homePath} className="hover:text-white/80">
            Início
          </Link>
          <span className="mx-2">/</span>
          <span className="text-white/80">Para anunciantes</span>
        </nav>

        <motion.div
          initial="hidden"
          animate="visible"
          viewport={viewport}
          variants={reveal}
          className="max-w-3xl"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#7fd4ae]">
            {NEGOCIOS_HERO.eyebrow}
          </p>
          <h1 className="landing-display mt-4 text-[clamp(2rem,6vw,3.75rem)] font-semibold leading-[1.05] tracking-tight text-white">
            {NEGOCIOS_HERO.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/85">
            {NEGOCIOS_HERO.subtitle}
          </p>

          {stats?.parceirosCount ? (
            <p className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white/85 backdrop-blur-sm">
              {stats.parceirosCount}+ parceiros · {stats.totalLugares}+ lugares no guia
            </p>
          ) : null}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <LandingButton href={NEGOCIOS_CONTACT_MAILTO} variant="secondary" external>
              {NEGOCIOS_HERO.ctaPrimary}
            </LandingButton>
            <LandingButton href="#planos" variant="ghost" className="!text-white hover:!bg-white/10">
              {NEGOCIOS_HERO.ctaSecondary}
            </LandingButton>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
