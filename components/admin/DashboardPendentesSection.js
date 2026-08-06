"use client";

import Link from "next/link";

/**
 * @param {number|string} value
 * @returns {import("react").JSX.Element}
 */
function Stars({ value }) {
  return (
    <span className="text-[#e8a838] text-lg">
      {"★".repeat(Number(value) || 0)}
      <span className="text-zinc-300">{"★".repeat(5 - (Number(value) || 0))}</span>
    </span>
  );
}

/**
 * @param {object} props
 * @param {object[]} props.pendentes
 * @param {number} props.totalPendentes
 * @param {(id: string, status: string) => void} props.onUpdateStatus
 * @returns {import("react").JSX.Element}
 */
export default function DashboardPendentesSection({
  pendentes,
  totalPendentes,
  onUpdateStatus,
}) {
  return (
    <section className="rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-[#1a2e28]">Fila de trabalho</h2>
          {totalPendentes > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">
              {totalPendentes}
            </span>
          )}
        </div>
        <Link
          href="/admin/avaliacoes?tab=pendente"
          className="text-sm font-semibold text-[#1a4a3a] underline-offset-2 hover:underline"
        >
          Ver todas →
        </Link>
      </div>
      <p className="mt-1 text-sm text-[#5a6b66]">Avaliações aguardando moderação</p>

      <div className="mt-5 space-y-4">
        {pendentes.length === 0 ? (
          <div className="rounded-2xl bg-[#f7faf9] px-6 py-10 text-center">
            <span className="text-4xl" aria-hidden>
              ✓
            </span>
            <p className="mt-3 text-base font-semibold text-[#1a2e28]">
              Nenhuma avaliação pendente — tudo em dia
            </p>
            <p className="mt-1 text-sm text-[#5a6b66]">
              Novas avaliações dos usuários aparecerão aqui.
            </p>
            <Link
              href="/admin/locais"
              className="mt-5 inline-flex text-sm font-semibold text-[#1a4a3a] underline-offset-2 hover:underline"
            >
              Revisar locais →
            </Link>
          </div>
        ) : (
          pendentes.map((avaliacao) => (
            <article
              key={avaliacao.id}
              className="rounded-2xl border border-[#eef3f1] bg-[#fafcfb] p-5 shadow-sm md:p-6"
            >
              <p className="font-bold text-[#1a2e28]">
                {avaliacao.lugares?.nome || "Lugar"}
              </p>
              <div className="mt-1">
                <Stars value={avaliacao.nota} />
              </div>
              <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[#5a6b66]">
                {avaliacao.comentario || "Sem comentário"}
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(avaliacao.id, "aprovado")}
                  className="flex-1 rounded-xl bg-[#1a4a3a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#153d31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/40"
                >
                  Aprovar
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateStatus(avaliacao.id, "rejeitado")}
                  className="flex-1 rounded-xl bg-[#d9534f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#c44743] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  Rejeitar
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
