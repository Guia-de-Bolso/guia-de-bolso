"use client";

import { useCallback, useEffect, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import {
  FEEDBACK_STATUS,
  FEEDBACK_STATUS_TABS,
  FEEDBACK_TIPOS,
  getFeedbackStatusLabel,
  getFeedbackTipoLabel,
} from "@/lib/feedback";
import { registrarLog } from "@/lib/logs";
import { createClient } from "@/lib/supabase";

/**
 * @param {string} [iso]
 * @returns {string}
 */
function formatDate(iso) {
  if (!iso) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(iso));
}

/**
 * @param {string} status
 * @returns {string}
 */
function statusBadgeClass(status) {
  if (status === FEEDBACK_STATUS.NOVO) return "bg-blue-100 text-blue-800";
  if (status === FEEDBACK_STATUS.EM_ANALISE) return "bg-amber-100 text-amber-800";
  if (status === FEEDBACK_STATUS.RESPONDIDO) return "bg-emerald-100 text-emerald-800";
  return "bg-gray-100 text-gray-600";
}

/**
 * @param {object} props
 * @returns {import("react").JSX.Element|null}
 */
function AdminModal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-lg font-bold text-[#1a2e28]">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

/**
 * @param {object} item
 * @returns {string}
 */
function getFeedbackAutorLabel(item) {
  return item.nome_contato?.trim() || (item.user_id ? "Usuário logado" : "Visitante");
}

/**
 * Admin — listagem e moderação de feedback.
 * @returns {import("react").JSX.Element}
 */
export default function AdminFeedbackPage() {
  const { loading: authLoading, user } = useAdminAuth();
  const [activeStatus, setActiveStatus] = useState(FEEDBACK_STATUS.NOVO);
  const [tipoFiltro, setTipoFiltro] = useState("");
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [notasDraft, setNotasDraft] = useState({});
  const [salvando, setSalvando] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  const loadCounts = useCallback(async () => {
    const supabase = createClient();
    const next = {};

    await Promise.all(
      FEEDBACK_STATUS_TABS.map(async (tab) => {
        const { count } = await supabase
          .from("feedback")
          .select("id", { count: "exact", head: true })
          .eq("status", tab.id);
        next[tab.id] = count ?? 0;
      })
    );

    setCounts(next);
  }, []);

  const loadItems = useCallback(async () => {
    const supabase = createClient();
    let query = supabase
      .from("feedback")
      .select("*")
      .eq("status", activeStatus)
      .order("created_at", { ascending: false })
      .limit(100);

    if (tipoFiltro) {
      query = query.eq("tipo", tipoFiltro);
    }

    const { data, error } = await query;

    if (!error) {
      setItems(data ?? []);
      const drafts = {};
      for (const row of data ?? []) {
        drafts[row.id] = row.admin_notas ?? "";
      }
      setNotasDraft(drafts);
    }
  }, [activeStatus, tipoFiltro]);

  useEffect(() => {
    if (authLoading) return;
    loadCounts();
    loadItems();
  }, [authLoading, loadCounts, loadItems]);

  /**
   * @param {string} id
   * @param {object} payload
   */
  async function atualizarFeedback(id, payload) {
    setSalvando(true);
    const supabase = createClient();
    await supabase
      .from("feedback")
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    setSalvando(false);
    await loadCounts();
    await loadItems();
  }

  /**
   * @param {string} id
   * @param {string} status
   */
  async function mudarStatus(id, status) {
    await atualizarFeedback(id, { status });
    if (status === FEEDBACK_STATUS.ARQUIVADO) {
      setExpandedId(null);
    }
  }

  /**
   * @param {string} id
   */
  async function salvarNotas(id) {
    await atualizarFeedback(id, { admin_notas: notasDraft[id] ?? "" });
  }

  /**
   * @param {object} item
   */
  async function confirmarExclusao(item) {
    setSalvando(true);
    setDeleteError("");

    const supabase = createClient();
    const { error } = await supabase.from("feedback").delete().eq("id", item.id);

    if (error) {
      setSalvando(false);
      setDeleteError(
        error.message.includes("policy")
          ? "Sem permissão para excluir. Aplique a migração admin_delete_logs_feedback no Supabase."
          : "Não foi possível excluir o feedback. Tente novamente."
      );
      return;
    }

    if (user) {
      await registrarLog(supabase, user, "admin_excluiu_feedback", {
        feedback_id: item.id,
        autor_nome: getFeedbackAutorLabel(item),
        tipo: item.tipo,
        status: item.status,
      });
    }

    setSalvando(false);
    setDeleteModal(null);
    setDeleteError("");
    if (expandedId === item.id) setExpandedId(null);
    await loadCounts();
    await loadItems();
  }

  return (
    <AdminShell title="Feedback" subtitle="Sugestões e reportes dos usuários">
      <div className="mb-6 flex flex-wrap gap-2">
        {FEEDBACK_STATUS_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveStatus(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeStatus === tab.id
                ? "bg-[#1a4a3a] text-white"
                : "bg-white text-[#5a6b66] ring-1 ring-[#e8eeee]"
            }`}
          >
            {tab.label} ({counts[tab.id] ?? 0})
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTipoFiltro("")}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
            !tipoFiltro ? "bg-[#1a4a3a] text-white" : "bg-white ring-1 ring-[#e8eeee]"
          }`}
        >
          Todos os tipos
        </button>
        {FEEDBACK_TIPOS.map((tipo) => (
          <button
            key={tipo.id}
            type="button"
            onClick={() => setTipoFiltro(tipo.id)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              tipoFiltro === tipo.id
                ? "bg-[#1a4a3a] text-white"
                : "bg-white text-[#5a6b66] ring-1 ring-[#e8eeee]"
            }`}
          >
            {tipo.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#5a6b66] shadow-sm">
          Nenhum feedback neste filtro.
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => {
            const expanded = expandedId === item.id;
            const autor = getFeedbackAutorLabel(item);
            const contato = item.email_contato?.trim();

            return (
              <li
                key={item.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e8eeee]"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.id)}
                  className="flex w-full flex-col gap-2 px-4 py-4 text-left sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass(item.status)}`}
                      >
                        {getFeedbackStatusLabel(item.status)}
                      </span>
                      <span className="rounded-full bg-[#f0f4f3] px-2.5 py-0.5 text-[11px] font-semibold text-[#1a4a3a]">
                        {getFeedbackTipoLabel(item.tipo)}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-[#1a2e28]">
                      {item.assunto ? `${item.assunto} — ` : ""}
                      {item.mensagem}
                    </p>
                    <p className="mt-1 text-xs text-[#5a6b66]">
                      {autor}
                      {contato ? ` · ${contato}` : ""}
                      {item.pagina_origem ? ` · ${item.pagina_origem}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="text-xs text-[#9aa8a3]">
                      {formatDate(item.created_at)}
                    </span>
                    <button
                      type="button"
                      disabled={salvando}
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteModal(item);
                        setDeleteError("");
                      }}
                      className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-[11px] font-semibold text-red-700 disabled:opacity-60"
                    >
                      Excluir
                    </button>
                  </div>
                </button>

                {expanded && (
                  <div className="border-t border-[#f0f4f3] px-4 py-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1a2e28]">
                      {item.mensagem}
                    </p>

                    {item.contexto_tecnico ? (
                      <pre className="mt-4 max-h-40 overflow-auto rounded-xl bg-[#f0f4f3] p-3 text-[10px] text-[#5a6b66]">
                        {JSON.stringify(item.contexto_tecnico, null, 2)}
                      </pre>
                    ) : null}

                    <label className="mt-4 block">
                      <span className="text-xs font-bold uppercase text-[#5a6b66]">
                        Notas internas
                      </span>
                      <textarea
                        rows={3}
                        value={notasDraft[item.id] ?? ""}
                        onChange={(e) =>
                          setNotasDraft((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        className="mt-1.5 w-full rounded-xl border border-[#e3ebe7] px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/25"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => salvarNotas(item.id)}
                        className="rounded-xl bg-[#1a4a3a] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        Salvar notas
                      </button>
                      {item.status === FEEDBACK_STATUS.NOVO && (
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => mudarStatus(item.id, FEEDBACK_STATUS.EM_ANALISE)}
                          className="rounded-xl bg-amber-100 px-4 py-2 text-xs font-semibold text-amber-900"
                        >
                          Em análise
                        </button>
                      )}
                      {item.status !== FEEDBACK_STATUS.RESPONDIDO && (
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => mudarStatus(item.id, FEEDBACK_STATUS.RESPONDIDO)}
                          className="rounded-xl bg-emerald-100 px-4 py-2 text-xs font-semibold text-emerald-900"
                        >
                          Respondido
                        </button>
                      )}
                      {item.status !== FEEDBACK_STATUS.ARQUIVADO && (
                        <button
                          type="button"
                          disabled={salvando}
                          onClick={() => mudarStatus(item.id, FEEDBACK_STATUS.ARQUIVADO)}
                          className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700"
                        >
                          Arquivar
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <AdminModal
        isOpen={Boolean(deleteModal)}
        title="Excluir feedback permanentemente"
        onClose={() => {
          if (!salvando) {
            setDeleteModal(null);
            setDeleteError("");
          }
        }}
      >
        {deleteModal && (
          <>
            <p className="text-sm leading-relaxed text-[#5a6b66]">
              Você está prestes a excluir o feedback de{" "}
              <strong>{getFeedbackAutorLabel(deleteModal)}</strong> (
              {getFeedbackTipoLabel(deleteModal.tipo)}).
            </p>
            <p className="mt-2 text-xs text-[#9aa8a3]">
              Esta ação não pode ser desfeita.
            </p>
            <blockquote className="mt-3 rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm italic text-[#5a6b66]">
              “{deleteModal.mensagem}”
            </blockquote>
            {deleteError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-[#b42318]">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={salvando}
                onClick={() => {
                  setDeleteModal(null);
                  setDeleteError("");
                }}
                className="flex-1 rounded-xl bg-[#f0f4f3] py-2.5 text-sm font-semibold text-[#1a2e28] disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={() => confirmarExclusao(deleteModal)}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {salvando ? "Excluindo…" : "Excluir permanentemente"}
              </button>
            </div>
          </>
        )}
      </AdminModal>
    </AdminShell>
  );
}
