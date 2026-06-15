"use client";

import Image from "next/image";
import { formatCategoriaAtrativoLabel, getCategoriaAtrativoMeta } from "@/lib/atrativos";

/**
 * @param {import('@/lib/landingPageData').LandingAtrativoCard} rota
 * @returns {string}
 */
function getAtrativoNome(rota) {
  return rota.titulo || "Atrativo";
}

/**
 * @param {import('@/lib/landingPageData').LandingAtrativoCard} rota
 * @returns {string}
 */
function formatDuracao(rota) {
  const minutos = rota.duracaoMinutos;
  if (minutos == null || !Number.isFinite(Number(minutos))) return "—";
  const total = Number(minutos);
  const horas = Math.floor(total / 60);
  const mins = total % 60;
  return horas > 0 ? `${horas}h${mins > 0 ? ` ${mins}m` : ""}` : `${mins}m`;
}

/**
 * @param {import('@/lib/landingPageData').LandingAtrativoCard} rota
 * @returns {string}
 */
function formatDistancia(rota) {
  const value = rota.distanciaKm;
  if (value == null || value === "") return "Distância livre";
  if (typeof value === "number") return `${value.toFixed(1)} km`;
  return String(value).includes("km") ? String(value) : `${value} km`;
}

/**
 * Card “Atrativo do dia” em miniatura.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingAtrativoCard} props.rota
 * @returns {import('react').ReactElement}
 */
function MockAtrativoDoDiaCard({ rota }) {
  const categoria = getCategoriaAtrativoMeta(rota.categoria);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="relative h-[108px] w-full">
        {rota.capa ? (
          <Image src={rota.capa} alt="" fill className="object-cover" sizes="260px" priority />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]" />
        )}
        <span className="absolute left-2.5 top-2.5 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-[#1a4a3a] shadow-sm backdrop-blur-md">
          🗓️ Atrativo do dia
        </span>
      </div>
      <div className="p-3">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#1a4a3a]">
          {categoria.icone} {categoria.nome}
        </p>
        <h3 className="mt-0.5 line-clamp-1 text-[15px] font-bold leading-tight text-[#1a2e28]">
          {getAtrativoNome(rota)}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-[#5a6b66]">
          {rota.descricao}
        </p>
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-[#5a6b66]">
          <span>⏱ {formatDuracao(rota)}</span>
          <span>📍 {formatDistancia(rota)}</span>
          {rota.dificuldade ? <span>⚡ {rota.dificuldade}</span> : null}
        </div>
      </div>
    </div>
  );
}

/**
 * Card compacto de rota.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingAtrativoCard} props.rota
 * @returns {import('react').ReactElement}
 */
function MockCompactAtrativoCard({ rota }) {
  const categoria = getCategoriaAtrativoMeta(rota.categoria);

  return (
    <div className="flex gap-2.5 rounded-2xl bg-white p-2.5 shadow-sm">
      <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl">
        {rota.capa ? (
          <Image src={rota.capa} alt="" fill className="object-cover" sizes="72px" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]" />
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#1a4a3a]">
          {categoria.icone} {formatCategoriaAtrativoLabel(categoria.nome)}
        </p>
        <p className="truncate text-[13px] font-bold text-[#1a2e28]">{getAtrativoNome(rota)}</p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-[#5a6b66]">
          {rota.descricao}
        </p>
      </div>
    </div>
  );
}

/**
 * Prévia da tela /atrativos dentro do mockup.
 * @param {object} props
 * @param {import('@/lib/landingPageData').LandingAtrativoCard[]} [props.atrativos]
 * @returns {import('react').ReactElement}
 */
export default function LandingPhoneAtrativosScreen({ atrativos = [] }) {
  const comCapa = atrativos.filter((r) => r.capa);
  const rotaDoDia = comCapa[0] ?? null;
  const outras = comCapa.slice(1, 3);

  return (
    <div className="flex h-full flex-col bg-[#f0f4f3]">
      <div className="shrink-0 border-b border-[#e3e9e6]/70 bg-[#f0f4f3]/95 px-3.5 pb-3 pt-0.5">
        <h2 className="text-[17px] font-bold tracking-tight text-[#1a2e28]">Atrativos</h2>
        <p className="mt-0.5 text-[11px] text-[#5a6b66]">Trilhas e caminhos selecionados</p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden px-3.5 pb-3 pt-3">
        <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-emerald-900 p-3.5 text-white shadow-sm">
          <span className="text-lg" aria-hidden>
            ✨
          </span>
          <h3 className="mt-1 text-[14px] font-bold leading-tight">Roteiro personalizado com IA</h3>
          <p className="mt-0.5 text-[10px] text-emerald-100/90">Monte seu roteiro ideal em segundos</p>
          <div className="mt-2.5 w-full rounded-xl bg-[#1a4a3a] py-2 text-center text-[11px] font-semibold text-white">
            Criar roteiro
          </div>
        </section>

        {rotaDoDia ? (
          <div className="mt-3">
            <MockAtrativoDoDiaCard rota={rotaDoDia} />
          </div>
        ) : null}

        {outras.length > 0 ? (
          <ul className="mt-3 space-y-2.5">
            {outras.map((rota) => (
              <li key={rota.id}>
                <MockCompactAtrativoCard rota={rota} />
              </li>
            ))}
          </ul>
        ) : null}

        {!rotaDoDia && outras.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white p-4 text-center shadow-sm">
            <p className="text-[13px] font-bold text-[#1a2e28]">Atrativos em breve</p>
            <p className="mt-1 text-[11px] text-[#5a6b66]">Trilhas e caminhos curados.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
