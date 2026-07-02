"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import {
  PARCEIRO_MODALIDADE,
  PARCEIRO_STATUS,
  buildCuradoriaAvaliacoesFeita,
  fetchParceiroProgramaColumnsReady,
  formatDiasRestantesParceiro,
  getDiasAteCuradoria,
  getDiasRestantesParceiroGratis,
  getParceiroModalidadeLabel,
  getParceiroStatusLabel,
} from "@/lib/parceiroAdmin";
import { hojeISO } from "@/lib/homeRotation";
import { createClient } from "@/lib/supabase";

const FILTROS = [
  { id: "todos", label: "Todos ativos" },
  { id: "gratis", label: "6 meses grátis" },
  { id: "pago", label: "Pagos" },
  { id: "vencendo", label: "Vencendo (30d)" },
  { id: "vencido", label: "Gratuito vencido" },
  { id: "curadoria", label: "Curadoria atrasada" },
];

/**
 * @param {string} iso
 * @returns {string}
 */
function formatDataBR(iso) {
  if (!iso) return "—";
  const [y, m, d] = String(iso).split("-");
  if (!y || !m || !d) return "—";
  return `${d}/${m}/${y}`;
}

/**
 * @param {object} props
 * @param {boolean} props.active
 * @param {() => void} props.onClick
 * @param {import("react").ReactNode} props.children
 */
function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
        active
          ? "bg-[#1a4a3a] text-white shadow-sm"
          : "bg-[#f0f4f3] text-[#5a6b66] hover:bg-[#e3e9e6]"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Painel CRM de parceiros — prazos, curadoria e ações rápidas.
 * @returns {import("react").JSX.Element}
 */
