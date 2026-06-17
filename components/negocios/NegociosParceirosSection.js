"use client";

import { motion } from "framer-motion";
import RemotePhoto from "@/components/shared/RemotePhoto";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { NEGOCIOS_PARCEIROS_COPY } from "@/lib/negociosContent";

/**
 * Lista completa de parceiros ativos.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} props.parceirosTodos
 * @param {number} [props.total]
 * @returns {import('react').ReactElement|null}
 */
export default function NegociosParceirosSection({ parceirosTodos = [], total = 0 }) {
  const { reveal, stagger, viewport } = useLandingRevealMotion();

  if (!parceirosTodos.length) return null;

  const count = total || parceirosTodos.length;
  const partnerNames = parceirosTodos.map((p) => p.nome).filter(Boolean);

  return (
    <LandingSection id="parceiros-ativos" tone="canvas" bridge={false}>
      <LandingSectionHeader
        eyebrow={NEGOCIOS_PARCEIROS_COPY.eyebrow}
        title={NEGOCIOS_PARCEIROS_COPY.title}
        subtitle={NEGOCIOS_PARCEIROS_COPY.subtitle}
        center
      />

      <motion.p
        className="mx-auto mt-8 max-w-xl text-center text-sm font-semibold text-[#1a4a3a]"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={reveal}
      >
        {count} {count === 1 ? "parceiro ativo" : "parceiros ativos"} no guia
      </motion.p>

      <div className="landing-logo-rail mt-8" aria-label="Todos os parceiros ativos">
        <div className="landing-logo-rail-track">
          {[...partnerNames, ...partnerNames].map((name, idx) => (
            <span key={`${name}-${idx}`} className="landing-logo-pill">
              {name}
            </span>
          ))}
        </div>
      </div>

      <motion.ul
        className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        role="list"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        {parceirosTodos.map((p) => (
          <motion.li
            key={p.id}
            variants={reveal}
            className="landing-card-hover flex items-center gap-4 rounded-[1.25rem] bg-white/85 p-4 ring-1 ring-[rgba(13,31,25,0.05)] backdrop-blur-sm"
          >
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-[#e8f2ee]">
              {p.capa ? (
                <RemotePhoto src={p.capa} alt="" fill className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-sm font-bold text-[#1a4a3a]">
                  ✓
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#0d1f19]">{p.nome}</p>
              <p className="truncate text-xs text-[#8a9b94]">
                {[p.categoria, p.subcategoria].filter(Boolean).join(" · ")}
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#f5e6b8]/95 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#7a6520]">
              Parceiro
            </span>
          </motion.li>
        ))}
      </motion.ul>
    </LandingSection>
  );
}
