"use client";

import Link from "next/link";
import { Fragment } from "react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import ContratoDocumentosSection from "@/components/admin/ContratoDocumentosSection";
import { canAccessDevAdmin } from "@/lib/adminRoles";
import {
  CONTRATO_FILTROS,
  CONTRATO_STATUS,
  CONTRATO_STATUS_OPTIONS,
  CONTRATO_TIPO,
  CONTRATO_TIPO_OPTIONS,
  buildContratoPayload,
  calcularResumoContratos,
  contratoMatchesFiltro,
  contratoTemDocumentoAssinado,
  encerrarContratoComercial,
  fetchContratosAdmin,
  fetchContratosTablesReady,
  fetchDocumentosByContratoIds,
  fetchLugaresParaContrato,
  formatContratoValorMensal,
  getContratoStatusLabel,
  getContratoTipoLabel,
  getDiasRestantesContratoGratis,
  syncParceiroFromContrato,
} from "@/lib/contratoAdmin";
import { hojeISO } from "@/lib/homeRotation";
import { PLANO_COMERCIAL_PRECO } from "@/lib/planoComercial";
import { formatDiasRestantesParceiro } from "@/lib/parceiroAdmin";
import { createClient } from "@/lib/supabase";

const EMPTY_FORM = {
  lugar_id: "",
  tipo: CONTRATO_TIPO.LANCAMENTO_6_MESES,
  status: CONTRATO_STATUS.RASCUNHO,
  ativo: false,
  numero_proposta: "",
  valor_mensal: String(PLANO_COMERCIAL_PRECO),
  data_proposta: "",
  data_assinatura: "",
  data_inicio: hojeISO(),
  data_fim: "",
  data_conversao_pago: "",
  asaas_customer_id: "",
  asaas_subscription_id: "",
  asaas_link_cobranca: "",
  contato_nome: "",
  contato_email: "",
  contato_whatsapp: "",
  cnpj: "",
  razao_social: "",
  notas_internas: "",
};

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
 * @param {boolean} props.open
 * @param {string} props.title
 * @param {() => void} props.onClose
 * @param {import("react").ReactNode} props.children
 */
