"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import LandingPlaceCard from "@/components/landing/LandingPlaceCard";
import LandingSection, { LandingSectionHeader } from "@/components/landing/LandingSection";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { BADGE_CURADORIA_LABEL } from "@/lib/lugarBadges";
import { NEGOCIOS_CURADORIA_COPY } from "@/lib/negociosContent";

/**
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingAtrativoCard} props.rota
 * @returns {import('react').ReactElement}
 */
function NegociosAtrativoCard({ rota }) {
  return (
    <article className="landing-card-hover overflow-hidden rounded-[1.35rem] bg-white/80 ring-1 ring-[rgba(13,31,25,0.05)] backdrop-blur-sm">
      <div className="relative aspect-[16/10] bg-[#e8f2ee]">
        {rota.capa ? (
          <Image src={rota.capa} alt="" fill className="object-cover" sizes="360px" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#061612]/75 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#1a4a3a]">
          Atrativo curado
        </span>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg font-semibold tracking-tight text-white">
            {rota.titulo}
          </h3>
          {rota.categoria ? (
            <p className="mt-0.5 text-xs font-medium text-white/80">{rota.categoria}</p>
          ) : null}
        </div>
      </div>
      {rota.descricao ? (
        <p className="line-clamp-2 p-4 text-sm leading-relaxed text-[#5c6f68]">{rota.descricao}</p>
      ) : null}
    </article>
  );
}

/**
 * Curadoria e atrativos — números + amostra de cards.
 * @param {object} props
 * @param {{ count: number, amostra: import('@/lib/landingPageData').LandingLugarCard[] }} props.curadoria
 * @param {import('@/lib/landingPageData').LandingAtrativoCard[]} props.atrativosAmostra
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} [props.stats]
 * @returns {import('react').ReactElement|null}
 */
export default function NegociosCuradoriaSection({ curadoria, atrativosAmostra = [], stats }) {
  const { reveal, stagger, viewport } = useLandingRevealMotion();

  const lugaresCount = curadoria?.count ?? stats?.curadoriaCount ?? 0;
  const atrativosCount = stats?.atrativosCount ?? atrativosAmostra.length;
  const lugaresAmostra = curadoria?.amostra ?? [];

  if (lugaresCount === 0 && atrativosCount === 0) return null;

  return (
    <LandingSection id="curadoria" tone="mist" bridge={false}>
      <LandingSectionHeader
        eyebrow={NEGOCIOS_CURADORIA_COPY.eyebrow}
        title={NEGOCIOS_CURADORIA_COPY.title}
        subtitle={NEGOCIOS_CURADORIA_COPY.subtitle}
        center
      />

      <motion.dl
        className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        {[
          { label: "Locais curados", value: lugaresCount },
          { label: "Atrativos montados", value: atrativosCount },
          { label: "Lugares no guia", value: stats?.totalLugares ?? "—", hideMobile: false },
        ]
          .filter((item) => item.value !== 0 || item.label === "Lugares no guia")
          .slice(0, 3)
          .map((item) => (
            <motion.div
              key={item.label}
              variants={reveal}
              className={`landing-fluid-panel rounded-[1.25rem] p-6 text-center ${item.label === "Lugares no guia" ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <dd className="landing-display text-3xl font-semibold tabular-nums text-[#1a4a3a]">
                {item.value}
              </dd>
              <dt className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a9b94]">
                {item.label}
              </dt>
            </motion.div>
          ))}
      </motion.dl>

      <motion.ul
        className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-3"
        role="list"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={stagger}
      >
        {NEGOCIOS_CURADORIA_COPY.benefits.map((item) => (
          <motion.li
            key={item.title}
            variants={reveal}
            className="rounded-xl bg-[#e8f2ee]/60 px-4 py-3 text-sm text-[#4a5c56]"
          >
            <strong className="block text-[#1a4a3a]">{item.title}</strong>
            <span className="mt-1 block leading-relaxed">{item.body}</span>
          </motion.li>
        ))}
      </motion.ul>

      {lugaresAmostra.length > 0 ? (
        <div className="mt-16">
          <motion.h3
            className="text-center font-display text-xl font-semibold tracking-tight text-[#0a1612]"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={reveal}
          >
            Alguns locais da curadoria
          </motion.h3>
          <motion.p
            className="mx-auto mt-2 max-w-lg text-center text-sm text-[#5c6f68]"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={reveal}
          >
            {lugaresCount} locais validados pela equipe — praias, trilhas, cantos escondidos e
            favoritos de morador.
          </motion.p>
          <motion.ul
            className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            role="list"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={stagger}
          >
            {lugaresAmostra.map((lugar, i) => (
              <motion.li key={lugar.id} variants={reveal} className="relative">
                <LandingPlaceCard lugar={lugar} priority={i === 0} />
                <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-[#1a4a3a] shadow-sm">
                  {BADGE_CURADORIA_LABEL}
                </span>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      ) : null}

      {atrativosAmostra.length > 0 ? (
        <div className="mt-16">
          <motion.h3
            className="text-center font-display text-xl font-semibold tracking-tight text-[#0a1612]"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={reveal}
          >
            Atrativos curados pela equipe
          </motion.h3>
          <motion.p
            className="mx-auto mt-2 max-w-lg text-center text-sm text-[#5c6f68]"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={reveal}
          >
            {atrativosCount} atrativos prontos no app — passo a passo, dicas e ordem validada no
            celular.
          </motion.p>
          <motion.ul
            className="mt-8 grid gap-5 md:grid-cols-3"
            role="list"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={stagger}
          >
            {atrativosAmostra.map((rota) => (
              <motion.li key={rota.id} variants={reveal}>
                <NegociosAtrativoCard rota={rota} />
              </motion.li>
            ))}
          </motion.ul>
        </div>
      ) : null}
    </LandingSection>
  );
}
