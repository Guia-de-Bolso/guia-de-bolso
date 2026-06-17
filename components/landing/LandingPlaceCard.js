"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { hoverLift } from "@/components/landing/landingMotion";
import { useLandingRichMotion } from "@/components/landing/useLandingRichMotion";
import { getCategoriaByNome } from "@/lib/categorias";
import { getStatusFuncionamento } from "@/lib/horarios";

/**
 * Card editorial de lugar.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingLugarCard} props.lugar
 * @param {boolean} [props.priority]
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
export default function LandingPlaceCard({ lugar, priority = false, className = "" }) {
  const richMotion = useLandingRichMotion();
  const cat = getCategoriaByNome(lugar.categoria);
  const status = getStatusFuncionamento(lugar.horarios, lugar.mostrarHorarios);
  const cardClass = `landing-card-hover group flex h-full flex-col overflow-hidden rounded-[1.35rem] bg-white/75 ring-1 ring-[rgba(13,31,25,0.04)] backdrop-blur-md ${className}`;

  const inner = (
    <>
      <div className="relative aspect-[5/4] overflow-hidden bg-[#e8f2ee]">
        {lugar.capa ? (
          <Image
            src={lugar.capa}
            alt={lugar.nome}
            fill
            sizes="(max-width: 768px) 88vw, 340px"
            quality={60}
            className={`object-cover ${
              richMotion
                ? "transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
                : ""
            }`}
            priority={priority}
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#e8f2ee] to-[#d4ede8]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f19]/50 via-transparent to-transparent opacity-80" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="font-display text-lg font-semibold tracking-tight text-white">
            {lugar.nome}
          </h3>
          <p className="mt-0.5 text-xs font-medium text-white/80">{lugar.categoria}</p>
        </div>
        {status && (
          <span
            className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md ${
              status.aberto ? "bg-white/90 text-[#1a4a3a]" : "bg-black/40 text-white"
            }`}
          >
            {status.aberto ? "Aberto" : "Fechado"}
          </span>
        )}
      </div>
      {(lugar.descricao || lugar.endereco) && (
        <div className="flex flex-1 flex-col p-4">
          {lugar.descricao && (
            <p className="line-clamp-2 text-sm leading-relaxed text-[#5c6f68]">{lugar.descricao}</p>
          )}
          {cat && (
            <span
              className={`mt-3 inline-flex w-fit rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${cat.chipClass}`}
            >
              {cat.icone} {cat.nome}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (!richMotion) {
    return <article className={cardClass}>{inner}</article>;
  }

  return (
    <motion.article
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={hoverLift}
      className={cardClass}
    >
      {inner}
    </motion.article>
  );
}
