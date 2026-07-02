"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import {
  LOG_ACOES,
  LOG_PERIODOS,
  clearAllAdminLogs,
  fetchLogMetrics7d,
  fetchLogsAdmin,
  fetchTotalLogsCount,
  formatLogDateTime,
  formatarAcaoLog,
  formatarDetalhesLog,
  getAcoesFromFiltro,
  getLogAcaoBadgeAdmin,
  getLogContextLink,
  getLogUserDisplayName,
  getLogUserInitial,
  resolvePeriodoDatas,
} from "@/lib/adminLogs";
import { createClient } from "@/lib/supabase";

const PAGE_SIZE = 25;

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
 * @param {object} props
 * @param {string} props.label
 * @param {string|number} props.value
 * @param {string} [props.hint]
 * @param {string} props.accent
 * @returns {import("react").JSX.Element}
 */
function StatCard({ label, value, hint, accent }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {hint && <p className="mt-0.5 text-xs text-[#9aa8a3]">{hint}</p>}
    </div>
  );
}

/**
 * @param {object} props
 * @param {boolean} props.active
 * @param {() => void} props.onClick
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").JSX.Element}
 */
function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "bg-[#1a4a3a] text-white shadow-md shadow-[#1a4a3a]/20"
          : "bg-white text-[#5a6b66] ring-1 ring-[#e3e9e6] hover:bg-[#f7faf9] hover:text-[#1a4a3a]"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * @param {object} log
 * @param {Map<string, object>} perfisMap
 * @returns {import("react").JSX.Element}
 */
