"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import {
  CATEGORIA_CHIP_STYLES,
  CATEGORIA_OPTIONS,
  DESPESA_PERIODOS,
  MOEDA_OPTIONS,
  PERIODICIDADE_OPTIONS,
  calcVariationPercent,
  calcularResumo,
  calcularTotalPeriodo,
  calcularValorLancamentoBrl,
  createDespesaAdmin,
  createLancamentoAdmin,
  deleteDespesaAdmin,
  deleteLancamentoAdmin,
  fetchDespesasAdmin,
  fetchLancamentosAdmin,
  fetchLancamentosByDespesa,
  fetchTaxaCambio,
  formatDespesaCurrency,
  getCategoriaLabel,
  getPeriodicidadeLabel,
  getPeriodoAnterior,
  getTodayDateKey,
  isDespesaAtiva,
  normalizeValorMensal,
  resolveDespesaPeriodo,
  seedDespesasSugestoes,
  toBrl,
  toUsd,
  updateDespesaAdmin,
  updateTaxaCambio,
  validateDespesaPayload,
} from "@/lib/adminDespesas";
import { createClient } from "@/lib/supabase";
import { getBrasiliaDayEndDbString, getBrasiliaDayStartDbString } from "@/lib/supabaseTimestamp";

const EMPTY_FORM = {
  nome_plataforma: "",
  categoria: "infra",
  periodicidade: "mensal",
  valor: "",
  moeda: "BRL",
  ativo: true,
  data_inicio: getTodayDateKey(),
  data_fim: "",
  dia_vencimento: "",
  notas: "",
  url_referencia: "",
  taxa_cambio: "",
};

const EMPTY_LANCAMENTO = {
  valor: "",
  moeda: "BRL",
  data_pagamento: getTodayDateKey(),
  competencia: "",
  notas: "",
};

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {() => void} props.onClose
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").JSX.Element|null}
 */
function AdminModal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="fixed inset-x-4 top-[8%] z-50 mx-auto max-h-[84vh] max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-[#1a2e28]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-sm text-[#5a6b66] hover:bg-[#f0f4f3]"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </>
  );
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").JSX.Element}
 */
