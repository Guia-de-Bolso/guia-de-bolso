"use client";

import { motion } from "framer-motion";
import RemotePhoto from "@/components/shared/RemotePhoto";
import { fadeUpHero, floatCard } from "@/components/landing/landingMotion";

/**
 * Cards fotográficos flutuantes — profundidade e lifestyle no hero.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard[]} props.places
 * @returns {import('react').ReactElement|null}
 */
export default function LandingHeroFloatingCards({ places = [] }) {
  const cards = places.filter((p) => p.capa).slice(1, 3);
  if (cards.length === 0) return null;

  const layouts = [
    {
      className:
        "absolute -left-6 top-[18%] z-0 hidden w-[7.5rem] overflow-hidden rounded-2xl shadow-[0_20px_40px_rgba(10,22,18,0.12)] ring-1 ring-white/80 lg:block xl:-left-10 xl:w-[8.5rem]",
      rotate: -4,
    },
    {
      className:
        "absolute -right-4 bottom-[22%] z-0 hidden w-[8rem] overflow-hidden rounded-2xl shadow-[0_20px_40px_rgba(10,22,18,0.12)] ring-1 ring-white/80 lg:block xl:-right-8 xl:w-[9rem]",
      rotate: 3,
    },
  ];

  return (
    <>
      {cards.map((lugar, i) => {
        const layout = layouts[i];
        if (!layout) return null;
        return (
          <motion.figure
            key={lugar.id}
            initial="hidden"
            animate="visible"
            variants={fadeUpHero}
            transition={{ delay: 0.62 + i * 0.18 }}
            {...floatCard(i)}
            className={layout.className}
            style={{ rotate: layout.rotate }}
            aria-hidden
          >
            <div className="relative aspect-[4/5] w-full">
              <RemotePhoto
                src={lugar.capa}
                alt=""
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a1612]/55 via-transparent to-transparent" />
            </div>
            <figcaption className="landing-glass absolute bottom-2 left-2 right-2 truncate rounded-lg px-2 py-1 text-[9px] font-medium text-[#1a4a3a]">
              {lugar.nome}
            </figcaption>
          </motion.figure>
        );
      })}
    </>
  );
}
