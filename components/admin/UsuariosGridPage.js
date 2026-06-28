"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import {
  isUsuarioDeleteConfirmationValid,
  validateAdminCanDeleteUsuario,
} from "@/lib/adminDeleteUsuario";
import {
  ROLES,
  canAccessAdmin,
  getRoleChipClass,
  getRoleDescription,
  getRoleLabel,
  isAdminTeamRole,
  normalizeRole,
} from "@/lib/adminRoles";
import { formatLogDateTime, getLogAcaoBadgeAdmin } from "@/lib/adminLogs";
import { formatarAcaoLog } from "@/lib/logs";
import { NAV_APPS } from "@/lib/perfil";
import {
  LIMITS,
  PREMIUM_PRICE_LABEL,
  isPremiumActive,
  normalizeUsageFromPerfil,
} from "@/lib/premium";
import { createClient } from "@/lib/supabase";

const FILTROS_PAPEL = [
  { id: "Todos", label: "Todos" },
  { id: "usuario", label: "Usuários" },
  { id: "admin", label: "Administradores" },
  { id: "dev", label: "Desenvolvedores" },
  { id: "estabelecimento", label: "Estabelecimentos" },
  { id: "Premium IA", label: "Premium IA" },
  { id: "Equipe admin", label: "Equipe admin" },
];

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
 * @param {object} usuario
 * @returns {string}
 */
function getDisplayName(usuario) {
  return usuario.nome || usuario.full_name || "Sem nome";
}

/**
 * @param {object} usuario
 * @returns {string}
 */