export default function ParceirosAdminPage() {
  const { loading } = useAdminAuth();
  const searchParams = useSearchParams();
  const filtroFromUrl = searchParams.get("filtro");
  const [lugares, setLugares] = useState([]);
  const [filtro, setFiltro] = useState(
    FILTROS.some((item) => item.id === filtroFromUrl) ? filtroFromUrl : "todos"
  );
  const [columnsReady, setColumnsReady] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const hoje = hojeISO();

  const loadParceiros = useCallback(async () => {
    const supabase = createClient();
    const ready = await fetchParceiroProgramaColumnsReady(supabase);
    setColumnsReady(ready);

    const { data, error } = await supabase
      .from("lugares")
      .select(
        "id, nome, categoria, status, eh_parceiro, parceiro_modalidade, parceiro_inicio_em, parceiro_fim_em, parceiro_status, ultima_curadoria_avaliacoes_em, proxima_curadoria_avaliacoes_em, parceiro_notas_internas"
      )
      .eq("eh_parceiro", true)
      .eq("status", "ativo")
      .order("nome");

    if (error) {
      console.error("[admin parceiros]", error.message);
      setLugares([]);
      return;
    }

    setLugares(data ?? []);
  }, []);

  useEffect(() => {
    if (loading) return undefined;
    loadParceiros();
  }, [loading, loadParceiros]);

  useEffect(() => {
    if (filtroFromUrl && FILTROS.some((item) => item.id === filtroFromUrl)) {
      setFiltro(filtroFromUrl);
    }
  }, [filtroFromUrl]);

  /**
   * @param {string} id
   * @param {object} patch
   */
  async function patchLugar(id, patch) {
    setBusyId(id);
    const supabase = createClient();
    const { error } = await supabase.from("lugares").update(patch).eq("id", id);
    setBusyId(null);
    if (error) {
      console.error(error);
      window.alert(error.message || "Não foi possível atualizar.");
      return;
    }
    setLugares((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
    if (patch.eh_parceiro === false) {
      setLugares((items) => items.filter((item) => item.id !== id));
    }
  }

  const stats = useMemo(() => {
    let gratis = 0;
    let pago = 0;
    let vencendo = 0;
    let vencido = 0;
    let curadoriaAtrasada = 0;

    for (const lugar of lugares) {
      if (lugar.parceiro_modalidade === PARCEIRO_MODALIDADE.PAGO) {
        pago += 1;
      } else {
        gratis += 1;
        const dias = getDiasRestantesParceiroGratis(lugar.parceiro_fim_em, hoje);
        if (dias !== null && dias < 0) vencido += 1;
        else if (dias !== null && dias <= 30) vencendo += 1;
      }
      const diasCuradoria = getDiasAteCuradoria(
        lugar.proxima_curadoria_avaliacoes_em,
        hoje
      );
      if (diasCuradoria !== null && diasCuradoria < 0) curadoriaAtrasada += 1;
    }

    return { total: lugares.length, gratis, pago, vencendo, vencido, curadoriaAtrasada };
  }, [lugares, hoje]);

  const filtered = useMemo(() => {
    return lugares.filter((lugar) => {
      if (filtro === "gratis") {
        return lugar.parceiro_modalidade !== PARCEIRO_MODALIDADE.PAGO;
      }
      if (filtro === "pago") {
        return lugar.parceiro_modalidade === PARCEIRO_MODALIDADE.PAGO;
      }
      if (filtro === "vencendo") {
        const dias = getDiasRestantesParceiroGratis(lugar.parceiro_fim_em, hoje);
        return (
          lugar.parceiro_modalidade !== PARCEIRO_MODALIDADE.PAGO &&
          dias !== null &&
          dias >= 0 &&
          dias <= 30
        );
      }
      if (filtro === "vencido") {
        const dias = getDiasRestantesParceiroGratis(lugar.parceiro_fim_em, hoje);
        return (
          lugar.parceiro_modalidade !== PARCEIRO_MODALIDADE.PAGO &&
          dias !== null &&
          dias < 0
        );
      }
      if (filtro === "curadoria") {
        const dias = getDiasAteCuradoria(lugar.proxima_curadoria_avaliacoes_em, hoje);
        return dias !== null && dias < 0;
      }
      return true;
    });
  }, [lugares, filtro, hoje]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell title="Parceiros">
      <div className="space-y-6">
        <div>
          <p className="text-sm text-[#5a6b66]">
            Controle de parcerias — 6 meses grátis, renovação e curadoria trimestral de
            avaliações.
          </p>
        </div>

        {!columnsReady && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Rode{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs">
              supabase/lugares_parceiro_programa.sql
            </code>{" "}
            no Supabase para ativar prazos e curadoria.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: "Ativos", value: stats.total },
            { label: "Grátis", value: stats.gratis },
            { label: "Pagos", value: stats.pago },
            { label: "Vencendo 30d", value: stats.vencendo, accent: "text-amber-700" },
            { label: "Vencidos", value: stats.vencido, accent: "text-red-600" },
            {
              label: "Curadoria atrasada",
              value: stats.curadoriaAtrasada,
              accent: "text-red-600",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">
                {item.label}
              </p>
              <p
                className={`mt-1 text-2xl font-bold tabular-nums ${item.accent || "text-[#1a2e28]"}`}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map((item) => (
            <FilterChip
              key={item.id}
              active={filtro === item.id}
              onClick={() => setFiltro(item.id)}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-[#eef3f1] bg-[#f7faf9] text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
                <tr>
                  <th className="px-4 py-3">Estabelecimento</th>
                  <th className="px-4 py-3">Modalidade</th>
                  <th className="px-4 py-3">Início</th>
                  <th className="px-4 py-3">Fim gratuito</th>
                  <th className="px-4 py-3">Próx. curadoria</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef3f1]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[#5a6b66]">
                      Nenhum parceiro neste filtro.
                    </td>
                  </tr>
                ) : (
                  filtered.map((lugar) => {
                    const diasGratis = getDiasRestantesParceiroGratis(
                      lugar.parceiro_fim_em,
                      hoje
                    );
                    const diasCuradoria = getDiasAteCuradoria(
                      lugar.proxima_curadoria_avaliacoes_em,
                      hoje
                    );
                    const isBusy = busyId === lugar.id;

                    return (
                      <tr key={lugar.id} className="align-top">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-[#1a2e28]">{lugar.nome}</p>
                          <p className="text-xs text-[#9aa8a3]">{lugar.categoria}</p>
                          {lugar.parceiro_notas_internas && (
                            <p className="mt-1 text-xs text-[#5a6b66]">
                              {lugar.parceiro_notas_internas}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#5a6b66]">
                          {getParceiroModalidadeLabel(lugar.parceiro_modalidade)}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-[#5a6b66]">
                          {formatDataBR(lugar.parceiro_inicio_em)}
                        </td>
                        <td className="px-4 py-3">
                          {lugar.parceiro_modalidade === PARCEIRO_MODALIDADE.PAGO ? (
                            <span className="text-[#9aa8a3]">—</span>
                          ) : (
                            <>
                              <span className="tabular-nums text-[#5a6b66]">
                                {formatDataBR(lugar.parceiro_fim_em)}
                              </span>
                              {diasGratis !== null && (
                                <p
                                  className={`text-xs ${
                                    diasGratis < 0 ? "text-red-600" : "text-[#9aa8a3]"
                                  }`}
                                >
                                  {formatDiasRestantesParceiro(diasGratis)}
                                </p>
                              )}
                            </>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="tabular-nums text-[#5a6b66]">
                            {formatDataBR(lugar.proxima_curadoria_avaliacoes_em)}
                          </span>
                          {diasCuradoria !== null && (
                            <p
                              className={`text-xs ${
                                diasCuradoria < 0 ? "text-red-600" : "text-[#9aa8a3]"
                              }`}
                            >
                              {diasCuradoria < 0
                                ? `Atrasada ${Math.abs(diasCuradoria)}d`
                                : `Em ${diasCuradoria}d`}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[#5a6b66]">
                          {getParceiroStatusLabel(lugar.parceiro_status)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-[12rem] flex-col gap-1.5">
                            <Link
                              href={`/admin/locais/${lugar.id}/editar`}
                              className="text-xs font-semibold text-[#1a4a3a] hover:underline"
                            >
                              Editar
                            </Link>
                            <Link
                              href={`/admin/relatorios?lugar=${lugar.id}`}
                              className="text-xs font-semibold text-[#1a4a3a] hover:underline"
                            >
                              Relatório
                            </Link>
                            <Link
                              href={`/admin/avaliacoes?lugar_id=${lugar.id}&tab=aprovado`}
                              className="text-xs font-semibold text-[#1a4a3a] hover:underline"
                            >
                              Avaliações
                            </Link>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                patchLugar(lugar.id, buildCuradoriaAvaliacoesFeita(hoje))
                              }
                              className="text-left text-xs font-semibold text-[#1a4a3a] hover:underline disabled:opacity-50"
                            >
                              Curadoria feita
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                patchLugar(lugar.id, {
                                  eh_parceiro: true,
                                  parceiro_modalidade: PARCEIRO_MODALIDADE.PAGO,
                                  parceiro_fim_em: null,
                                  parceiro_status: PARCEIRO_STATUS.CONVERTIDO_PAGO,
                                })
                              }
                              className="text-left text-xs font-semibold text-amber-800 hover:underline disabled:opacity-50"
                            >
                              Converter pago
                            </button>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => {
                                if (
                                  !window.confirm(
                                    `Encerrar parceria de "${lugar.nome}"? O local deixa de aparecer no app.`
                                  )
                                ) {
                                  return;
                                }
                                patchLugar(lugar.id, {
                                  eh_parceiro: false,
                                  parceiro_status: PARCEIRO_STATUS.ENCERRADO,
                                });
                              }}
                              className="text-left text-xs font-semibold text-red-600 hover:underline disabled:opacity-50"
                            >
                              Encerrar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
