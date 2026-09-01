"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import { PERIODO_RELATORIO_OPTIONS } from "@/lib/adminRelatorios";
import {
  buildFilaAbordagemComercial,
  formatFilaAbordagemCsv,
} from "@/lib/adminKpis";
import { createClient } from "@/lib/supabase";

/** @type {Record<string, string>} */
const PRIORIDADE_STYLES = {
  alta: "bg-red-100 text-red-800",
  media: "bg-amber-100 text-amber-900",
  baixa: "bg-slate-100 text-slate-600",
};

/** @type {Record<string, string>} */
const TIER_STYLES = {
  presenca: "text-sky-800",
  lancamento: "text-emerald-800",
  parceiro: "text-amber-800",
};

/**
 * Fila de abordagem comercial — quem contactar primeiro para vender o plano pago.
 * @returns {import("react").JSX.Element}
 */
export default function AbordagemComercialPage() {
  const { loading: authLoading } = useAdminAuth();
  const [periodo, setPeriodo] = useState("ultimos_30_dias");
  const [filtroPrioridade, setFiltroPrioridade] = useState("todas");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [fila, setFila] = useState(null);

  const handleGerar = useCallback(async () => {
    setGerando(true);
    setErro("");
    setFila(null);

    try {
      const supabase = createClient();
      const result = await buildFilaAbordagemComercial(supabase, periodo);
      setFila(result);
    } catch (error) {
      console.error("[abordagem] gerar:", error);
      setErro("Não foi possível carregar a fila. Tente novamente.");
    } finally {
      setGerando(false);
    }
  }, [periodo]);

  useEffect(() => {
    if (authLoading) return undefined;
    const timer = setTimeout(() => {
      handleGerar();
    }, 0);
    return () => clearTimeout(timer);
  }, [authLoading, handleGerar]);

  const itemsFiltrados = useMemo(() => {
    if (!fila?.items) return [];
    if (filtroPrioridade === "todas") return fila.items;
    return fila.items.filter((item) => item.prioridade === filtroPrioridade);
  }, [fila, filtroPrioridade]);

  const resumo = useMemo(() => {
    if (!fila?.items) return null;
    return {
      total: fila.items.length,
      alta: fila.items.filter((item) => item.prioridade === "alta").length,
      media: fila.items.filter((item) => item.prioridade === "media").length,
      baixa: fila.items.filter((item) => item.prioridade === "baixa").length,
    };
  }, [fila]);

  /**
   * @returns {void}
   */
  function handleExportCsv() {
    if (!fila) return;
    const csv = formatFilaAbordagemCsv(fila);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `abordagem-comercial-${periodo}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell
      title="Fila de abordagem"
      subtitle="Estabelecimentos ordenados por prioridade comercial e engajamento real"
      contentClassName="max-w-6xl"
    >
      <section className="rounded-3xl border border-sky-200 bg-sky-50/60 p-5 md:p-6">
        <h2 className="text-sm font-bold text-[#1a2e28]">Como usar na fase de lançamento</h2>
        <p className="mt-2 text-sm text-[#5a6b66]">
          Cadastre utilitários (farmácias, mercados) em{" "}
          <strong>Presença</strong> — perfil básico permanente. Restaurantes e
          experiências em <strong>Lançamento</strong> — perfil completo grátis até
          fev/2027. Depois do marketing, use esta fila para decidir quem abordar
          primeiro com dados de visualizações, IR AGORA e pedidos de perfil.
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs font-semibold">
          <Link
            href="/admin/locais"
            className="rounded-xl bg-white px-3 py-2 text-[#1a4a3a] ring-1 ring-sky-200 hover:bg-sky-100"
          >
            Cadastrar locais
          </Link>
          <Link
            href="/admin/kpis"
            className="rounded-xl bg-white px-3 py-2 text-[#1a4a3a] ring-1 ring-sky-200 hover:bg-sky-100"
          >
            Ver KPIs agregados
          </Link>
          <Link
            href="/admin/relatorios"
            className="rounded-xl bg-white px-3 py-2 text-[#1a4a3a] ring-1 ring-sky-200 hover:bg-sky-100"
          >
            Relatório individual
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-[#1a2e28]">Período</span>
              <select
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#e3e9e6] bg-[#f7faf9] px-4 py-3 text-sm text-[#1a2e28] focus:border-[#1a4a3a] focus:outline-none focus:ring-2 focus:ring-[#1a4a3a]/20"
              >
                {PERIODO_RELATORIO_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-[#1a2e28]">Prioridade</span>
              <select
                value={filtroPrioridade}
                onChange={(event) => setFiltroPrioridade(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#e3e9e6] bg-[#f7faf9] px-4 py-3 text-sm text-[#1a2e28] focus:border-[#1a4a3a] focus:outline-none focus:ring-2 focus:ring-[#1a4a3a]/20"
              >
                <option value="todas">Todas</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa (já parceiros)</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGerar}
              disabled={gerando}
              className="rounded-xl bg-[#1a4a3a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#153d31] disabled:opacity-60"
            >
              {gerando ? "Atualizando…" : "Atualizar fila"}
            </button>
            {fila && (
              <button
                type="button"
                onClick={handleExportCsv}
                className="rounded-xl bg-[#f0f4f3] px-5 py-3 text-sm font-semibold text-[#1a4a3a] hover:bg-[#e3e9e6]"
              >
                Exportar CSV
              </button>
            )}
          </div>
        </div>

        {erro && <p className="mt-4 text-sm font-semibold text-red-600">{erro}</p>}
      </section>

      {resumo && (
        <section className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <p className="text-xs font-semibold uppercase text-[#9aa8a3]">Total</p>
            <p className="mt-1 text-2xl font-bold text-[#1a4a3a]">{resumo.total}</p>
          </div>
          <div className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
            <p className="text-xs font-semibold uppercase text-red-700">Alta</p>
            <p className="mt-1 text-2xl font-bold text-red-800">{resumo.alta}</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-100">
            <p className="text-xs font-semibold uppercase text-amber-800">Média</p>
            <p className="mt-1 text-2xl font-bold text-amber-900">{resumo.media}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase text-slate-600">Baixa</p>
            <p className="mt-1 text-2xl font-bold text-slate-700">{resumo.baixa}</p>
          </div>
        </section>
      )}

      {fila && (
        <section className="mt-6 rounded-3xl bg-white p-5 shadow-md ring-1 ring-black/5 md:p-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
            Estabelecimentos · {fila.periodoLabel}
          </h2>
          <p className="mt-1 text-xs text-[#5a6b66]">
            {itemsFiltrados.length} de {fila.items.length} locais
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#eef3f1] text-xs uppercase text-[#9aa8a3]">
                  <th className="py-2 pr-4">Local</th>
                  <th className="py-2 pr-4">Plano</th>
                  <th className="py-2 pr-4">Prioridade</th>
                  <th className="py-2 pr-4">Views</th>
                  <th className="py-2 pr-4">IR AGORA</th>
                  <th className="py-2 pr-4">Favoritos</th>
                  <th className="py-2 pr-4">QR</th>
                  <th className="py-2 pr-4">Claim</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map((item) => (
                  <tr key={item.id} className="border-b border-[#f7faf9]">
                    <td className="py-2.5 pr-4">
                      <p className="font-semibold text-[#1a2e28]">{item.nome}</p>
                      <p className="text-xs text-[#9aa8a3]">
                        {item.categoria}
                        {item.subcategoria ? ` · ${item.subcategoria}` : ""}
                      </p>
                    </td>
                    <td
                      className={`py-2.5 pr-4 text-xs font-semibold ${TIER_STYLES[item.tier] || "text-[#5a6b66]"}`}
                    >
                      {item.tierLabel.replace(/\s*\(.*\)$/, "")}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${PRIORIDADE_STYLES[item.prioridade]}`}
                      >
                        {item.prioridade}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums">{item.visualizacoes}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{item.irAgora}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{item.favoritos}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{item.qrScans}</td>
                    <td className="py-2.5 pr-4 tabular-nums">{item.claimPerfil}</td>
                    <td className="py-2.5 pr-4 tabular-nums font-semibold text-[#1a4a3a]">
                      {item.engajamentoTotal}
                    </td>
                    <td className="py-2.5">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/admin/relatorios?lugar=${item.id}`}
                          className="rounded-lg bg-[#f0f4f3] px-2.5 py-1 text-xs font-semibold text-[#1a4a3a] hover:bg-[#e3e9e6]"
                        >
                          Relatório
                        </Link>
                        <Link
                          href={`/admin/locais/${item.id}/editar`}
                          className="rounded-lg bg-[#1a4a3a] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#153d31]"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {itemsFiltrados.length === 0 && (
              <p className="py-8 text-center text-sm text-[#5a6b66]">
                Nenhum estabelecimento neste filtro.
              </p>
            )}
          </div>
        </section>
      )}
    </AdminShell>
  );
}