function getInitials(usuario) {
  return String(getDisplayName(usuario))
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * @param {string} [value]
 * @returns {string}
 */
function formatCadastro(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * @param {string} [mapsKey]
 * @returns {string}
 */
function getMapsLabel(mapsKey) {
  const app = NAV_APPS.find((item) => item.key === mapsKey);
  return app ? `${app.emoji} ${app.label}` : mapsKey || "Não definido";
}

/**
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {string} props.title
 * @param {() => void} props.onClose
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").ReactElement|null}
 */
function AdminModal({ isOpen, title, onClose, children }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
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
 * @param {object} props.usuario
 * @param {() => void} props.onClick
 * @returns {import("react").JSX.Element}
 */
function UsuarioCard({ usuario, onClick }) {
  const premium = isPremiumActive(usuario);
  const role = normalizeRole(usuario.role);
  const usage = normalizeUsageFromPerfil(usuario);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 transition-all hover:shadow-md hover:ring-[#1a4a3a]/15"
    >
      <div className="flex items-start gap-3 p-4">
        {usuario.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={usuario.foto_url}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover ring-2 ring-white"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#d4ede8] text-sm font-bold text-[#1a4a3a]">
            {getInitials(usuario)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate font-bold text-[#1a2e28] group-hover:text-[#1a4a3a]">
            {getDisplayName(usuario)}
          </p>
          {usuario.email && (
            <p className="mt-0.5 truncate text-xs text-[#5a6b66]">{usuario.email}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getRoleChipClass(role)}`}
            >
              {getRoleLabel(role)}
            </span>
            {premium && (
              <span className="rounded-full bg-[#f5e6b8] px-2.5 py-0.5 text-[11px] font-bold text-[#7a6520]">
                Premium IA
              </span>
            )}
            {canAccessAdmin(role) && (
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[11px] font-semibold text-purple-800">
                Painel admin
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-[#9aa8a3]">
            Cadastro {formatCadastro(usuario.created_at)}
            {!premium && (
              <span className="text-[#5a6b66]">
                {" "}
                · IA hoje: {usage.buscas.used}/{LIMITS.busca} buscas,{" "}
                {usage.roteiros.used}/{LIMITS.roteiro} roteiros
              </span>
            )}
          </p>
        </div>
        <span className="shrink-0 text-[#9aa8a3] transition group-hover:text-[#1a4a3a]">
          →
        </span>
      </div>
    </button>
  );
}

/**
 * Painel admin de usuários — cards, filtros, detalhe e alteração de papel.
 * @returns {import("react").JSX.Element}
 */
export default function UsuariosGridPage() {
  const { loading, user: adminUser } = useAdminAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [search, setSearch] = useState("");
  const [filtro, setFiltro] = useState("Todos");
  const [selected, setSelected] = useState(null);
  const [detalhe, setDetalhe] = useState(null);
  const [detalheLoading, setDetalheLoading] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);
  const [confirmRoleOpen, setConfirmRoleOpen] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [message, setMessage] = useState("");

  const loadUsuarios = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("perfis")
      .select("*")
      .order("created_at", { ascending: false });
    setUsuarios(data ?? []);
  }, []);

  useEffect(() => {
    if (!loading) loadUsuarios();
  }, [loading, loadUsuarios]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const stats = useMemo(() => {
    const now = Date.now();
    const seteDias = 7 * 24 * 60 * 60 * 1000;
    let premium = 0;
    let equipe = 0;
    let novos = 0;

    for (const u of usuarios) {
      if (isPremiumActive(u)) premium += 1;
      if (isAdminTeamRole(u.role)) equipe += 1;
      if (u.created_at && now - new Date(u.created_at).getTime() < seteDias) novos += 1;
    }

    return { total: usuarios.length, premium, equipe, novos };
  }, [usuarios]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return usuarios.filter((usuario) => {
      const nome = getDisplayName(usuario).toLowerCase();
      const email = String(usuario.email || "").toLowerCase();
      const matchesSearch = !term || nome.includes(term) || email.includes(term);
      const role = normalizeRole(usuario.role);

      let matchesFiltro = true;
      if (filtro === "Premium IA") matchesFiltro = isPremiumActive(usuario);
      else if (filtro === "Equipe admin") matchesFiltro = isAdminTeamRole(role);
      else if (filtro !== "Todos") matchesFiltro = role === filtro;

      return matchesSearch && matchesFiltro;
    });
  }, [usuarios, search, filtro]);

  /**
   * @param {object} usuario
   */
  async function openDetalhe(usuario) {
    setSelected(usuario);
    setPendingRole(normalizeRole(usuario.role));
    setDetalhe(null);
    setDetalheLoading(true);

    const supabase = createClient();
    const [favRes, avRes, logsRes] = await Promise.all([
      supabase
        .from("favoritos")
        .select("id", { count: "exact", head: true })
        .eq("user_id", usuario.id),
      supabase
        .from("avaliacoes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", usuario.id),
      supabase
        .from("logs")
        .select("*")
        .eq("user_id", usuario.id)
        .order("created_at", { ascending: false })
        .limit(12),
    ]);

    const logs = (logsRes.data ?? [])
      .filter((log) => log.acao !== "acessou_app")
      .slice(0, 8);

    setDetalhe({
      favoritos: favRes.count ?? 0,
      avaliacoes: avRes.count ?? 0,
      logs,
    });
    setDetalheLoading(false);
  }

  function closeDetalhe() {
    setSelected(null);
    setDetalhe(null);
    setPendingRole(null);
    setConfirmRoleOpen(false);
    setConfirmDeleteOpen(false);
    setDeleteConfirmInput("");
    setDeleteError("");
  }

  /**
   * @param {object} usuario
   * @param {string} novoRole
   */
  async function applyRoleChange(usuario, novoRole) {
    setUpdatingRole(true);
    const supabase = createClient();
    const roleAnterior = normalizeRole(usuario.role);

    setUsuarios((items) =>
      items.map((item) => (item.id === usuario.id ? { ...item, role: novoRole } : item))
    );
    if (selected?.id === usuario.id) {
      setSelected((item) => ({ ...item, role: novoRole }));
      setPendingRole(novoRole);
    }

    const { error } = await supabase
      .from("perfis")
      .update({ role: novoRole })
      .eq("id", usuario.id);

    if (error) {
      setUsuarios((items) =>
        items.map((item) =>
          item.id === usuario.id ? { ...item, role: roleAnterior } : item
        )
      );
      if (selected?.id === usuario.id) {
        setSelected((item) => ({ ...item, role: roleAnterior }));
        setPendingRole(roleAnterior);
      }
      setMessage("Não foi possível alterar o papel. Tente novamente.");
    } else {
      setMessage(`Papel atualizado para ${getRoleLabel(novoRole)}.`);
      setConfirmRoleOpen(false);
    }

    setUpdatingRole(false);
  }

  /**
   * @param {object} usuario
   */
  async function handleDeleteUsuario(usuario) {
    setDeletingAccount(true);
    setDeleteError("");

    const confirmation = usuario.email
      ? { confirmEmail: deleteConfirmInput }
      : { confirmNome: deleteConfirmInput };

    try {
      const response = await fetch(`/api/admin/usuarios/${usuario.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(confirmation),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setDeleteError(data.error || "Não foi possível excluir a conta.");
        return;
      }

      setUsuarios((items) => items.filter((item) => item.id !== usuario.id));
      setMessage(`Conta de ${getDisplayName(usuario)} excluída permanentemente.`);
      closeDetalhe();
    } catch {
      setDeleteError("Não foi possível excluir a conta. Tente novamente.");
    } finally {
      setDeletingAccount(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  const selectedUsage = selected ? normalizeUsageFromPerfil(selected) : null;
  const selectedPremium = selected ? isPremiumActive(selected) : false;
  const deleteGuard = selected
    ? validateAdminCanDeleteUsuario({
        adminId: adminUser?.id,
        targetPerfil: selected,
      })
    : null;
  const deleteConfirmationValid = selected
    ? isUsuarioDeleteConfirmationValid(selected, {
        confirmEmail: deleteConfirmInput,
        confirmNome: deleteConfirmInput,
      })
    : false;

  return (
    <AdminShell
      title="Usuários"
      subtitle="Perfis, papéis, Premium IA e engajamento no app"
    >
      <p className="mb-5 rounded-2xl bg-[#f7faf9] px-4 py-3 text-sm leading-relaxed text-[#5a6b66] ring-1 ring-[#e8eeee]">
        Lista baseada em contas com perfil no app. Novos logins (Google ou SMS) criam ou
        atualizam o perfil automaticamente. Se faltar alguém, peça para abrir o app uma vez
        após o login.
      </p>

      {message && (
        <div
          className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-[#d4ede8] bg-[#eef8f4] px-4 py-3 text-sm font-semibold text-[#1a4a3a]"
          role="status"
        >
          <span>✓ {message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="rounded-lg px-2 py-1 text-xs text-[#5a6b66] hover:bg-white/60"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} accent="text-[#1a4a3a]" />
        <StatCard
          label="Premium IA"
          value={stats.premium}
          hint={PREMIUM_PRICE_LABEL}
          accent="text-amber-700"
        />
        <StatCard
          label="Equipe admin"
          value={stats.equipe}
          hint="admin + dev"
          accent="text-purple-700"
        />
        <StatCard
          label="Novos (7 dias)"
          value={stats.novos}
          accent="text-emerald-700"
        />
      </div>

      <div className="mb-5 space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa8a3]">
            🔍
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            className="w-full rounded-xl bg-[#f0f4f3] py-2.5 pl-10 pr-3 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTROS_PAPEL.map((item) => (
            <FilterChip
              key={item.id}
              active={filtro === item.id}
              onClick={() => setFiltro(item.id)}
            >
              {item.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#5a6b66] shadow-sm">
          Nenhum usuário encontrado para este filtro.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((usuario) => (
            <UsuarioCard
              key={usuario.id}
              usuario={usuario}
              onClick={() => openDetalhe(usuario)}
            />
          ))}
        </div>
      )}

      {selected && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
            onClick={closeDetalhe}
            aria-hidden
          />
          <div
            className="fixed inset-x-0 bottom-0 z-50 flex max-h-[min(90vh,720px)] flex-col rounded-t-[24px] bg-white shadow-2xl md:inset-x-auto md:bottom-auto md:left-auto md:right-4 md:top-20 md:max-w-md md:rounded-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="usuario-detalhe-title"
          >
            <div className="shrink-0 border-b border-[#e8eeee] px-5 pb-4 pt-3">
              <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#d8dfdc] md:hidden" />
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {selected.foto_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selected.foto_url}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#d4ede8] text-lg font-bold text-[#1a4a3a]">
                      {getInitials(selected)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2
                      id="usuario-detalhe-title"
                      className="truncate text-lg font-bold text-[#1a2e28]"
                    >
                      {getDisplayName(selected)}
                    </h2>
                    <p className="truncate text-xs text-[#5a6b66]">
                      {selected.email || "E-mail não disponível no perfil"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeDetalhe}
                  className="rounded-lg px-2 py-1 text-sm text-[#5a6b66] hover:bg-[#f0f4f3]"
                  aria-label="Fechar"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-wrap gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getRoleChipClass(selected.role)}`}
                >
                  {getRoleLabel(selected.role)}
                </span>
                {selectedPremium ? (
                  <span className="rounded-full bg-[#f5e6b8] px-3 py-1 text-xs font-bold text-[#7a6520]">
                    Premium IA ativo
                  </span>
                ) : (
                  <span className="rounded-full bg-[#f0f4f3] px-3 py-1 text-xs font-semibold text-[#5a6b66]">
                    Plano gratuito
                  </span>
                )}
              </div>

              <dl className="mt-4 grid gap-3 text-sm">
                <div className="rounded-xl bg-[#f7faf9] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">
                    Cadastro
                  </dt>
                  <dd className="mt-1 font-medium text-[#1a2e28]">
                    {formatCadastro(selected.created_at)}
                  </dd>
                </div>
                <div className="rounded-xl bg-[#f7faf9] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">
                    App de mapas
                  </dt>
                  <dd className="mt-1 font-medium text-[#1a2e28]">
                    {getMapsLabel(selected.maps_preferido)}
                  </dd>
                </div>
                <div className="rounded-xl bg-[#f7faf9] p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">
                    Premium IA (app)
                  </dt>
                  <dd className="mt-1 text-[#1a2e28]">
                    {selectedPremium ? (
                      <>
                        Assinatura ativa
                        {selected.premium_ate && (
                          <span className="block text-xs text-[#5a6b66]">
                            até{" "}
                            {formatCadastro(selected.premium_ate)}
                          </span>
                        )}
                        <span className="mt-1 block text-xs text-[#5a6b66]">
                          Buscas e roteiros ilimitados · {PREMIUM_PRICE_LABEL}
                        </span>
                      </>
                    ) : (
                      <>
                        Gratuito — hoje: {selectedUsage?.buscas.used}/
                        {LIMITS.busca} buscas, {selectedUsage?.roteiros.used}/
                        {LIMITS.roteiro} roteiros
                      </>
                    )}
                  </dd>
                </div>
              </dl>

              <p className="mt-2 text-[11px] leading-relaxed text-[#9aa8a3]">
                Parceiro do Guia (R$ 299) é o toggle &quot;Parceiro do Guia&quot; em Admin →
                Locais, não neste Premium.
              </p>

              {detalheLoading ? (
                <p className="mt-4 text-sm text-[#5a6b66]">Carregando engajamento…</p>
              ) : detalhe ? (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-xl border border-[#e8eeee] p-3 text-center">
                    <p className="text-xl font-bold text-[#1a4a3a]">{detalhe.favoritos}</p>
                    <p className="text-xs text-[#5a6b66]">Favoritos</p>
                  </div>
                  <div className="rounded-xl border border-[#e8eeee] p-3 text-center">
                    <p className="text-xl font-bold text-[#1a4a3a]">{detalhe.avaliacoes}</p>
                    <p className="text-xs text-[#5a6b66]">Avaliações</p>
                  </div>
                </div>
              ) : null}

              <div className="mt-5">
                <Link
                  href={`/admin/logs?user_id=${selected.id}`}
                  className="text-sm font-semibold text-[#1a4a3a] underline-offset-2 hover:underline"
                >
                  Ver logs deste usuário →
                </Link>
              </div>

              {detalhe?.logs?.length > 0 && (
                <section className="mt-5">
                  <h3 className="text-xs font-bold uppercase tracking-wide text-[#5a6b66]">
                    Atividade recente
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {detalhe.logs.map((log) => {
                      const badge = getLogAcaoBadgeAdmin(log.acao);
                      return (
                        <li
                          key={log.id}
                          className="rounded-xl bg-[#f7faf9] px-3 py-2 text-xs"
                        >
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          <p className="mt-1 text-[#1a2e28]">{formatarAcaoLog(log)}</p>
                          <p className="text-[#9aa8a3]">
                            {formatLogDateTime(log.created_at).absoluto}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              )}

              <section className="mt-6 border-t border-[#e8eeee] pt-5">
                <h3 className="text-sm font-bold text-[#1a2e28]">Alterar papel</h3>
                <p className="mt-1 text-xs text-[#5a6b66]">
                  Confirmação obrigatória antes de salvar.
                </p>
                <label className="mt-3 block text-sm font-semibold text-[#1a2e28]">
                  Novo papel
                  <select
                    value={pendingRole ?? normalizeRole(selected.role)}
                    disabled={updatingRole || selected.id === adminUser?.id}
                    onChange={(event) => setPendingRole(event.target.value)}
                    className="mt-1 w-full rounded-xl bg-[#f0f4f3] px-3 py-2.5 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2 disabled:opacity-60"
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {getRoleLabel(role)}
                      </option>
                    ))}
                  </select>
                </label>
                {selected.id === adminUser?.id && (
                  <p className="mt-2 text-xs text-amber-800">
                    Você não pode alterar o próprio papel por aqui.
                  </p>
                )}
                <button
                  type="button"
                  disabled={
                    updatingRole ||
                    selected.id === adminUser?.id ||
                    pendingRole === normalizeRole(selected.role)
                  }
                  onClick={() => setConfirmRoleOpen(true)}
                  className="mt-3 w-full rounded-xl bg-[#1a4a3a] py-3 text-sm font-semibold text-white disabled:opacity-50"
                >
                  Revisar e confirmar
                </button>
              </section>

              <section className="mt-6 border-t border-red-100 pt-5">
                <h3 className="text-sm font-bold text-[#b42318]">Excluir conta</h3>
                <p className="mt-1 text-xs leading-relaxed text-[#5a6b66]">
                  Remove favoritos, avaliações, roteiros, perfil e autenticação. Ação
                  irreversível — use para suporte ou contas de teste.
                </p>

                {!deleteGuard?.ok ? (
                  <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
                    {deleteGuard?.message}
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteConfirmInput("");
                      setDeleteError("");
                      setConfirmDeleteOpen(true);
                    }}
                    className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-[#b42318] transition hover:bg-red-100"
                  >
                    Excluir conta permanentemente
                  </button>
                )}
              </section>
            </div>
          </div>
        </>
      )}

      <AdminModal
        isOpen={confirmDeleteOpen}
        title="Excluir conta permanentemente"
        onClose={() => {
          if (!deletingAccount) {
            setConfirmDeleteOpen(false);
            setDeleteConfirmInput("");
            setDeleteError("");
          }
        }}
      >
        {selected && (
          <>
            <p className="text-sm leading-relaxed text-[#5a6b66]">
              Você está prestes a excluir <strong>{getDisplayName(selected)}</strong>.
              Todos os dados da conta serão removidos e não há como desfazer.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[#5a6b66]">
              <li>Favoritos, avaliações e roteiros salvos</li>
              <li>Perfil, avatar e sessões de login</li>
              <li>Conta de autenticação (Google ou SMS)</li>
            </ul>
            <p className="mt-3 text-xs font-semibold text-[#1a2e28]">
              {selected.email
                ? "Digite o e-mail do usuário para confirmar:"
                : "Digite o nome do usuário exatamente como no perfil:"}
            </p>
            <input
              value={deleteConfirmInput}
              onChange={(event) => setDeleteConfirmInput(event.target.value)}
              disabled={deletingAccount}
              placeholder={selected.email || getDisplayName(selected)}
              className="mt-2 w-full rounded-xl bg-[#f0f4f3] px-3 py-2.5 text-sm outline-none ring-[#b42318]/20 focus:ring-2 disabled:opacity-60"
              autoComplete="off"
              spellCheck={false}
            />
            {deleteError && (
              <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-[#b42318]">
                {deleteError}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                disabled={deletingAccount}
                onClick={() => {
                  setConfirmDeleteOpen(false);
                  setDeleteConfirmInput("");
                  setDeleteError("");
                }}
                className="flex-1 rounded-xl bg-[#f0f4f3] py-2.5 text-sm font-semibold text-[#1a2e28] disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deletingAccount || !deleteConfirmationValid}
                onClick={() => handleDeleteUsuario(selected)}
                className="flex-1 rounded-xl bg-[#d9534f] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deletingAccount ? "Excluindo…" : "Excluir permanentemente"}
              </button>
            </div>
          </>
        )}
      </AdminModal>

      <AdminModal
        isOpen={confirmRoleOpen}
        title="Confirmar alteração de papel"
        onClose={() => setConfirmRoleOpen(false)}
      >
        {selected && pendingRole && (
          <>
            <p className="text-sm text-[#5a6b66]">
              Alterar <strong>{getDisplayName(selected)}</strong> de{" "}
              <strong>{getRoleLabel(selected.role)}</strong> para{" "}
              <strong>{getRoleLabel(pendingRole)}</strong>?
            </p>
            <p className="mt-2 rounded-xl bg-[#f0f4f3] px-3 py-2 text-xs text-[#5a6b66]">
              {getRoleDescription(pendingRole)}
            </p>
            {canAccessAdmin(pendingRole) && (
              <p className="mt-2 text-xs font-semibold text-purple-800">
                Este usuário passará a acessar o painel administrativo.
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmRoleOpen(false)}
                className="flex-1 rounded-xl bg-[#f0f4f3] py-2.5 text-sm font-semibold text-[#1a2e28]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={updatingRole}
                onClick={() => applyRoleChange(selected, pendingRole)}
                className="flex-1 rounded-xl bg-[#1a4a3a] py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {updatingRole ? "Salvando…" : "Confirmar"}
              </button>
            </div>
          </>
        )}
      </AdminModal>
    </AdminShell>
  );
}
