"use client";

import { ATRATIVO_METRICS_SHELL_CLASS } from "@/components/atrativos/atrativoDetalheTokens";
import { dificuldadeToneClass } from "@/lib/atrativoDetalheDisplay";

/**
 * @param {{ className?: string }} props
 */
function IconClock({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconPin({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
    </svg>
  );
}

function IconBolt({ className = "h-5 w-5" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M13 2L3 14h8l-1 8 11-13h-8l0-7z" />
    </svg>
  );
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value
 * @param {(props: { className?: string }) => import("react").ReactElement} props.Icon
 * @param {string} [props.valueClassName]
 */
function MetricCell({ label, value, Icon, valueClassName = "text-[#1a2e28]" }) {
  return (
    <div className="flex flex-col items-center text-center">
      <Icon className="mb-2 h-5 w-5 text-[#8a9a94]" aria-hidden />
      <p className={`text-xl font-bold leading-none tracking-tight ${valueClassName}`}>{value}</p>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a9a94]">
        {label}
      </p>
    </div>
  );
}

/**
 * Métricas da rota (duração, distância, dificuldade).
 * @param {object} props
 */
export default function AtrativoMetrics({ duracao, distancia, dificuldade, compact = false }) {
  if (compact) {
    const parts = [duracao, distancia, dificuldade].filter(
      (part) => part && part !== "—"
    );
    if (parts.length === 0) return null;
    return (
      <p className="mt-3 text-[15px] font-medium leading-snug text-[#5a6b66]">
        {parts.join(" · ")}
      </p>
    );
  }

  return (
    <div className={ATRATIVO_METRICS_SHELL_CLASS}>
      <MetricCell label="Duração" value={duracao} Icon={IconClock} />
      <MetricCell label="Distância" value={distancia} Icon={IconPin} />
      <MetricCell
        label="Dificuldade"
        value={dificuldade}
        Icon={IconBolt}
        valueClassName={dificuldadeToneClass(dificuldade)}
      />
    </div>
  );
}
