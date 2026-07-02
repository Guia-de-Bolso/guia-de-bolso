"use client";

import Link from "next/link";
import { canAccessDevAdmin } from "@/lib/adminRoles";

/**
 * Resumo operacional (atalhos clicáveis) — sem duplicar timeline de logs.
 * @param {object} props
 * @param {{ emAnalise: number, parceirosAtivos: number, parceirosVencendo?: number, parceirosVencidos?: number, curadoriaAtrasada?: number, premiumAtivos: number, feedbackNovos?: number }} props.counts
 * @param {string} [props.adminRole]
 * @returns {import("react").JSX.Element}
 */
export default function DashboardOperacionalSidebar({ counts, adminRole }) {
  const devAccess = canAccessDevAdmin(adminRole);

  const items = [
    {
      label: "Locais em análise",
      value: counts.emAnalise,
      href: "/admin/locais?status=em_analise",
      accent: "text-amber-700",
      bg: "bg-amber-50",
    },
    devAccess && {
      label: "Parceiros ativos",
      value: counts.parceirosAtivos,
      href: "/admin/parceiros",
      hint: "Prazos e curadoria",
      accent: "text-amber-700",
      bg: "bg-amber-50",
    },
    devAccess && {
      label: "Parceiros vencendo",
      value: counts.parceirosVencendo ?? 0,
      href: "/admin/parceiros?filtro=vencendo",
      hint: "Gratuito nos próximos 30 dias",
      accent: "text-amber-800",
      bg: "bg-amber-50",
    },
    devAccess && {
      label: "Curadoria atrasada",
      value: counts.curadoriaAtrasada ?? 0,
      href: "/admin/parceiros?filtro=curadoria",
      hint: "Revisão trimestral de avaliações",
      accent: "text-red-600",
      bg: "bg-red-50",
    },
    devAccess && {
      label: "Premium IA ativos",
      value: counts.premiumAtivos,
      href: "/admin/usuarios",
      hint: "Usuários com assinatura ativa",
      accent: "text-[#7a6520]",
      bg: "bg-[#f5e6b8]/50",
    },
    devAccess && {
      label: "Feedback novos",
      value: counts.feedbackNovos ?? 0,
      href: "/admin/feedback",
      accent: "text-[#1a4a3a]",
      bg: "bg-[#eef8f4]",
    },
  ].filter(Boolean);

  return (
    <section className="flex h-full flex-col rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 md:p-6">
      <h2 className="text-lg font-bold text-[#1a2e28]">Resumo operacional</h2>
      <p className="mt-1 text-sm text-[#5a6b66]">Pendências e atalhos do dia</p>

      <div className="mt-4 flex flex-1 flex-col gap-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center justify-between rounded-2xl p-4 transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30 ${item.bg}`}
          >
            <div className="min-w-0 pr-3">
              <p className="text-sm font-semibold text-[#1a2e28]">{item.label}</p>
              {item.hint && (
                <p className="mt-0.5 text-[11px] text-[#9aa8a3]">{item.hint}</p>
              )}
            </div>
            <span className={`shrink-0 text-3xl font-bold tabular-nums ${item.accent}`}>
              {item.value}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