function LogCard({ log, perfisMap }) {
  const badge = getLogAcaoBadgeAdmin(log.acao);
  const { relativo, absoluto } = formatLogDateTime(log.created_at);
  const nome = getLogUserDisplayName(log, perfisMap);
  const inicial = getLogUserInitial(log);
  const contextLink = getLogContextLink(log);
  const perfil = log.user_id ? perfisMap.get(log.user_id) : null;

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8f0ed] text-sm font-bold text-[#1a4a3a]">
          {perfil?.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={perfil.foto_url} alt="" className="h-full w-full object-cover" />
          ) : (
            inicial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#1a2e28]">{nome}</p>
              {log.user_email && log.user_email !== nome && (
                <p className="text-xs text-[#9aa8a3]">{log.user_email}</p>
              )}
            </div>
            <span
              className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          <p className="mt-2 text-sm font-medium text-[#1a2e28]">{formatarAcaoLog(log)}</p>
          <p className="mt-0.5 text-sm text-[#5a6b66]">
            {formatarDetalhesLog(log.detalhes)}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-[#9aa8a3]">
            <span title={absoluto}>
              <span className="font-semibold text-[#5a6b66]">{relativo}</span>
              <span className="mx-1">·</span>
              {absoluto}
            </span>
            {contextLink.href && (
              <Link
                href={contextLink.href}
                className="font-semibold text-[#1a4a3a] underline-offset-2 hover:underline"
              >
                {contextLink.label}
              </Link>
            )}
            {log.user_id && (
              <Link
                href={`/admin/logs?user_id=${log.user_id}`}
                className="font-semibold text-[#5a6b66] underline-offset-2 hover:underline"
              >
                Filtrar usuário
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Página admin de logs com filtros, métricas e paginação.
 * @returns {import("react").JSX.Element}
 */
export default function LogsGridPage() {
  const { loading: authLoading } = useAdminAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const userIdParam = searchParams.get("user_id") || "";
  const acaoParam = searchParams.get("acao") || "";

  const [metrics, setMetrics] = useState({
    total: 0,
    acessos: 0,
    irAgora: 0,
    favoritos: 0,
  });
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [perfis, setPerfis] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");
  const [buscaDebounced, setBuscaDebounced] = useState("");
  const [filtroAcao, setFiltroAcao] = useState(() => {
    if (acaoParam && LOG_ACOES.some((a) => a.id === acaoParam)) return acaoParam;
    return "todas";
  });
  const [filtroPeriodo, setFiltroPeriodo] = useState("7d");
  const [customInicio, setCustomInicio] = useState("");
  const [customFim, setCustomFim] = useState("");
  const [clearModalOpen, setClearModalOpen] = useState(false);
  const [totalLogs, setTotalLogs] = useState(0);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setBuscaDebounced(busca), 300);
    return () => clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    setPage(0);
  }, [buscaDebounced, filtroAcao, filtroPeriodo, customInicio, customFim, userIdParam]);

  const perfisMap = useMemo(() => {
    const map = new Map();
    for (const p of perfis) map.set(p.id, p);
    return map;
  }, [perfis]);

  const periodoDatas = useMemo(
    () => resolvePeriodoDatas(filtroPeriodo, customInicio, customFim),
    [filtroPeriodo, customInicio, customFim]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [metricsRes, logsRes] = await Promise.all([
      fetchLogMetrics7d(supabase),
      fetchLogsAdmin(supabase, {
        page,
        pageSize: PAGE_SIZE,
        acoes: getAcoesFromFiltro(filtroAcao),
        userId: userIdParam || null,
        dataInicio: periodoDatas.inicio,
        dataFim: periodoDatas.fim,
        busca: buscaDebounced,
      }),
    ]);

    setMetrics(metricsRes);
    setLogs(logsRes.logs);
    setTotal(logsRes.total);
    setPerfis(logsRes.perfis);
    setLoading(false);
  }, [
    page,
    filtroAcao,
    userIdParam,
    periodoDatas.inicio,
    periodoDatas.fim,
    buscaDebounced,
  ]);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [authLoading, loadData]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters =
    buscaDebounced ||
    filtroAcao !== "todas" ||
    filtroPeriodo !== "7d" ||
    userIdParam ||
    (filtroPeriodo === "custom" && (customInicio || customFim));

  function limparFiltros() {
    setBusca("");
    setBuscaDebounced("");
    setFiltroAcao("todas");
    setFiltroPeriodo("7d");
    setCustomInicio("");
    setCustomFim("");
    setPage(0);
    if (userIdParam) router.replace("/admin/logs");
  }

  async function abrirLimparTodos() {
    const supabase = createClient();
    const count = await fetchTotalLogsCount(supabase);
    setTotalLogs(count);
    setClearError("");
    setClearModalOpen(true);
  }

  async function confirmarLimparTodos() {
    setClearing(true);
    setClearError("");

    const supabase = createClient();
    const { error } = await clearAllAdminLogs(supabase);

    if (error) {
      setClearing(false);
      setClearError(
        error.message.includes("policy")
          ? "Sem permissão para limpar logs. Aplique a migração admin_delete_logs_feedback no Supabase."
          : "Não foi possível limpar os logs. Tente novamente."
      );
      return;
    }

    setClearing(false);
    setClearModalOpen(false);
    setPage(0);
    await loadData();
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell
      title="Logs"
      subtitle="Atividade e eventos do app · horários em Brasília"
      contentClassName="bg-[#f0f4f3]"
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de eventos" value={metrics.total} hint="Últimos 7 dias" accent="text-[#1a2e28]" />
        <StatCard label="Acessos ao app" value={metrics.acessos} hint="Últimos 7 dias" accent="text-blue-600" />
        <StatCard label="IR AGORA" value={metrics.irAgora} hint="Últimos 7 dias" accent="text-emerald-600" />
        <StatCard label="Favoritos" value={metrics.favoritos} hint="Últimos 7 dias" accent="text-purple-600" />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={abrirLimparTodos}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
        >
          Limpar todos os logs
        </button>
      </div>

      {userIdParam && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span>
            Filtrando logs do usuário{" "}
            <code className="rounded bg-amber-100 px-1 text-xs">{userIdParam.slice(0, 8)}…</code>
          </span>
          <button
            type="button"
            onClick={() => router.replace("/admin/logs")}
            className="font-semibold underline-offset-2 hover:underline"
          >
            Remover filtro
          </button>
        </div>
      )}

      <div className="mt-6 space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nome, e-mail ou local…"
          className="w-full rounded-xl border border-[#e3e9e6] bg-[#f7faf9] px-4 py-3 text-sm text-[#1a2e28] placeholder:text-[#9aa8a3] focus:border-[#1a4a3a] focus:outline-none focus:ring-2 focus:ring-[#1a4a3a]/20"
        />

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">Ação</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {LOG_ACOES.map((acao) => (
              <FilterChip
                key={acao.id}
                active={filtroAcao === acao.id}
                onClick={() => setFiltroAcao(acao.id)}
              >
                {acao.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">Período</p>
          <div className="flex flex-wrap gap-2">
            {LOG_PERIODOS.map((periodo) => (
              <FilterChip
                key={periodo.id}
                active={filtroPeriodo === periodo.id}
                onClick={() => setFiltroPeriodo(periodo.id)}
              >
                {periodo.label}
              </FilterChip>
            ))}
          </div>
          {filtroPeriodo === "custom" && (
            <div className="mt-3 flex flex-wrap gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-[#5a6b66]">
                De
                <input
                  type="date"
                  value={customInicio}
                  onChange={(e) => setCustomInicio(e.target.value)}
                  className="rounded-lg border border-[#e3e9e6] px-3 py-2 text-sm"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[#5a6b66]">
                Até
                <input
                  type="date"
                  value={customFim}
                  onChange={(e) => setCustomFim(e.target.value)}
                  className="rounded-lg border border-[#e3e9e6] px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/80" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-lg font-semibold text-[#1a2e28]">Nenhum log no período</p>
            <p className="mt-1 text-sm text-[#5a6b66]">
              Ajuste os filtros ou amplie o intervalo de datas.
            </p>
            {hasFilters && (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-4 rounded-xl bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <LogCard key={log.id} log={log} perfisMap={perfisMap} />
            ))}
          </div>
        )}
      </div>

      {!loading && logs.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#5a6b66]">
            Página {page + 1} de {totalPages}
            {total > 0 && (
              <span className="text-[#9aa8a3]"> · {total} evento{total !== 1 ? "s" : ""}</span>
            )}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1a2e28] shadow-sm ring-1 ring-black/5 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={page + 1 >= totalPages || logs.length < PAGE_SIZE}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#1a2e28] shadow-sm ring-1 ring-black/5 disabled:opacity-40"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
      <AdminModal
        isOpen={clearModalOpen}
        title="Limpar todos os logs"
        onClose={() => {
          if (!clearing) {
            setClearModalOpen(false);
            setClearError("");
          }
        }}
      >
        <p className="text-sm leading-relaxed text-[#5a6b66]">
          Você está prestes a excluir permanentemente{" "}
          <strong>{totalLogs.toLocaleString("pt-BR")}</strong>{" "}
          {totalLogs === 1 ? "registro" : "registros"} de atividade do app.
        </p>
        <p className="mt-2 text-xs text-[#9aa8a3]">
          Esta ação não pode ser desfeita. Relatórios e métricas históricas
          deixarão de refletir eventos anteriores a esta limpeza.
        </p>
        {clearError && (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-[#b42318]">
            {clearError}
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            disabled={clearing}
            onClick={() => {
              setClearModalOpen(false);
              setClearError("");
            }}
            className="flex-1 rounded-xl bg-[#f0f4f3] py-2.5 text-sm font-semibold text-[#1a2e28] disabled:opacity-60"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={clearing || totalLogs === 0}
            onClick={confirmarLimparTodos}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {clearing ? "Limpando…" : "Limpar permanentemente"}
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
