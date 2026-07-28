"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import {
  AVALIACAO_STATUS,
  AVALIACAO_STATUS_APROVADOS,
  getFotoAutorAvaliacao,
  getIniciaisAutor,
  getNomeAutorAvaliacao,
  getSentimentoEmoji,
  parseAspectos,
  parseSugestaoIa,
} from "@/lib/avaliacoes";
import { getCategoriaChipClass } from "@/lib/avaliacaoAspectos";
import { registrarLog } from "@/lib/logs";
import { createClient } from "@/lib/supabase";

const TABS = [
  { id: AVALIACAO_STATUS.PENDENTE, label: "Pendentes" },
  { id: AVALIACAO_STATUS.APROVADO, label: "Aprovadas", legacy: "aprovada" },
  { id: AVALIACAO_STATUS.REJEITADO, label: "Rejeitadas", legacy: "rejeitada" },
  {
    id: AVALIACAO_STATUS.AGUARDANDO_EDICAO,
    label: "Aguardando edição",
  },
];

const MOTIVOS_REJEICAO = [
  "Conteúdo inapropriado",
  "Spam ou propaganda",
  "Irrelevante para o lugar",
  "Linguagem ofensiva",
  "Outro",
];

/**
 * @param {number|string} value
 * @returns {import("react").JSX.Element}
 */
function Stars({ value }) {
  const nota = Number(value) || 0;
  return (
    <span className="text-lg">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= nota ? "text-amber-400" : "text-gray-200"}
        >
          ★
        </span>
      ))}
    </span>
  );
}

/**
 * @param {string} [value]
 * @returns {string}
 */
function formatDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * @param {string} [createdAt]
 * @returns {boolean}
 */
function isNovoUsuario(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt);
  const diff = Date.now() - created.getTime();
  return diff < 7 * 24 * 60 * 60 * 1000;
}

/**
 * @param {string|null} tipo
 * @returns {{ label: string, className: string }}
 */
