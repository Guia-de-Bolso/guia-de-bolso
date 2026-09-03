"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import { useAdminFlashToast, useAdminToast } from "@/components/admin/AdminToastContext";
import { isConteudoCuradoria, isParceiro } from "@/lib/lugarBadges";
import {
  hasPerfilCompletoGratuito,
  isLugarPerfilPresenca,
} from "@/lib/planoLancamento";
import { getCapaThumbFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import {
  formatDiasRestantesExclusao,
  getDiasRestantesExclusao,
} from "@/lib/lugarPurge";
import {
  getLugarStatusLabel,
  isLugarAtivo,
  isLugarInativoComPurge,
  isLugarPausado,
  LUGAR_STATUS,
} from "@/lib/lugarStatus";
import { fetchSubcategoriasAdmin } from "@/lib/adminTaxonomia";
import { getCategoriasVisiveis } from "@/lib/categorias";
import { processPendingPushCampaigns } from "@/lib/processPendingPushCampaigns";
import { createClient } from "@/lib/supabase";

/** Categorias fixas do app (chips de filtro). */
const CATEGORIAS_LUGAR = getCategoriasVisiveis().map((item) => ({
  nome: item.nome,
  icone: item.icone,
}));

/**
 * Estabelecimento ativo no app no plano Presença (utilitário ou experiência sem promo).
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
function isLugarPerfilBasico(lugar) {
  return isLugarAtivo(lugar) && isLugarPerfilPresenca(lugar);
}

/**
 * Estabelecimento ativo com promo de perfil completo.
 * @param {object|null|undefined} lugar
 * @returns {boolean}
 */
function isLugarPerfilLancamento(lugar) {
  return isLugarAtivo(lugar) && hasPerfilCompletoGratuito(lugar);
}

const categoryStyles = {
  Natureza: "bg-[#d4ede8] text-[#1a4a3a]",
  Gastronomia: "bg-[#f0e4d4] text-[#6b5344]",
  Noite: "bg-[#e4d4f0] text-[#5c4a6e]",
  Serviços: "bg-[#c5dff5] text-[#2a5a7a]",
  Cultura: "bg-purple-100 text-purple-700",
  Aventura: "bg-orange-100 text-orange-800",
  "Bem-estar": "bg-pink-100 text-pink-800",
};

/**
 * @param {object} lugar
 * @returns {string}
 */
function getCidade(lugar) {
  return lugar.localizacoes?.cidade || "Imbituba";
}

/**
 * @param {string} nome
 * @returns {string}
 */
function getInitials(nome) {
  return String(nome || "?")
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {number|string} props.value
 * @param {string} [props.hint]
 * @param {string} [props.accent]
 * @returns {import("react").JSX.Element}
 */
function StatCard({ label, value, hint, accent = "text-[#1a2e28]" }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${accent}`}>{value}</p>
      {hint && <p className="mt-0.5 text-[11px] text-[#9aa8a3]">{hint}</p>}
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
 * @param {object} props
 * @param {object} props.lugar
 * @param {() => void} props.onActivate
 * @param {() => void} props.onDeactivate
 * @param {() => void} props.onInactivate
 * @returns {import("react").JSX.Element}
 */
function LugarCard({ lugar, onActivate, onDeactivate, onInactivate }) {
  const capa = getCapaThumbFromLugar(lugar);
  const categoriaClass = categoryStyles[lugar.categoria] || "bg-[#f0f4f3] text-[#1a4a3a]";
  const cidade = getCidade(lugar);
  const ativo = isLugarAtivo(lugar);
  const diasExclusao =
    isLugarInativoComPurge(lugar) && lugar.desativado_em
      ? getDiasRestantesExclusao(lugar.desativado_em)
      : null;
  const exclusaoLabel =
    diasExclusao !== null ? formatDiasRestantesExclusao(diasExclusao) : null;

  const statusMeta = (() => {
    if (lugar.status === LUGAR_STATUS.EM_ANALISE) {
      return { label: "Em análise", className: "bg-amber-100 text-amber-800" };
    }
    if (ativo) {
      return { label: "Ativo", className: "bg-emerald-100 text-emerald-800" };
    }
    if (isLugarPausado(lugar)) {
      return { label: "Desativado", className: "bg-slate-100 text-slate-600" };
    }
    return {
      label: getLugarStatusLabel(lugar.status),
      className: "bg-zinc-100 text-zinc-600",
    };
  })();

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="relative h-40 bg-[#e8eeee]">
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={capa} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white/90">
            {getInitials(lugar.nome)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {lugar.categoria && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm backdrop-blur-sm ${categoriaClass}`}
            >
              {lugar.categoria}
            </span>
          )}
          {lugar.ehParceiroFlag && (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950 shadow-sm">
              Parceiro
            </span>
          )}
          {lugar.ehLancamentoFlag && (
            <span className="rounded-full bg-sky-200 px-2.5 py-1 text-xs font-bold text-sky-900 shadow-sm">
              Lançamento
            </span>
          )}
          {lugar.ehPresencaFlag && (
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 shadow-sm">
              Presença
            </span>
          )}
          {lugar.ehCuradoriaFlag && (
            <span className="rounded-full bg-[#d4ede8] px-2.5 py-1 text-xs font-bold text-[#1a4a3a] shadow-sm">
              Curadoria
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <h2 className="line-clamp-2 text-lg font-bold leading-snug text-white">
            {lugar.nome}
          </h2>
          <p className="mt-0.5 text-xs text-white/80">
            {cidade || "Cidade não informada"}
            {lugar.subcategoria ? ` · ${lugar.subcategoria}` : ""}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          {lugar.telefone && (
            <span className="rounded-lg bg-[#f7faf9] px-2 py-1 text-xs font-semibold text-[#5a6b66]">
              📞 Contato
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef3f1] pt-3">
          <div className="flex min-w-0 flex-col gap-1">
            <span
              className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.className}`}
            >
              {statusMeta.label}
            </span>
            {exclusaoLabel && (
              <span className="text-xs font-medium text-amber-800">
                Exclusão definitiva {exclusaoLabel}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {ativo && (
              <Link
                href={getLugarPublicPath(lugar)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#f0f4f3] px-3 py-1.5 text-xs font-semibold text-[#1a4a3a] hover:bg-[#e3e9e6]"
              >
                Ver
              </Link>
            )}
            <Link
              href={`/admin/locais/${lugar.id}/editar`}
              className="rounded-xl bg-[#1a4a3a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#153d31]"
            >
              Editar
            </Link>
            {ativo && (
              <button
                type="button"
                onClick={onDeactivate}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#5a6b66] hover:bg-[#f0f4f3]"
              >
                Desativar
              </button>
            )}
            {!ativo && (
              <button
                type="button"
                onClick={onActivate}
                className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                Ativar
              </button>
            )}
            {(ativo || isLugarPausado(lugar) || lugar.status === LUGAR_STATUS.EM_ANALISE) && (
              <button
                type="button"
                onClick={onInactivate}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#d9534f] hover:bg-red-50"
              >
                Inativar
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/**
 * Página admin de listagem de lugares com métricas, filtros e cards interativos.
 * @returns {import("react").JSX.Element}
 */
const STATUS_FROM_URL = {
  em_analise: "Em análise",
  pausado: "Desativados",
  perfil_basico: "Presença",
  lancamento: "Lançamento",
  parceiros: "Parceiros",
};

export default function LugaresGridPage() {
  const { loading } = useAdminAuth();
  const { showToast } = useAdminToast();
  useAdminFlashToast({ enabled: !loading });
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const [lugares, setLugares] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [subcategoria, setSubcategoria] = useState("Todas");
  const [status, setStatus] = useState(
    STATUS_FROM_URL[statusFromUrl] || "Todos"
  );
  const [cidade, setCidade] = useState("Todas");

  const loadLugares = useCallback(async () => {
    const supabase = createClient();
    const [lugaresRes, subs] = await Promise.all([
      supabase.from("lugares").select("*, localizacoes(cidade)").order("nome"),
      fetchSubcategoriasAdmin(supabase),
    ]);

    if (lugaresRes.error) {
      console.error("[admin lugares]", lugaresRes.error.message);
    }

    setLugares(lugaresRes.data ?? []);
    setSubcategorias(subs);
  }, []);

  useEffect(() => {
    if (loading) return undefined;

    const timer = setTimeout(() => {
      loadLugares();
    }, 0);

    return () => clearTimeout(timer);
  }, [loading, loadLugares]);

  useEffect(() => {
    const mapped = STATUS_FROM_URL[statusFromUrl];
    if (mapped) setStatus(mapped);
  }, [statusFromUrl]);

  /**
   * @param {object} lugar
   * @param {string} nextStatus
   * @param {object} [patch]
   */
  async function updateLugarStatus(lugar, nextStatus, patch = {}) {
    const supabase = createClient();
    const { error } = await supabase
      .from("lugares")
      .update({ status: nextStatus })
      .eq("id", lugar.id);

    if (error) {
      console.error("[admin lugares] status:", error.message);
      showToast("Não foi possível atualizar o status.", { tone: "error" });
      return;
    }

    setLugares((items) =>
      items.map((item) =>
        item.id === lugar.id
          ? {
              ...item,
              status: nextStatus,
              desativado_em:
                nextStatus === LUGAR_STATUS.DESATIVADO
                  ? item.desativado_em || new Date().toISOString()
                  : null,
              ...patch,
            }
          : item
      )
    );

    showToast(`Status atualizado: ${getLugarStatusLabel(nextStatus)}.`);

    if (nextStatus === LUGAR_STATUS.ATIVO) {
      await processPendingPushCampaigns();
    }
  }

  /**
   * @param {object} lugar
   */
  async function handleActivate(lugar) {
    const confirmed = window.confirm(`Ativar "${lugar.nome}" e publicar no app?`);
    if (!confirmed) return;
    await updateLugarStatus(lugar, LUGAR_STATUS.ATIVO);
  }

  /**
   * @param {object} lugar
   */
  async function handleDeactivate(lugar) {
    const confirmed = window.confirm(
      `Desativar "${lugar.nome}"? O local sai do app, mas pode ser reativado depois.`
    );
    if (!confirmed) return;
    await updateLugarStatus(lugar, LUGAR_STATUS.PAUSADO);
  }

  /**
   * @param {object} lugar
   */
  async function handleInactivate(lugar) {
    const confirmed = window.confirm(
      `Inativar "${lugar.nome}"? O local será excluído definitivamente em 30 dias.`
    );
    if (!confirmed) return;
    await updateLugarStatus(lugar, LUGAR_STATUS.DESATIVADO);
  }

  const stats = useMemo(() => {
    const ativos = lugares.filter((l) => isLugarAtivo(l)).length;
    const emAnalise = lugares.filter((l) => l.status === LUGAR_STATUS.EM_ANALISE).length;
    const desativados = lugares.filter((l) => isLugarPausado(l)).length;
    const inativos = lugares.filter((l) => isLugarInativoComPurge(l)).length;
    const parceiros = lugares.filter((l) => isLugarAtivo(l) && isParceiro(l)).length;
    const perfilBasico = lugares.filter((l) => isLugarPerfilBasico(l)).length;
    const lancamento = lugares.filter((l) => isLugarPerfilLancamento(l)).length;
    const curadoria = lugares.filter((l) => isLugarAtivo(l) && isConteudoCuradoria(l)).length;
    return {
      total: lugares.length,
      ativos,
      desativados,
      inativos,
      emAnalise,
      parceiros,
      perfilBasico,
      lancamento,
      curadoria,
    };
  }, [lugares]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return lugares.filter((lugar) => {
      const nome = String(lugar.nome || "").toLowerCase();
      const sub = String(lugar.subcategoria || "").toLowerCase();
      const matchesSearch =
        !term ||
        nome.includes(term) ||
        sub.includes(term) ||
        getCidade(lugar).toLowerCase().includes(term);
      const matchesCategoria = categoria === "Todas" || lugar.categoria === categoria;
      const matchesSubcategoria =
        subcategoria === "Todas" || String(lugar.subcategoria || "") === subcategoria;
      const ativo = isLugarAtivo(lugar);
      const matchesStatus =
        status === "Todos" ||
        (status === "Ativos" && ativo) ||
        (status === "Desativados" && isLugarPausado(lugar)) ||
        (status === "Inativos" && isLugarInativoComPurge(lugar)) ||
        (status === "Em análise" && lugar.status === LUGAR_STATUS.EM_ANALISE) ||
        (status === "Parceiros" && ativo && isParceiro(lugar)) ||
        (status === "Presença" && isLugarPerfilBasico(lugar)) ||
        (status === "Lançamento" && isLugarPerfilLancamento(lugar)) ||
        (status === "Perfil básico" && isLugarPerfilBasico(lugar)) ||
        (status === "Curadoria" && ativo && isConteudoCuradoria(lugar)) ||
        (status === "Ambos" &&
          ativo &&
          isParceiro(lugar) &&
          isConteudoCuradoria(lugar));
      const matchesCidade = cidade === "Todas" || getCidade(lugar) === cidade;

      return (
        matchesSearch &&
        matchesCategoria &&
        matchesSubcategoria &&
        matchesStatus &&
        matchesCidade
      );
    });
  }, [lugares, search, categoria, subcategoria, status, cidade]);

  const subcategoriasDaCategoria = useMemo(() => {
    if (categoria === "Todas") return [];
    return subcategorias.filter((item) => item.categoria === categoria);
  }, [subcategorias, categoria]);

  function selectCategoria(nextCategoria) {
    setCategoria(nextCategoria);
    setSubcategoria("Todas");
  }

  const novoLugarLink = (
    <Link
      href="/admin/locais/novo"
      className="inline-flex items-center gap-2 rounded-xl bg-[#1a4a3a] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1a4a3a]/25 transition hover:bg-[#153d31]"
    >
      <span className="text-lg leading-none">+</span>
      Novo local
    </Link>
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell
      title="Locais"
      subtitle="Estabelecimentos e pontos do guia na região"
      headerAction={novoLugarLink}
    >
      <section className="mb-6 rounded-2xl border border-sky-200 bg-sky-50/60 p-4">
        <p className="text-sm text-[#1a2e28]">
          <strong>Fase de lançamento:</strong> cadastre farmácias, mercados e utilitários em{" "}
          <strong>Presença</strong> (perfil completo grátis para sempre, sem destaque pago).
          Restaurantes e experiências em <strong>Lançamento</strong> (perfil completo até
          fev/2027). Meta: 70–100 locais antes do marketing.
        </p>
        <div className="mt-2 flex flex-wrap gap-3 text-xs font-semibold">
          <Link href="/admin/kpis" className="text-sky-800 underline-offset-2 hover:underline">
            KPIs agregados
          </Link>
          <Link
            href="/admin/abordagem"
            className="text-sky-800 underline-offset-2 hover:underline"
          >
            Fila de abordagem
          </Link>
          <Link
            href="/admin/relatorios"
            className="text-sky-800 underline-offset-2 hover:underline"
          >
            Relatórios por local
          </Link>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Total" value={stats.total} accent="text-[#1a4a3a]" />
        <StatCard
          label="Publicados"
          value={stats.ativos}
          hint="visíveis no app"
          accent="text-emerald-700"
        />
        <StatCard
          label="Parceiros"
          value={stats.parceiros}
          hint="destaque pago"
          accent="text-amber-700"
        />
        <StatCard
          label="Presença"
          value={stats.perfilBasico}
          hint="utilitário completo"
          accent="text-sky-700"
        />
        <StatCard
          label="Lançamento"
          value={stats.lancamento}
          hint="perfil completo grátis"
          accent="text-emerald-700"
        />
        <StatCard
          label="Curadoria"
          value={stats.curadoria}
          hint="conteúdo autoral"
          accent="text-[#1a4a3a]"
        />
        <StatCard
          label="Em análise"
          value={stats.emAnalise}
          accent="text-amber-600"
        />
        <StatCard
          label="Desativados"
          value={stats.desativados}
          hint="fora do app"
          accent="text-slate-600"
        />
        <StatCard
          label="Inativos"
          value={stats.inativos}
          hint="exclusão em 30 dias"
          accent="text-[#5a6b66]"
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
            placeholder="Buscar por nome, subcategoria ou cidade..."
            className="w-full rounded-xl bg-[#f0f4f3] py-2.5 pl-10 pr-3 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">
            Categoria
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={categoria === "Todas"} onClick={() => selectCategoria("Todas")}>
              Todas
            </FilterChip>
            {CATEGORIAS_LUGAR.map((item) => (
              <FilterChip
                key={item.nome}
                active={categoria === item.nome}
                onClick={() => selectCategoria(item.nome)}
              >
                {item.icone} {item.nome}
              </FilterChip>
            ))}
          </div>
          {categoria !== "Todas" && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-[#e3e9e6] pt-3">
              <FilterChip
                active={subcategoria === "Todas"}
                onClick={() => setSubcategoria("Todas")}
              >
                Todas subcategorias
              </FilterChip>
              {subcategoriasDaCategoria.map((item) => (
                <FilterChip
                  key={item.id}
                  active={subcategoria === item.nome}
                  onClick={() => setSubcategoria(item.nome)}
                >
                  {item.icone ? `${item.icone} ` : ""}
                  {item.nome}
                </FilterChip>
              ))}
              {subcategoriasDaCategoria.length === 0 && (
                <p className="self-center text-xs text-[#9aa8a3]">
                  Nenhuma subcategoria cadastrada nesta categoria.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                "Todos",
                "Ativos",
                "Desativados",
                "Inativos",
                "Em análise",
                "Parceiros",
                "Lançamento",
                "Presença",
                "Perfil básico",
                "Curadoria",
                "Ambos",
              ].map((item) => (
                <FilterChip
                  key={item}
                  active={status === item}
                  onClick={() => setStatus(item)}
                >
                  {item}
                </FilterChip>
              ))}
            </div>
          </div>
          <select
            value={cidade}
            onChange={(event) => setCidade(event.target.value)}
            className="w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm font-semibold text-[#1a4a3a] outline-none ring-[#1a4a3a]/20 focus:ring-2 sm:w-44"
          >
            <option>Todas</option>
            <option>Imbituba</option>
          </select>
        </div>
      </div>

      <p className="mb-4 text-sm text-[#5a6b66]">
        {status === "Todos" &&
        categoria === "Todas" &&
        subcategoria === "Todas" &&
        !search.trim() ? (
          <>
            <strong className="text-[#1a4a3a]">{filtered.length}</strong> locais
          </>
        ) : (
          <>
            Filtro atual: <strong className="text-[#1a4a3a]">{filtered.length}</strong>{" "}
            locais · total cadastrado: {lugares.length}
            {(status === "Parceiros" ||
              status === "Presença" ||
              status === "Perfil básico" ||
              status === "Lançamento" ||
              status === "Curadoria" ||
              status === "Ambos") && (
              <span className="mt-1 block text-xs text-[#9aa8a3]">
                Planos comerciais e curadoria não somam o total — um local pode
                entrar em mais de um filtro (ou só em curadoria, no caso de
                praias/trilhas).
              </span>
            )}
          </>
        )}
      </p>

      {filtered.length === 0 ? (
        <AdminEmptyState
          title={
            lugares.length === 0
              ? "Nenhum local cadastrado"
              : "Nenhum local encontrado"
          }
          description={
            lugares.length === 0
              ? "Cadastre o primeiro estabelecimento ou ponto do guia."
              : "Ajuste os filtros ou a busca para ver outros resultados."
          }
          actionLabel={lugares.length === 0 ? "Criar local" : "Limpar filtros"}
          actionHref={lugares.length === 0 ? "/admin/locais/novo" : undefined}
          onAction={
            lugares.length === 0
              ? undefined
              : () => {
                  setSearch("");
                  setCategoria("Todas");
                  setStatus("Todos");
                  setCidade("Todas");
                }
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lugar) => (
            <LugarCard
              key={lugar.id}
              lugar={{
                ...lugar,
                ehParceiroFlag: isParceiro(lugar),
                ehLancamentoFlag: isLugarPerfilLancamento(lugar),
                ehPresencaFlag: isLugarPerfilBasico(lugar),
                ehCuradoriaFlag: isConteudoCuradoria(lugar),
              }}
              onActivate={() => handleActivate(lugar)}
              onDeactivate={() => handleDeactivate(lugar)}
              onInactivate={() => handleInactivate(lugar)}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
