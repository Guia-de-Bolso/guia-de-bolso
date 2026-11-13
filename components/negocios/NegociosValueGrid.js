"use client";

import { motion } from "framer-motion";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { NEGOCIOS_VALUE_PROPS } from "@/lib/negociosContent";

/**
 * Grid de benefícios para anunciantes.
 * @returns {import('react').ReactElement}
 */
export default function NegociosValueGrid() {
  const { reveal, stagger, viewport } = useLandingRevealMotion();

  return (
    <LandingSection tone="white" bridge={false} className="!pt-12 sm:!pt-16">
      <LandingSectionHeader
        eyebrow="Por que anunciar"
        title="Visibilidade onde o turista decide."
        subtitle="Cada touchpoint do app foi pensado para converter curiosidade em visita."
        center
      />

      <motion.ul
        className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        {NEGOCIOS_VALUE_PROPS.map((item) => (
          <motion.li
            key={item.title}
            variants={reveal}
            className="landing-card-hover landing-fluid-panel rounded-[1.35rem] p-7"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f2ee] text-lg">
              {item.icon}
            </span>
            <h3 className="mt-4 font-display text-lg font-semibold text-[#0a1612]">{item.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#5c6f68]">{item.body}</p>
          </motion.li>
        ))}
      </motion.ul>
    </LandingSection>
  );
}