function getSugestaoBadge(tipo) {
  if (tipo === "aprovar") {
    return { label: "✓ Aprovar", className: "bg-emerald-100 text-emerald-800" };
  }
  if (tipo === "rejeitar") {
    return { label: "✗ Rejeitar", className: "bg-red-100 text-red-800" };
  }
  if (tipo === "revisar") {
    return { label: "⚠ Revisar", className: "bg-amber-100 text-amber-800" };
  }
  return { label: "IA", className: "bg-gray-100 text-gray-600" };
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
 * Admin moderation UI for reviews.
 * @returns {import("react").JSX.Element}
 */
const TAB_IDS = new Set(TABS.map((tab) => tab.id));

function AdminAvaliacoesPage() {
  const { loading, user } = useAdminAuth();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const lugarIdFromUrl = searchParams.get("lugar_id");
  const initialTab =
    tabFromUrl && TAB_IDS.has(tabFromUrl) ? tabFromUrl : AVALIACAO_STATUS.PENDENTE;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [avaliacoes, setAvaliacoes] = useState([]);
  const [counts, setCounts] = useState({});
  const [contagemAprovadasPorUsuario, setContagemAprovadasPorUsuario] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [motivoSelect, setMotivoSelect] = useState(MOTIVOS_REJEICAO[0]);
  const [motivoDetalhe, setMotivoDetalhe] = useState("");
  const [instrucaoEdicao, setInstrucaoEdicao] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [lugarFiltroNome, setLugarFiltroNome] = useState("");

  const loadCounts = useCallback(async () => {
    const supabase = createClient();
    const next = {};

    await Promise.all(
      TABS.map(async (tab) => {
        const statuses = tab.legacy ? [tab.id, tab.legacy] : [tab.id];
        const { count } = await supabase
          .from("avaliacoes")
          .select("id", { count: "exact", head: true })
          .in("status", statuses);
        next[tab.id] = count ?? 0;
      })
    );

    setCounts(next);
  }, []);

  const loadContagemAprovadas = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("avaliacoes")
      .select("user_id")
      .in("status", AVALIACAO_STATUS_APROVADOS);

    const map = {};
    for (const row of data ?? []) {
      if (!row.user_id) continue;
      map[row.user_id] = (map[row.user_id] || 0) + 1;
    }
    setContagemAprovadasPorUsuario(map);
  }, []);

  const loadAvaliacoes = useCallback(
    async (status, lugarId) => {
      const supabase = createClient();
      const tab = TABS.find((item) => item.id === status);
      const statuses = tab?.legacy ? [status, tab.legacy] : [status];

      // Sem embed `perfis:user_id` — não há FK no schema cache (PGRST200).
      // Nome/foto: snapshot `autor_nome` / `autor_foto_url`.
      let query = supabase
        .from("avaliacoes")
        .select("*, lugares(nome, categoria)")
        .in("status", statuses);

      if (lugarId) {
        query = query.eq("lugar_id", lugarId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        console.error("[admin/avaliacoes]", error.message);
        setAvaliacoes([]);
        return;
      }

      setAvaliacoes(data ?? []);
    },
    []
  );

  useEffect(() => {
    if (!lugarIdFromUrl) {
      setLugarFiltroNome("");
      return;
    }
    const supabase = createClient();
    supabase
      .from("lugares")
      .select("nome")
      .eq("id", lugarIdFromUrl)
      .maybeSingle()
      .then(({ data }) => setLugarFiltroNome(data?.nome || ""));
  }, [lugarIdFromUrl]);

  useEffect(() => {
    if (tabFromUrl && TAB_IDS.has(tabFromUrl) && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl, activeTab]);

  useEffect(() => {
    if (loading) return;
    loadCounts();
    loadContagemAprovadas();
    loadAvaliacoes(activeTab, lugarIdFromUrl);
  }, [loading, activeTab, lugarIdFromUrl, loadAvaliacoes, loadCounts, loadContagemAprovadas]);

  /**
   * @param {string} id
   * @param {object} payload
   */
  async function salvarModeracao(id, payload) {
    setSalvando(true);
    const supabase = createClient();
    await supabase
      .from("avaliacoes")
      .update({
        ...payload,
        moderado_em: new Date().toISOString(),
      })
      .eq("id", id);

    setSalvando(false);
    setAvaliacoes((items) => items.filter((item) => item.id !== id));
    loadCounts();
    loadContagemAprovadas();
  }

  /**
   * @param {string} id
   */
  async function aprovar(id) {
    await salvarModeracao(id, { status: AVALIACAO_STATUS.APROVADO });
  }

  /**
   * @param {string} id
   */
  async function confirmarRejeicao(id) {
    const motivo = motivoDetalhe.trim()
      ? `${motivoSelect}: ${motivoDetalhe.trim()}`
      : motivoSelect;

    await salvarModeracao(id, {
      status: AVALIACAO_STATUS.REJEITADO,
      motivo_rejeicao: motivo,
    });
    setRejectModal(null);
    setMotivoSelect(MOTIVOS_REJEICAO[0]);
    setMotivoDetalhe("");
  }

  /**
   * @param {string} id
   */
  async function confirmarEdicao(id) {
    if (!instrucaoEdicao.trim()) return;

    await salvarModeracao(id, {
      status: AVALIACAO_STATUS.AGUARDANDO_EDICAO,
      motivo_rejeicao: instrucaoEdicao.trim(),
    });
    setEditModal(null);
    setInstrucaoEdicao("");
  }

  /**
   * @param {object} avaliacao
   */
  async function confirmarExclusao(avaliacao) {
    setSalvando(true);
    setDeleteError("");

    const supabase = createClient();
    const { error } = await supabase
      .from("avaliacoes")
      .delete()
      .eq("id", avaliacao.id);

    if (error) {
      setSalvando(false);
      setDeleteError(
        error.message.includes("policy")
          ? "Sem permissão para excluir. Aplique a migração avaliacoes_admin_delete no Supabase."
          : "Não foi possível excluir a avaliação. Tente novamente."
      );
      return;
    }

    if (user) {
      await registrarLog(supabase, user, "admin_excluiu_avaliacao", {
        avaliacao_id: avaliacao.id,
        lugar_nome: avaliacao.lugares?.nome || null,
        autor_nome: getNomeAutorAvaliacao(avaliacao),
        status: avaliacao.status,
      });
    }

    setSalvando(false);
    setDeleteModal(null);
    setDeleteError("");
    setAvaliacoes((items) => items.filter((item) => item.id !== avaliacao.id));
    loadCounts();
    loadContagemAprovadas();
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell title="Avaliações">
      {lugarIdFromUrl && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#eef8f4] px-4 py-3 text-sm text-[#1a2e28]">
          <p>
            Filtrando avaliações de{" "}
            <strong>{lugarFiltroNome || "estabelecimento"}</strong>
            {activeTab === AVALIACAO_STATUS.APROVADO
              ? " — curadoria trimestral"
              : ""}
          </p>
          <Link
            href="/admin/avaliacoes"
            className="text-xs font-semibold text-[#1a4a3a] hover:underline"
          >
            Limpar filtro
          </Link>
        </div>
      )}
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              activeTab === tab.id
                ? "bg-[#1a4a3a] text-white"
                : "bg-white text-[#1a4a3a] shadow-sm"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id
                  ? "bg-white/20 text-white"
                  : "bg-[#f0f4f3] text-[#5a6b66]"
              }`}
            >
              {counts[tab.id] ?? 0}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {avaliacoes.length === 0 ? (
          <p className="rounded-2xl bg-white p-5 text-sm text-[#5a6b66] shadow-sm">
            Nenhuma avaliação nessa aba.
          </p>
        ) : (
          avaliacoes.map((avaliacao) => {
            const nome = getNomeAutorAvaliacao(avaliacao);
            const fotoUrl = getFotoAutorAvaliacao(avaliacao);
            const perfilCreated = avaliacao.perfis?.created_at;
            const aprovadasUsuario =
              contagemAprovadasPorUsuario[avaliacao.user_id] || 0;
            const aspectos = parseAspectos(avaliacao.aspectos);
            const { tipo, motivo } = parseSugestaoIa(avaliacao.sugestao_ia);
            const sugestaoBadge = getSugestaoBadge(tipo);
            const categoria = avaliacao.lugares?.categoria;

            return (
              <article
                key={avaliacao.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[#e8eeee]/80"
              >
                <div className="flex flex-wrap items-start gap-3">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt=""
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#d4ede8] text-sm font-bold text-[#1a4a3a]">
                      {getIniciaisAutor(nome)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-[#1a2e28]">{nome}</p>
                      {isNovoUsuario(perfilCreated) && (
                        <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-semibold text-sky-800">
                          Novo usuário
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#9aa8a3]">
                      Cadastro: {formatDate(perfilCreated)} ·{" "}
                      {aprovadasUsuario}{" "}
                      {aprovadasUsuario === 1 ? "avaliação" : "avaliações"}
                    </p>
                  </div>
                  <p className="text-xs text-[#9aa8a3]">
                    {formatDate(avaliacao.created_at)}
                  </p>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-[#1a2e28]">
                    {avaliacao.lugares?.nome || "Lugar"}
                  </p>
                  {categoria && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${getCategoriaChipClass(categoria)}`}
                    >
                      {categoria}
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <Stars value={avaliacao.nota} />
                  {aspectos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {aspectos.map((aspecto) => (
                        <span
                          key={aspecto}
                          className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                        >
                          {aspecto}
                        </span>
                      ))}
                    </div>
                  )}
                  <p className="mt-2 text-sm leading-relaxed text-[#5a6b66]">
                    {avaliacao.comentario || "Sem comentário"}
                  </p>
                </div>

                {avaliacao.sugestao_ia && (
                  <div className="mt-4 rounded-xl bg-[#f0f4f3] p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${sugestaoBadge.className}`}
                      >
                        {sugestaoBadge.label}
                      </span>
                      <span className="text-base" title={avaliacao.sentimento || ""}>
                        {getSentimentoEmoji(avaliacao.sentimento)}
                      </span>
                    </div>
                    {motivo && (
                      <p className="mt-1.5 text-xs text-[#5a6b66]">{motivo}</p>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {(activeTab === AVALIACAO_STATUS.PENDENTE ||
                    activeTab === AVALIACAO_STATUS.AGUARDANDO_EDICAO) && (
                    <>
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => aprovar(avaliacao.id)}
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Aprovar
                      </button>
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => {
                          setRejectModal(avaliacao);
                          setMotivoSelect(MOTIVOS_REJEICAO[0]);
                          setMotivoDetalhe("");
                        }}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Rejeitar
                      </button>
                      <button
                        type="button"
                        disabled={salvando}
                        onClick={() => {
                          setEditModal(avaliacao);
                          setInstrucaoEdicao("");
                        }}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        Solicitar edição
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    disabled={salvando}
                    onClick={() => {
                      setDeleteModal(avaliacao);
                      setDeleteError("");
                    }}
                    className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-60"
                  >
                    Excluir comentário
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>

      <AdminModal
        isOpen={Boolean(rejectModal)}
        title="Motivo da rejeição"
        onClose={() => setRejectModal(null)}
      >
        <label className="block text-sm font-medium text-[#1a2e28]">
          Motivo
          <select
            value={motivoSelect}
            onChange={(event) => setMotivoSelect(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e8eeee] bg-white px-3 py-2 text-sm"
          >
            {MOTIVOS_REJEICAO.map((motivo) => (
              <option key={motivo} value={motivo}>
                {motivo}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-3 block text-sm font-medium text-[#1a2e28]">
          Detalhes (opcional)
          <textarea
            value={motivoDetalhe}
            onChange={(event) => setMotivoDetalhe(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-[#e8eeee] bg-white px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={salvando}
          onClick={() => rejectModal && confirmarRejeicao(rejectModal.id)}
          className="mt-4 w-full rounded-xl bg-red-600 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          Confirmar rejeição
        </button>
      </AdminModal>

      <AdminModal
        isOpen={Boolean(editModal)}
        title="Solicitar edição ao usuário"
        onClose={() => setEditModal(null)}
      >
        <textarea
          value={instrucaoEdicao}
          onChange={(event) => setInstrucaoEdicao(event.target.value)}
          placeholder="Ex: Seu comentário está muito vago. Pode descrever melhor sua experiência?"
          rows={4}
          className="w-full rounded-xl border border-[#e8eeee] bg-white px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={salvando || !instrucaoEdicao.trim()}
          onClick={() => editModal && confirmarEdicao(editModal.id)}
          className="mt-4 w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          Enviar solicitação
        </button>
      </AdminModal>

      <AdminModal
        isOpen={Boolean(deleteModal)}
        title="Excluir comentário permanentemente"
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
              Você está prestes a excluir a avaliação de{" "}
              <strong>{getNomeAutorAvaliacao(deleteModal)}</strong> em{" "}
              <strong>{deleteModal.lugares?.nome || "um lugar"}</strong>.
            </p>
            <p className="mt-2 text-xs text-[#9aa8a3]">
              Esta ação não pode ser desfeita. O comentário deixará de aparecer no
              app e nas estatísticas do estabelecimento.
            </p>
            {deleteModal.comentario && (
              <blockquote className="mt-3 rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm italic text-[#5a6b66]">
                “{deleteModal.comentario}”
              </blockquote>
            )}
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

export default function AdminAvaliacoesPageWithSuspense() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
          Carregando admin...
        </div>
      }
    >
      <AdminAvaliacoesPage />
    </Suspense>
  );
}
