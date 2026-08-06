"use client";

import Link from "next/link";
import { getDashboardHeroShortcuts } from "@/lib/adminDashboardShortcuts";

/**
 * @param {object} props
 * @param {string} props.saudacao
 * @param {string} props.nome
 * @param {string} props.dataFormatada
 * @param {string} props.resumo
 * @param {string} [props.subtitle]
 * @param {string} [props.role]
 * @returns {import("react").JSX.Element}
 */
export default function DashboardHero({
  saudacao,
  nome,
  dataFormatada,
  resumo,
  subtitle,
  role,
}) {
  const atalhos = getDashboardHeroShortcuts(role);

  return (
    <section
      className="min-h-[140px] rounded-3xl bg-gradient-to-br from-[#eef8f4] via-white to-[#f0f4f3] p-6 shadow-md ring-1 ring-[#1a4a3a]/10 md:p-8"
      aria-labelledby="dashboard-hero-title"
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#1a4a3a]/80">
            {dataFormatada}
          </p>
          <h2
            id="dashboard-hero-title"
            className="mt-2 text-2xl font-bold tracking-tight text-[#1a2e28] md:text-3xl"
          >
            {saudacao}, {nome}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm font-medium text-[#5a6b66] md:text-base">{subtitle}</p>
          )}
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#5a6b66] md:text-base">
            {resumo}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 lg:max-w-md lg:justify-end">
          {atalhos.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full bg-white px-3.5 py-2 text-xs font-semibold text-[#1a4a3a] shadow-sm ring-1 ring-[#1a4a3a]/15 transition hover:bg-[#d4ede8] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30 sm:px-4 sm:text-sm"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
