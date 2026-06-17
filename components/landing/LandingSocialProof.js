"use client";

import { motion } from "framer-motion";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { useLandingRevealMotion } from "@/components/landing/useLandingRichMotion";
import { PREFETURA_SUPPORT_LINE } from "@/lib/institutionalSupport";
import { LANDING_TESTIMONIALS } from "@/lib/landingContent";

/**
 * Prova social — logos, métricas e depoimento em destaque.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingPageData['stats']} props.stats
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} props.parceiros
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} props.showcase
 * @param {boolean} props.hasLiveData
 * @returns {import('react').ReactElement|null}
 */
export default function LandingSocialProof({ stats, parceiros = [], showcase = [], hasLiveData }) {
  const { reveal, stagger, viewport } = useLandingRevealMotion();
  const featured = LANDING_TESTIMONIALS[0];
  const partnerNames = parceiros.map((p) => p.nome).filter(Boolean);
  const faces = showcase.filter((p) => p.capa).slice(0, 5);

  if (!hasLiveData && partnerNames.length === 0) return null;

  return (
    <section
      className="landing-social-proof-band landing-section-flow relative z-[2] py-16 sm:py-20"
      aria-label="Prova social"
    >
      <div className="landing-social-proof-ambient pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="landing-ambient-drift absolute -left-[20%] h-[42%] w-[50%] rounded-full bg-[#7fd4ae]/10 blur-[100px]" />
        <div className="landing-ambient-drift-slow absolute -right-[10%] h-[36%] w-[45%] rounded-full bg-[#1a4a3a]/6 blur-[90px]" />
      </div>

      <div className="relative mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:px-12">
        <motion.div
          className="flex flex-col items-center text-center"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={reveal}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#1a4a3a]/60">
            Confiança local
          </p>
          <p className="landing-display mt-3 max-w-lg text-xl font-semibold tracking-tight text-[#0a1612] sm:text-2xl">
            Curadoria real de quem conhece Imbituba.
          </p>
          <p className="mt-3 text-sm font-medium text-[#1a4a3a]/70">
            {PREFETURA_SUPPORT_LINE}
          </p>
        </motion.div>

        <motion.dl
          className="mt-10 grid grid-cols-3 gap-4 sm:gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={stagger}
        >
          {[
            { label: "Lugares verificados", value: stats?.totalLugares || "—" },
            { label: "Parceiros oficiais", value: stats?.parceirosCount || "—" },
            { label: "Avaliações aprovadas", value: stats?.avaliacoesCount || "—" },
          ].map((item) => (
            <motion.div key={item.label} variants={reveal} className="text-center">
              <dd className="landing-display text-2xl font-semibold tabular-nums text-[#1a4a3a] sm:text-3xl">
                {item.value}
              </dd>
              <dt className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-[#8a9b94] sm:text-xs">
                {item.label}
              </dt>
            </motion.div>
          ))}
        </motion.dl>

        {faces.length > 0 && (
          <motion.div
            className="mt-10 flex justify-center"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={reveal}
          >
            <div className="flex -space-x-2" aria-hidden>
              {faces.map((p) => (
                <span
                  key={p.id}
                  className="relative inline-block h-10 w-10 overflow-hidden rounded-full ring-2 ring-white shadow-sm sm:h-11 sm:w-11"
                >
                  <RemotePhoto src={p.capa} alt="" fill className="object-cover" />
                </span>
              ))}
            </div>
            <span className="sr-only">Estabelecimentos em destaque no guia</span>
          </motion.div>
        )}

        {partnerNames.length > 0 && (
          <div className="landing-logo-rail mt-10" aria-label="Estabelecimentos parceiros">
            <div className="landing-logo-rail-track">
              {[...partnerNames, ...partnerNames].map((name, idx) => (
                <span key={`${name}-${idx}`} className="landing-logo-pill">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <motion.div
          className="landing-fluid-panel mx-auto mt-12 max-w-3xl rounded-[1.5rem] p-8 text-center sm:p-10"
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          variants={reveal}
        >
          <p className="font-display text-lg font-medium leading-snug tracking-tight text-[#0a1612] sm:text-xl">
            &ldquo;{featured.quote}&rdquo;
          </p>
          <footer className="mt-6 flex flex-col items-center gap-4 border-t border-[#1a4a3a]/8 pt-5 sm:flex-row sm:justify-between">
            <cite className="not-italic">
              <span className="block text-sm font-semibold text-[#0d1f19]">{featured.name}</span>
              <span className="mt-0.5 block text-xs text-[#8a9b94]">{featured.role}</span>
            </cite>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1a4a3a]/55">
              ★★★★★ verificado
            </span>
          </footer>
        </motion.div>

        {parceiros.length > 0 && (
          <motion.div
            className="landing-centered-rail mt-10"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={stagger}
          >
            <ul
              className="landing-centered-rail__track landing-centered-rail__track--partners"
              role="list"
              aria-label="Parceiros em destaque"
            >
              {parceiros.map((p) => (
                <motion.li
                  key={p.id}
                  variants={reveal}
                  className="landing-centered-rail__item"
                >
                  <article className="flex h-full items-center gap-3 rounded-2xl bg-white/80 p-3 ring-1 ring-[rgba(13,31,25,0.05)]">
                    <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#e8f2ee]">
                      {p.capa ? (
                        <RemotePhoto src={p.capa} alt="" fill className="object-cover" />
                      ) : (
                        <span className="flex h-full items-center justify-center text-sm text-[#1a4a3a]">
                          ✓
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#0d1f19]">{p.nome}</p>
                      <p className="truncate text-[10px] text-[#8a9b94]">{p.categoria}</p>
                    </div>
                  </article>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </div>
    </section>
  );
}
