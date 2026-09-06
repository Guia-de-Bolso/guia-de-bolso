"use client";

import Link from "next/link";

/**
 * @param {object} props
 * @param {number} props.value
 * @param {string} props.label
 * @param {string} [props.href]
 * @returns {import("react").JSX.Element}
 */
function StatCard({ value, label, href }) {
  const content = (
    <>
      <p className="text-2xl font-bold tabular-nums text-[#1a4a3a]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#5a6b66]">{label}</p>
    </>
  );

  const className =
    "flex flex-col items-center justify-center rounded-2xl bg-white px-2 py-4 text-center shadow-sm ring-1 ring-[#e8eeee] transition active:scale-[0.98] hover:ring-[#1a4a3a]/20";

  if (href) {
    return (
      <Link href={href} className={className} aria-label={`${value} ${label}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={className} aria-label={`${value} ${label}`}>
      {content}
    </div>
  );
}

/**
 * Estatísticas do usuário (favoritos, avaliações, roteiros).
 * @param {object} props
 * @param {number} props.favoritos
 * @param {number} props.avaliacoes
 * @param {number} props.roteiros
 * @returns {import("react").JSX.Element}
 */
export default function PerfilStats({ favoritos, avaliacoes, roteiros }) {
  return (
    <section
      className="grid grid-cols-3 gap-2"
      aria-label="Suas estatísticas"
    >
      <StatCard value={favoritos} label="Favoritos" href="/favoritos" />
      <StatCard value={avaliacoes} label="Avaliações" />
      <StatCard value={roteiros} label="Roteiros" href="/?montarDia=1#montar-dia" />
    </section>
  );
}
