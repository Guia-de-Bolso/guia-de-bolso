"use client";

import { motion } from "framer-motion";
import LandingButton from "@/components/landing/LandingButton";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { landingContactMailto } from "@/lib/landingContent";
import { NEGOCIOS_PLANOS_TIERS } from "@/lib/negociosContent";

/**
 * Comparativo Presença / Lançamento / Parceiro na landing B2B.
 * @returns {import('react').ReactElement}
 */
export default function NegociosPlans() {
  const { reveal, stagger, viewport } = useLandingRevealMotion();

  return (
    <LandingSection id="planos" tone="white" bridge={false}>
      <LandingSectionHeader
        eyebrow="Planos no guia"
        title="Presença, Lançamento ou Parceiro."
        subtitle="O app é gratuito para turistas. Seu negócio escolhe o nível de visibilidade — utilitários ficam no básico; experiências ganham perfil completo na fase de lançamento."
        center
      />

      <motion.div
        className="mt-14 grid gap-6 lg:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        {NEGOCIOS_PLANOS_TIERS.map((plano) => (
          <motion.article
            key={plano.id}
            variants={reveal}
            className={`landing-card-hover flex flex-col rounded-[1.35rem] p-7 sm:p-8 ${
              plano.destacado
                ? "bg-gradient-to-br from-[#0f2e24] to-[#1a4a3a] text-white ring-2 ring-[#f5e6b8]/40"
                : "bg-[#f7faf9] text-[#0a1612] ring-1 ring-[#e3e9e6]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3
                className={`font-display text-xl font-semibold ${plano.destacado ? "text-white" : "text-[#0a1612]"}`}
              >
                {plano.nome}
              </h3>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                  plano.destacado
                    ? "bg-[#f5e6b8]/95 text-[#7a6520]"
                    : "bg-white text-[#1a4a3a] ring-1 ring-[#d0ddd8]"
                }`}
              >
                {plano.badge}
              </span>
            </div>

            <p
              className={`mt-4 text-sm leading-relaxed ${plano.destacado ? "text-white/75" : "text-[#5c6f68]"}`}
            >
              {plano.descricao}
            </p>

            <ul className="mt-6 flex flex-1 flex-col gap-2.5" role="list">
              {plano.features.map((feature) => (
                <li
                  key={feature}
                  className={`flex gap-2 text-sm ${plano.destacado ? "text-white/90" : "text-[#3d4f4a]"}`}
                >
                  <span
                    className={`shrink-0 font-bold ${plano.destacado ? "text-[#7fd4ae]" : "text-[#1a4a3a]"}`}
                    aria-hidden
                  >
                    ✓
                  </span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <p
              className={`mt-6 text-xs font-medium ${plano.destacado ? "text-[#f5e6b8]" : "text-[#5c6f68]"}`}
            >
              {plano.nota}
            </p>

            {plano.cta && plano.mailtoSubject ? (
              <LandingButton
                href={landingContactMailto(plano.mailtoSubject)}
                variant={plano.destacado ? "secondary" : "primary"}
                className={`mt-6 w-full ${plano.destacado ? "!text-[#0d1f19]" : ""}`}
                external
              >
                {plano.cta}
              </LandingButton>
            ) : (
              <p
                className={`mt-6 text-center text-xs ${plano.destacado ? "text-white/60" : "text-[#9aa8a3]"}`}
              >
                Cadastro via equipe do guia
              </p>
            )}
          </motion.article>
        ))}
      </motion.div>

      <p className="mt-8 text-center text-sm text-[#5c6f68]">
        Dúvidas sobre qual plano combina com seu negócio?{" "}
        <a
          href={landingContactMailto("Qual plano do Guia de Bolso combina com meu negócio?")}
          className="font-semibold text-[#1a4a3a] underline-offset-2 hover:underline"
        >
          Fale com a equipe
        </a>
        .
      </p>
    </LandingSection>
  );
}