function AdminModal({ open, title, onClose, children }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        className="fixed inset-x-4 top-[5%] z-50 mx-auto max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl md:inset-x-auto md:left-1/2 md:w-full md:-translate-x-1/2"
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
 * Painel de contratos comerciais — somente dev.
 * @returns {import("react").JSX.Element}
 */
export default function ContratosAdminPage() {
  const searchParams = useSearchParams();
  const { loading, user, perfil } = useAdminAuth();
  const hoje = hojeISO();

  const filtroInicial = CONTRATO_FILTROS.some((item) => item.id === searchParams.get("filtro"))
    ? searchParams.get("filtro")
    : "todos";

  const [tablesReady, setTablesReady] = useState(true);
  const [contratos, setContratos] = useState([]);
  const [lugares, setLugares] = useState([]);
  const [docsByContrato, setDocsByContrato] = useState({});
  const [filtro, setFiltro] = useState(filtroInicial);
  const [busyId, setBusyId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [expandedId, setExpandedId] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();
    const ready = await fetchContratosTablesReady(supabase);
    setTablesReady(ready);
    if (!ready) {
      setContratos([]);
      setDocsByContrato({});
      return;
    }

    const [items, lugaresList] = await Promise.all([
      fetchContratosAdmin(supabase),
      fetchLugaresParaContrato(supabase),
    ]);

    setContratos(items);
    setLugares(lugaresList);

    const ids = items.map((item) => item.id);
    const docsMap = await fetchDocumentosByContratoIds(supabase, ids);
    setDocsByContrato(docsMap);
  }, []);

  useEffect(() => {
    if (loading || !canAccessDevAdmin(perfil?.role)) return undefined;
    loadData();
  }, [loading, perfil, loadData]);

  const resumo = useMemo(
    () => calcularResumoContratos(contratos, docsByContrato, hoje),
    [contratos, docsByContrato, hoje]
  );

  const filtered = useMemo(() => {
    return contratos.filter((contrato) =>
      contratoMatchesFiltro(contrato, filtro, docsByContrato[contrato.id] || [], hoje)
    );
  }, [contratos, filtro, docsByContrato, hoje]);

  const lugaresParaSelect = useMemo(() => {
    if (!editingId) return lugares;

    const editing = contratos.find((item) => item.id === editingId);
    const lugarAtual = editing?.lugares;
    if (!lugarAtual || lugares.some((item) => item.id === lugarAtual.id)) {
      return lugares;
    }

    return [...lugares, lugarAtual];
  }, [lugares, editingId, contratos]);

  /**
   * @param {object|null} contrato
   */
  function openModal(contrato = null) {
    if (contrato) {
      setEditingId(contrato.id);
      setForm({
        lugar_id: contrato.lugar_id,
        tipo: contrato.tipo,
        status: contrato.status,
        ativo: Boolean(contrato.ativo),
        numero_proposta: contrato.numero_proposta || "",
        valor_mensal:
          contrato.valor_mensal != null ? String(contrato.valor_mensal) : String(PLANO_COMERCIAL_PRECO),
        data_proposta: contrato.data_proposta || "",
        data_assinatura: contrato.data_assinatura || "",
        data_inicio: contrato.data_inicio || hoje,
        data_fim: contrato.data_fim || "",
        data_conversao_pago: contrato.data_conversao_pago || "",
        asaas_customer_id: contrato.asaas_customer_id || "",
        asaas_subscription_id: contrato.asaas_subscription_id || "",
        asaas_link_cobranca: contrato.asaas_link_cobranca || "",
        contato_nome: contrato.contato_nome || "",
        contato_email: contrato.contato_email || "",
        contato_whatsapp: contrato.contato_whatsapp || "",
        cnpj: contrato.cnpj || "",
        razao_social: contrato.razao_social || "",
        notas_internas: contrato.notas_internas || "",
      });
    } else {
      setEditingId(null);
      setForm({ ...EMPTY_FORM, data_inicio: hoje });
    }
    setModalOpen(true);
  }

  /**
   * @returns {Promise<void>}
   */
  async function handleSave() {
    if (!form.lugar_id) {
      window.alert("Selecione um estabelecimento.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const payload = buildContratoPayload(form, hoje);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("contratos_comerciais")
          .update(payload)
          .eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("contratos_comerciais").insert({
          ...payload,
          created_by: user?.id || null,
        });
        if (error) throw error;
      }

      setModalOpen(false);
      await loadData();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  /**
   * @param {string} contratoId
   * @returns {Promise<void>}
   */
  async function handleSyncParceiro(contratoId) {
    setBusyId(contratoId);
    const supabase = createClient();
    const result = await syncParceiroFromContrato(supabase, contratoId, user?.id);
    setBusyId(null);
    if (!result.ok) {
      window.alert(result.message || "Não foi possível ativar no app.");
      return;
    }
    await loadData();
  }

  /**
   * @param {string} contratoId
   * @returns {Promise<void>}
   */
  async function handleEncerrar(contratoId) {
    if (!window.confirm("Encerrar este contrato e desativar parceiro no app?")) return;

    setBusyId(contratoId);
    const supabase = createClient();
    const result = await encerrarContratoComercial(supabase, contratoId);
    setBusyId(null);
    if (!result.ok) {
      window.alert(result.message || "Não foi possível encerrar.");
      return;
    }
    await loadData();
  }

  /**
   * @param {string} contratoId
   * @returns {Promise<void>}
   */
  async function handleConverterPago(contratoId) {
    if (!window.confirm("Converter contrato para plano pago (R$ 299/mês)?")) return;

    setBusyId(contratoId);
    const supabase = createClient();
    const { error } = await supabase
      .from("contratos_comerciais")
      .update({
        tipo: CONTRATO_TIPO.PARCEIRO_PAGO,
        status: CONTRATO_STATUS.ATIVO,
        valor_mensal: PLANO_COMERCIAL_PRECO,
        data_conversao_pago: hoje,
        data_fim: null,
        ativo: true,
      })
      .eq("id", contratoId);

    setBusyId(null);
    if (error) {
      window.alert(error.message);
      return;
    }

    await syncParceiroFromContrato(supabase, contratoId, user?.id);
    await loadData();
  }

  if (loading || !canAccessDevAdmin(perfil?.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell
      title="Contratos"
      headerAction={
        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex items-center gap-2 rounded-xl bg-[#1a4a3a] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1a4a3a]/25 transition hover:bg-[#153d31]"
        >
          <span className="text-lg leading-none">+</span>
          Novo contrato
        </button>
      }
    >
      <div className="space-y-6 px-4 pb-8 md:px-6 lg:px-8">
        <p className="text-sm text-[#5a6b66]">
          Controle comercial — propostas, assinaturas, valores, Asaas (referência manual) e
          documentos. Use{" "}
          <Link href="/admin/parceiros" className="font-semibold text-[#1a4a3a] underline">
            Parceiros
          </Link>{" "}
          para curadoria e prazos operacionais.
        </p>

        {!tablesReady && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Rode{" "}
            <code className="rounded bg-white px-1 py-0.5 text-xs">
              supabase/contratos_comerciais.sql
            </code>{" "}
            no SQL Editor do Supabase.
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {[
            { label: "Ativos", value: resumo.ativos },
            { label: "6 meses grátis", value: resumo.gratis },
            { label: "Pagos", value: resumo.pagos },
            { label: "Grátis vencendo", value: resumo.vencendo, accent: "text-amber-700" },
            { label: "Sem PDF assinado", value: resumo.semDoc, accent: "text-amber-700" },
            { label: "Inadimplentes", value: resumo.inadimplentes, accent: "text-red-600" },
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
          {CONTRATO_FILTROS.map((item) => (
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
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Período</th>
                  <th className="px-4 py-3">Docs</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef3f1]">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center">
                      <p className="text-[#5a6b66]">Nenhum contrato neste filtro.</p>
                      <button
                        type="button"
                        onClick={() => openModal()}
                        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#1a4a3a] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1a4a3a]/25 transition hover:bg-[#153d31]"
                      >
                        <span className="text-lg leading-none">+</span>
                        Novo contrato
                      </button>
                    </td>
                  </tr>
                ) : (
                  filtered.map((contrato) => {
                    const lugar = contrato.lugares;
                    const docs = docsByContrato[contrato.id] || [];
                    const temAssinado = contratoTemDocumentoAssinado(contrato, docs);
                    const diasGratis = getDiasRestantesContratoGratis(contrato, hoje);
                    const isBusy = busyId === contrato.id;
                    const expanded = expandedId === contrato.id;

                    return (
                      <Fragment key={contrato.id}>
                        <tr className="align-top">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-[#1a2e28]">
                              {lugar?.nome || "—"}
                            </p>
                            {contrato.numero_proposta ? (
                              <p className="text-xs text-[#5a6b66]">
                                Proposta {contrato.numero_proposta}
                              </p>
                            ) : null}
                            {!temAssinado && contrato.ativo ? (
                              <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                                Sem contrato assinado
                              </span>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-[#5a6b66]">
                            {getContratoTipoLabel(contrato.tipo)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                                contrato.ativo
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {getContratoStatusLabel(contrato.status)}
                              {contrato.ativo ? " · ativo" : ""}
                            </span>
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {formatContratoValorMensal(contrato.valor_mensal)}
                          </td>
                          <td className="px-4 py-3 text-xs text-[#5a6b66]">
                            {formatDataBR(contrato.data_inicio)}
                            {contrato.data_fim ? ` → ${formatDataBR(contrato.data_fim)}` : ""}
                            {diasGratis !== null && contrato.tipo === CONTRATO_TIPO.LANCAMENTO_6_MESES ? (
                              <p className="mt-0.5 font-medium text-[#1a4a3a]">
                                {formatDiasRestantesParceiro(diasGratis)}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-[#5a6b66]">{docs.length}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => setExpandedId(expanded ? null : contrato.id)}
                                className="rounded-lg border border-[#dce5e2] px-2.5 py-1 text-xs font-semibold"
                              >
                                {expanded ? "Fechar" : "Detalhes"}
                              </button>
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => openModal(contrato)}
                                className="rounded-lg border border-[#1a4a3a] px-2.5 py-1 text-xs font-semibold text-[#1a4a3a]"
                              >
                                Editar
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expanded ? (
                          <tr>
                            <td colSpan={7} className="bg-[#f7faf9] px-4 py-4">
                              <div className="grid gap-4 lg:grid-cols-2">
                                <div className="space-y-3 text-sm">
                                  <p>
                                    <span className="font-semibold">Contato:</span>{" "}
                                    {contrato.contato_nome || "—"}
                                    {contrato.contato_whatsapp
                                      ? ` · ${contrato.contato_whatsapp}`
                                      : ""}
                                  </p>
                                  <p>
                                    <span className="font-semibold">CNPJ:</span>{" "}
                                    {contrato.cnpj || "—"}
                                  </p>
                                  <p>
                                    <span className="font-semibold">Razão social:</span>{" "}
                                    {contrato.razao_social || "—"}
                                  </p>
                                  {contrato.asaas_link_cobranca ? (
                                    <p>
                                      <span className="font-semibold">Asaas:</span>{" "}
                                      <a
                                        href={contrato.asaas_link_cobranca}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="break-all font-medium text-[#1a4a3a] underline"
                                      >
                                        Abrir cobrança
                                      </a>
                                    </p>
                                  ) : (
                                    <p className="text-[#5a6b66]">Asaas: link não informado</p>
                                  )}
                                  {contrato.notas_internas ? (
                                    <p className="whitespace-pre-wrap rounded-xl bg-white p-3 text-[#5a6b66]">
                                      {contrato.notas_internas}
                                    </p>
                                  ) : null}
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleSyncParceiro(contrato.id)}
                                      className="rounded-xl bg-[#1a4a3a] px-3 py-2 text-xs font-semibold text-white"
                                    >
                                      Ativar parceiro no app
                                    </button>
                                    {contrato.tipo === CONTRATO_TIPO.LANCAMENTO_6_MESES ? (
                                      <button
                                        type="button"
                                        disabled={isBusy}
                                        onClick={() => handleConverterPago(contrato.id)}
                                        className="rounded-xl border border-[#1a4a3a] px-3 py-2 text-xs font-semibold text-[#1a4a3a]"
                                      >
                                        Converter para pago
                                      </button>
                                    ) : null}
                                    <button
                                      type="button"
                                      disabled={isBusy}
                                      onClick={() => handleEncerrar(contrato.id)}
                                      className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                                    >
                                      Encerrar
                                    </button>
                                    {lugar?.id ? (
                                      <Link
                                        href={`/admin/locais/${lugar.id}/editar`}
                                        className="rounded-xl border border-[#dce5e2] px-3 py-2 text-xs font-semibold text-[#5a6b66]"
                                      >
                                        Editar local
                                      </Link>
                                    ) : null}
                                  </div>
                                </div>
                                <ContratoDocumentosSection
                                  contratoId={contrato.id}
                                  documentos={docs}
                                  onChange={loadData}
                                />
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <AdminModal
        open={modalOpen}
        title={editingId ? "Editar contrato" : "Novo contrato"}
        onClose={() => setModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase text-[#5a6b66]">
              Estabelecimento (parceiro ativo)
            </label>
            <select
              value={form.lugar_id}
              onChange={(event) => setForm({ ...form, lugar_id: event.target.value })}
              className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
            >
              <option value="">Selecione…</option>
              {lugaresParaSelect.map((lugar) => (
                <option key={lugar.id} value={lugar.id}>
                  {lugar.nome} ({lugar.categoria})
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-[#5a6b66]">Tipo</label>
              <select
                value={form.tipo}
                onChange={(event) => setForm({ ...form, tipo: event.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
              >
                {CONTRATO_TIPO_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-[#5a6b66]">Status</label>
              <select
                value={form.status}
                onChange={(event) => setForm({ ...form, status: event.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
              >
                {CONTRATO_STATUS_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-[#5a6b66]">
                Nº proposta
              </label>
              <input
                value={form.numero_proposta}
                onChange={(event) => setForm({ ...form, numero_proposta: event.target.value })}
                placeholder="003/2026"
                className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
              />
            </div>
            {form.tipo === CONTRATO_TIPO.PARCEIRO_PAGO ? (
              <div>
                <label className="text-xs font-semibold uppercase text-[#5a6b66]">
                  Valor mensal (R$)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.valor_mensal}
                  onChange={(event) => setForm({ ...form, valor_mensal: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-[#5a6b66]">Início</label>
              <input
                type="date"
                value={form.data_inicio}
                onChange={(event) => setForm({ ...form, data_inicio: event.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
              />
            </div>
            {form.tipo === CONTRATO_TIPO.LANCAMENTO_6_MESES ? (
              <div>
                <label className="text-xs font-semibold uppercase text-[#5a6b66]">
                  Fim (grátis)
                </label>
                <input
                  type="date"
                  value={form.data_fim}
                  onChange={(event) => setForm({ ...form, data_fim: event.target.value })}
                  className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
                />
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-[#5a6b66]">
                Contato
              </label>
              <input
                value={form.contato_nome}
                onChange={(event) => setForm({ ...form, contato_nome: event.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-[#5a6b66]">
                WhatsApp
              </label>
              <input
                value={form.contato_whatsapp}
                onChange={(event) => setForm({ ...form, contato_whatsapp: event.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-semibold uppercase text-[#5a6b66]">CNPJ</label>
              <input
                value={form.cnpj}
                onChange={(event) => setForm({ ...form, cnpj: event.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-[#5a6b66]">
                Razão social
              </label>
              <input
                value={form.razao_social}
                onChange={(event) => setForm({ ...form, razao_social: event.target.value })}
                className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-[#5a6b66]">
              Link cobrança Asaas
            </label>
            <input
              value={form.asaas_link_cobranca}
              onChange={(event) =>
                setForm({ ...form, asaas_link_cobranca: event.target.value })
              }
              placeholder="https://…"
              className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-[#5a6b66]">
              Notas internas
            </label>
            <textarea
              rows={3}
              value={form.notas_internas}
              onChange={(event) => setForm({ ...form, notas_internas: event.target.value })}
              className="mt-1 w-full rounded-xl border border-[#e3e9e6] px-3 py-2.5 text-sm"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(form.ativo)}
              onChange={(event) => setForm({ ...form, ativo: event.target.checked })}
            />
            Marcar como contrato ativo deste estabelecimento
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-xl border border-[#dce5e2] px-4 py-2.5 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="rounded-xl bg-[#1a4a3a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Salvando…" : "Salvar contrato"}
            </button>
          </div>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