function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold text-[#1a2e28]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

/**
 * @param {object} props
 * @param {string} props.title
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").JSX.Element}
 */
function KpiCard({ title, children }) {
  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-[#5a6b66]">{title}</h3>
      <div className="mt-2">{children}</div>
    </article>
  );
}

/**
 * Admin — gestão de despesas operacionais da stack.
 * @returns {import("react").JSX.Element}
 */
export default function DespesasPage() {
  const { loading: authLoading } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [despesas, setDespesas] = useState([]);
  const [lancamentos, setLancamentos] = useState([]);
  const [taxaCambio, setTaxaCambio] = useState(5.9);
  const [taxaInput, setTaxaInput] = useState("5.90");

  const [periodoId, setPeriodoId] = useState("mes");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [customInicio, setCustomInicio] = useState("");
  const [customFim, setCustomFim] = useState("");
  const [moedaExibicao, setMoedaExibicao] = useState("BRL");
  const [modo, setModo] = useState("projetado");

  const [filtroStatus, setFiltroStatus] = useState("todas");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [busca, setBusca] = useState("");

  const [custoIaUsd, setCustoIaUsd] = useState(0);

  const [modalDespesa, setModalDespesa] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");

  const [modalLancamento, setModalLancamento] = useState(null);
  const [lancamentoForm, setLancamentoForm] = useState(EMPTY_LANCAMENTO);
  const [lancamentosDespesa, setLancamentosDespesa] = useState([]);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const periodo = useMemo(
    () => resolveDespesaPeriodo(periodoId, ano, customInicio, customFim),
    [periodoId, ano, customInicio, customFim]
  );

  const periodoAnterior = useMemo(
    () => getPeriodoAnterior(periodoId, periodo, ano),
    [periodoId, periodo, ano]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();

    const [despesasData, lancamentosData, taxa, iaRes] = await Promise.all([
      fetchDespesasAdmin(supabase),
      fetchLancamentosAdmin(supabase),
      fetchTaxaCambio(supabase),
      supabase
        .from("logs_ia")
        .select("custo_usd")
        .gte("created_at", getBrasiliaDayStartDbString(periodo.inicio))
        .lte("created_at", getBrasiliaDayEndDbString(periodo.fim)),
    ]);

    const iaTotal = (iaRes.data || []).reduce((acc, row) => acc + Number(row.custo_usd || 0), 0);

    setDespesas(despesasData);
    setLancamentos(lancamentosData);
    setTaxaCambio(taxa);
    setTaxaInput(String(taxa));
    setCustoIaUsd(iaTotal);
    setLoading(false);
  }, [periodo.inicio, periodo.fim]);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [authLoading, loadData]);

  const resumo = useMemo(
    () => calcularResumo(despesas, lancamentos, periodo, taxaCambio, modo),
    [despesas, lancamentos, periodo, taxaCambio, modo]
  );

  const totalAnterior = useMemo(
    () =>
      calcularTotalPeriodo(
        despesas,
        lancamentos,
        periodoAnterior.inicio,
        periodoAnterior.fim,
        taxaCambio,
        modo
      ),
    [despesas, lancamentos, periodoAnterior, taxaCambio, modo]
  );

  const variacao = calcVariationPercent(resumo.totalBrl, totalAnterior);

  const despesasFiltradas = useMemo(() => {
    const term = busca.trim().toLowerCase();
    return despesas.filter((d) => {
      if (filtroStatus === "ativas" && !isDespesaAtiva(d)) return false;
      if (filtroStatus === "inativas" && isDespesaAtiva(d)) return false;
      if (filtroCategoria && d.categoria !== filtroCategoria) return false;
      if (term && !d.nome_plataforma.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [despesas, filtroStatus, filtroCategoria, busca]);

  const formatValor = (valorBrl) => {
    if (moedaExibicao === "USD") return formatDespesaCurrency(toUsd(valorBrl, taxaCambio), "USD");
    return formatDespesaCurrency(valorBrl, "BRL");
  };

  const openCreate = () => {
    setForm({ ...EMPTY_FORM, data_inicio: getTodayDateKey() });
    setFormError("");
    setModalDespesa("create");
  };

  const openEdit = (despesa) => {
    setForm({
      nome_plataforma: despesa.nome_plataforma,
      categoria: despesa.categoria,
      periodicidade: despesa.periodicidade,
      valor: String(despesa.valor),
      moeda: despesa.moeda,
      ativo: despesa.ativo,
      data_inicio: despesa.data_inicio,
      data_fim: despesa.data_fim || "",
      dia_vencimento: despesa.dia_vencimento ? String(despesa.dia_vencimento) : "",
      notas: despesa.notas || "",
      url_referencia: despesa.url_referencia || "",
      taxa_cambio: despesa.taxa_cambio ? String(despesa.taxa_cambio) : "",
    });
    setFormError("");
    setModalDespesa(despesa.id);
  };

  const handleSaveDespesa = async () => {
    setSaving(true);
    setFormError("");
    const validation = validateDespesaPayload(form);
    if (!validation.ok) {
      setFormError(validation.error || "Dados inválidos.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const result =
      modalDespesa === "create"
        ? await createDespesaAdmin(supabase, form)
        : await updateDespesaAdmin(supabase, modalDespesa, form);

    setSaving(false);
    if (!result.ok) {
      setFormError(result.error || "Erro ao salvar.");
      return;
    }

    setModalDespesa(null);
    await loadData();
  };

  const handleDeleteDespesa = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    const supabase = createClient();
    const result = await deleteDespesaAdmin(supabase, deleteTarget.id);
    setSaving(false);
    if (!result.ok) {
      setError(result.error || "Erro ao excluir.");
      return;
    }
    setDeleteTarget(null);
    await loadData();
  };

  const openLancamento = async (despesa) => {
    setFormError("");
    setModalLancamento(despesa);
    setLancamentoForm({
      ...EMPTY_LANCAMENTO,
      valor: String(despesa.valor),
      moeda: despesa.moeda,
      data_pagamento: getTodayDateKey(),
      competencia: periodo.inicio.slice(0, 7),
    });
    const supabase = createClient();
    const rows = await fetchLancamentosByDespesa(supabase, despesa.id);
    setLancamentosDespesa(rows);
  };

  const handleSaveLancamento = async () => {
    if (!modalLancamento) return;
    setSaving(true);
    const supabase = createClient();
    const result = await createLancamentoAdmin(supabase, {
      despesa_id: modalLancamento.id,
      ...lancamentoForm,
    });
    setSaving(false);
    if (!result.ok) {
      setFormError(result.error || "Erro ao registrar pagamento.");
      return;
    }
    const rows = await fetchLancamentosByDespesa(supabase, modalLancamento.id);
    setLancamentosDespesa(rows);
    setLancamentoForm({ ...EMPTY_LANCAMENTO, moeda: modalLancamento.moeda });
    await loadData();
  };

  const handleDeleteLancamento = async (id) => {
    const supabase = createClient();
    await deleteLancamentoAdmin(supabase, id);
    if (modalLancamento) {
      const rows = await fetchLancamentosByDespesa(supabase, modalLancamento.id);
      setLancamentosDespesa(rows);
    }
    await loadData();
  };

  const handleSaveTaxa = async () => {
    setSaving(true);
    const supabase = createClient();
    const result = await updateTaxaCambio(supabase, taxaInput);
    setSaving(false);
    if (!result.ok) {
      setError(result.error || "Erro ao salvar câmbio.");
      return;
    }
    setTaxaCambio(Number(taxaInput));
  };

  const handleSeed = async () => {
    setSaving(true);
    const supabase = createClient();
    const { inseridos, ignorados } = await seedDespesasSugestoes(supabase);
    setSaving(false);
    setError("");
    if (inseridos === 0 && ignorados > 0) {
      setError("Sugestões já importadas anteriormente.");
    }
    await loadData();
  };

  if (authLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3]">Carregando...</div>;
  }

  return (
    <AdminShell title="Despesas" subtitle="Custos fixos e assinaturas da stack">
      <div className="space-y-6">
        <div className="rounded-2xl bg-[#e8f3ef] px-4 py-3 text-sm text-[#1a4a3a] ring-1 ring-[#1a4a3a]/10">
          Custos variáveis de IA são monitorados automaticamente em{" "}
          <Link href="/admin/ia" className="font-semibold underline">
            IA &amp; Custos
          </Link>
          .
        </div>

        {error ? (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : null}

        <section className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-2 lg:grid-cols-4">
          <label className="text-sm font-semibold text-[#5a6b66]">
            Período
            <select
              value={periodoId}
              onChange={(e) => setPeriodoId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
            >
              {DESPESA_PERIODOS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>

          {periodoId !== "custom" ? (
            <label className="text-sm font-semibold text-[#5a6b66]">
              Ano
              <input
                type="number"
                min="2020"
                max="2100"
                value={ano}
                onChange={(e) => setAno(Number(e.target.value))}
                className="mt-1 w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              />
            </label>
          ) : (
            <>
              <label className="text-sm font-semibold text-[#5a6b66]">
                Início
                <input
                  type="date"
                  value={customInicio}
                  onChange={(e) => setCustomInicio(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-semibold text-[#5a6b66]">
                Fim
                <input
                  type="date"
                  value={customFim}
                  onChange={(e) => setCustomFim(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
                />
              </label>
            </>
          )}

          <label className="text-sm font-semibold text-[#5a6b66]">
            Exibir em
            <select
              value={moedaExibicao}
              onChange={(e) => setMoedaExibicao(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
            >
              {MOEDA_OPTIONS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-semibold text-[#5a6b66]">
            Modo
            <select
              value={modo}
              onChange={(e) => setModo(e.target.value)}
              className="mt-1 w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
            >
              <option value="projetado">Projetado</option>
              <option value="realizado">Realizado</option>
            </select>
          </label>

          <div className="md:col-span-2 lg:col-span-4 flex flex-wrap items-end gap-2">
            <label className="text-sm font-semibold text-[#5a6b66]">
              Câmbio USD→BRL
              <div className="mt-1 flex gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={taxaInput}
                  onChange={(e) => setTaxaInput(e.target.value)}
                  className="w-28 rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleSaveTaxa}
                  disabled={saving}
                  className="rounded-xl bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Salvar
                </button>
              </div>
            </label>
          </div>
        </section>

        {loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-[#5a6b66] shadow-sm">
            Carregando despesas...
          </div>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard title={`Total do período (${periodo.label})`}>
                <p className="text-2xl font-bold">{formatValor(resumo.totalBrl)}</p>
                <p className="text-xs text-[#5a6b66]">
                  {formatDespesaCurrency(resumo.totalUsd, "USD")} · {resumo.itensAtivos} despesas ativas
                </p>
                <p className={`mt-1 text-xs ${variacao <= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {variacao === 0
                    ? "sem variação vs período anterior"
                    : `${variacao > 0 ? "+" : ""}${variacao.toFixed(1)}% vs período anterior`}
                </p>
              </KpiCard>

              <KpiCard title="Equiv. mensal (run rate)">
                <p className="text-2xl font-bold">{formatValor(resumo.mensalEquivalente)}</p>
                <p className="text-xs text-[#5a6b66]">Média do período selecionado</p>
              </KpiCard>

              <KpiCard title="Projeção anual">
                <p className="text-2xl font-bold">{formatValor(resumo.anualProjetado)}</p>
                <p className="text-xs text-[#5a6b66]">Mensal × 12</p>
              </KpiCard>

              <KpiCard title="IA variável (período)">
                <p className="text-2xl font-bold">
                  {moedaExibicao === "USD"
                    ? formatDespesaCurrency(custoIaUsd, "USD")
                    : formatDespesaCurrency(custoIaUsd * taxaCambio, "BRL")}
                </p>
                <Link href="/admin/ia" className="text-xs font-semibold text-[#1a4a3a] underline">
                  Ver detalhes em IA &amp; Custos →
                </Link>
              </KpiCard>

              <KpiCard title="Custo total operacional">
                <p className="text-2xl font-bold">
                  {formatValor(resumo.totalBrl + custoIaUsd * taxaCambio)}
                </p>
                <p className="text-xs text-[#5a6b66]">Despesas + IA variável</p>
              </KpiCard>

              <KpiCard title={modo === "realizado" ? "Pagamentos no período" : "Itens projetados"}>
                <p className="text-2xl font-bold">
                  {modo === "realizado" ? resumo.itensLancados : resumo.itensProjetados}
                </p>
                <p className="text-xs text-[#5a6b66]">
                  {modo === "realizado"
                    ? "Lançamentos registrados"
                    : "Plataformas com custo no período"}
                </p>
              </KpiCard>
            </section>

            {resumo.porCategoria.length > 0 ? (
              <section className="rounded-2xl bg-white p-4 shadow-sm">
                <h2 className="mb-4 text-lg font-bold">Por categoria</h2>
                <div className="space-y-3">
                  {resumo.porCategoria.map((item) => (
                    <div key={item.categoria}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-semibold">{item.label}</span>
                        <span className="text-[#5a6b66]">
                          {formatValor(item.totalBrl)} ({item.percentual.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#f0f4f3]">
                        <div
                          className="h-full rounded-full bg-[#1a4a3a]"
                          style={{ width: `${Math.max(4, item.percentual)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Despesas cadastradas</h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleSeed}
                    disabled={saving}
                    className="rounded-xl border border-[#dce5e2] px-4 py-2 text-sm font-semibold text-[#5a6b66] hover:bg-[#f7faf9] disabled:opacity-50"
                  >
                    Carregar sugestões
                  </button>
                  <button
                    type="button"
                    onClick={openCreate}
                    className="rounded-xl bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Nova despesa
                  </button>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {[
                  { id: "todas", label: "Todas" },
                  { id: "ativas", label: "Ativas" },
                  { id: "inativas", label: "Inativas" },
                ].map((chip) => (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setFiltroStatus(chip.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                      filtroStatus === chip.id
                        ? "bg-[#1a4a3a] text-white"
                        : "bg-[#f7faf9] text-[#5a6b66] ring-1 ring-[#e3e9e6]"
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
                <select
                  value={filtroCategoria}
                  onChange={(e) => setFiltroCategoria(e.target.value)}
                  className="rounded-full border border-[#dce5e2] px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="">Todas categorias</option>
                  {CATEGORIA_OPTIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
                <input
                  type="search"
                  placeholder="Buscar plataforma..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="min-w-[180px] flex-1 rounded-full border border-[#dce5e2] px-3 py-1.5 text-xs"
                />
              </div>

              {despesasFiltradas.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#5a6b66]">
                  Nenhuma despesa encontrada.{" "}
                  <button type="button" onClick={openCreate} className="font-semibold text-[#1a4a3a] underline">
                    Cadastrar primeira despesa
                  </button>
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px] text-sm">
                    <thead>
                      <tr className="border-b border-[#e5ece9] text-left text-[#5a6b66]">
                        <th className="py-2">Plataforma</th>
                        <th className="py-2">Categoria</th>
                        <th className="py-2">Periodicidade</th>
                        <th className="py-2">Valor</th>
                        <th className="py-2">Equiv. mensal</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {despesasFiltradas.map((despesa) => {
                        const mensalBrl = toBrl(
                          normalizeValorMensal(despesa.valor, despesa.periodicidade),
                          despesa.moeda,
                          taxaCambio,
                          despesa.taxa_cambio
                        );
                        const ativa = isDespesaAtiva(despesa);
                        return (
                          <tr key={despesa.id} className="border-b border-[#f0f4f3]">
                            <td className="py-2 font-semibold">{despesa.nome_plataforma}</td>
                            <td className="py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  CATEGORIA_CHIP_STYLES[despesa.categoria] || "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {getCategoriaLabel(despesa.categoria)}
                              </span>
                            </td>
                            <td className="py-2">{getPeriodicidadeLabel(despesa.periodicidade)}</td>
                            <td className="py-2">
                              {formatDespesaCurrency(despesa.valor, despesa.moeda)}
                            </td>
                            <td className="py-2">{formatValor(mensalBrl)}</td>
                            <td className="py-2">
                              <span
                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  ativa ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {ativa ? "Ativa" : "Inativa"}
                              </span>
                            </td>
                            <td className="py-2">
                              <div className="flex flex-wrap gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEdit(despesa)}
                                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[#1a4a3a] hover:bg-[#f0f4f3]"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openLancamento(despesa)}
                                  className="rounded-lg px-2 py-1 text-xs font-semibold text-[#1a4a3a] hover:bg-[#f0f4f3]"
                                >
                                  Pagamento
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteTarget(despesa)}
                                  className="rounded-lg px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                >
                                  Excluir
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      <AdminModal
        open={Boolean(modalDespesa)}
        title={modalDespesa === "create" ? "Nova despesa" : "Editar despesa"}
        onClose={() => setModalDespesa(null)}
      >
        <div className="space-y-3">
          <Field label="Plataforma / serviço *">
            <input
              value={form.nome_plataforma}
              onChange={(e) => setForm((f) => ({ ...f, nome_plataforma: e.target.value }))}
              className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Categoria *">
              <select
                value={form.categoria}
                onChange={(e) => setForm((f) => ({ ...f, categoria: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              >
                {CATEGORIA_OPTIONS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Periodicidade *">
              <select
                value={form.periodicidade}
                onChange={(e) => setForm((f) => ({ ...f, periodicidade: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              >
                {PERIODICIDADE_OPTIONS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valor *">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={form.valor}
                onChange={(e) => setForm((f) => ({ ...f, valor: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Moeda *">
              <select
                value={form.moeda}
                onChange={(e) => setForm((f) => ({ ...f, moeda: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              >
                {MOEDA_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Data início *">
              <input
                type="date"
                value={form.data_inicio}
                onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Data fim (cancelamento)">
              <input
                type="date"
                value={form.data_fim}
                onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Dia vencimento (1–28)">
              <input
                type="number"
                min="1"
                max="28"
                value={form.dia_vencimento}
                onChange={(e) => setForm((f) => ({ ...f, dia_vencimento: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Câmbio próprio (USD)">
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.taxa_cambio}
                onChange={(e) => setForm((f) => ({ ...f, taxa_cambio: e.target.value }))}
                placeholder="Usar taxa global"
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="URL referência">
            <input
              type="url"
              value={form.url_referencia}
              onChange={(e) => setForm((f) => ({ ...f, url_referencia: e.target.value }))}
              className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Notas">
            <textarea
              rows={3}
              value={form.notas}
              onChange={(e) => setForm((f) => ({ ...f, notas: e.target.value }))}
              className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
            />
          </Field>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
            />
            Despesa ativa
          </label>

          {formError ? <p className="text-sm text-red-700">{formError}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalDespesa(null)}
              className="rounded-xl border border-[#dce5e2] px-4 py-2 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveDespesa}
              disabled={saving}
              className="rounded-xl bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Salvar
            </button>
          </div>
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(modalLancamento)}
        title={`Pagamento — ${modalLancamento?.nome_plataforma || ""}`}
        onClose={() => setModalLancamento(null)}
      >
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Valor *">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={lancamentoForm.valor}
                onChange={(e) => setLancamentoForm((f) => ({ ...f, valor: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Moeda *">
              <select
                value={lancamentoForm.moeda}
                onChange={(e) => setLancamentoForm((f) => ({ ...f, moeda: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              >
                {MOEDA_OPTIONS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Data pagamento *">
              <input
                type="date"
                value={lancamentoForm.data_pagamento}
                onChange={(e) => setLancamentoForm((f) => ({ ...f, data_pagamento: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              />
            </Field>
            <Field label="Competência (YYYY-MM)">
              <input
                type="month"
                value={lancamentoForm.competencia}
                onChange={(e) => setLancamentoForm((f) => ({ ...f, competencia: e.target.value }))}
                className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Notas">
            <textarea
              rows={2}
              value={lancamentoForm.notas}
              onChange={(e) => setLancamentoForm((f) => ({ ...f, notas: e.target.value }))}
              className="w-full rounded-xl border border-[#dce5e2] px-3 py-2 text-sm"
            />
          </Field>

          {formError ? <p className="text-sm text-red-700">{formError}</p> : null}

          <button
            type="button"
            onClick={handleSaveLancamento}
            disabled={saving}
            className="w-full rounded-xl bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Registrar pagamento
          </button>

          {lancamentosDespesa.length > 0 ? (
            <div className="border-t border-[#e5ece9] pt-3">
              <h3 className="mb-2 text-sm font-bold">Histórico</h3>
              <ul className="space-y-2 text-sm">
                {lancamentosDespesa.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-[#f7faf9] px-3 py-2">
                    <span>
                      {l.data_pagamento} · {formatDespesaCurrency(l.valor, l.moeda)} (
                      {formatValor(calcularValorLancamentoBrl(l, taxaCambio))})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteLancamento(l.id)}
                      className="text-xs font-semibold text-red-700"
                    >
                      Excluir
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </AdminModal>

      <AdminModal
        open={Boolean(deleteTarget)}
        title="Excluir despesa"
        onClose={() => setDeleteTarget(null)}
      >
        <p className="text-sm text-[#5a6b66]">
          Excluir <strong>{deleteTarget?.nome_plataforma}</strong> e todos os lançamentos vinculados?
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className="rounded-xl border border-[#dce5e2] px-4 py-2 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleDeleteDespesa}
            disabled={saving}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            Excluir
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
