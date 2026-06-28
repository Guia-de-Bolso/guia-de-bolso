"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import { isConteudoCuradoria, isParceiro } from "@/lib/lugarBadges";
import { getCapaFromLugar } from "@/lib/fotos";
import { getLugarPublicPath } from "@/lib/lugarPublicPath";
import {
  formatDiasRestantesExclusao,
  getDiasRestantesExclusao,
} from "@/lib/lugarPurge";
import { createClient } from "@/lib/supabase";

/** Categorias fixas do app (chips de filtro). */
const CATEGORIAS_LUGAR = [
  { nome: "Natureza", icone: "🌿" },
  { nome: "Gastronomia", icone: "🍽️" },
  { nome: "Noite", icone: "🌙" },
  { nome: "Serviços", icone: "🔧" },
  { nome: "Hospedagem", icone: "🏠" },
  { nome: "Cultura", icone: "🏛️" },
  { nome: "Aventura", icone: "🧗" },
  { nome: "Bem-estar", icone: "🧘" },
  { nome: "Compras", icone: "🛍️" },
];

const categoryStyles = {
  Natureza: "bg-[#d4ede8] text-[#1a4a3a]",
  Gastronomia: "bg-[#f0e4d4] text-[#6b5344]",
  Noite: "bg-[#e4d4f0] text-[#5c4a6e]",
  Serviços: "bg-[#c5dff5] text-[#2a5a7a]",
  Hospedagem: "bg-[#f5e6b8] text-[#7a6520]",
  Cultura: "bg-purple-100 text-purple-700",
  Aventura: "bg-orange-100 text-orange-800",
  "Bem-estar": "bg-pink-100 text-pink-800",
  Compras: "bg-sky-100 text-sky-800",
};

/**
 * @param {object} lugar
 * @returns {string}
 */
function getCidade(lugar) {
  return lugar.localizacoes?.cidade || "Imbituba";
}

/**
 * @param {object} lugar
 * @returns {boolean}
 */
function isAtivo(lugar) {
  return lugar.status === "ativo";
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
 * @param {() => void} props.onDeactivate
 * @returns {import("react").JSX.Element}
 */
function LugarCard({ lugar, onDeactivate }) {
  const capa = getCapaFromLugar(lugar);
  const categoriaClass = categoryStyles[lugar.categoria] || "bg-[#f0f4f3] text-[#1a4a3a]";
  const cidade = getCidade(lugar);
  const ativo = isAtivo(lugar);
  const diasExclusao =
    !ativo && lugar.desativado_em
      ? getDiasRestantesExclusao(lugar.desativado_em)
      : null;
  const exclusaoLabel =
    diasExclusao !== null ? formatDiasRestantesExclusao(diasExclusao) : null;

  const statusMeta =
    lugar.status === "em_analise"
      ? { label: "Em análise", className: "bg-amber-100 text-amber-800" }
      : ativo
        ? { label: "Ativo", className: "bg-emerald-100 text-emerald-800" }
        : { label: "Inativo", className: "bg-zinc-100 text-zinc-600" };

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
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-[#d9534f] hover:bg-red-50"
              >
                Desativar
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
};

export default function LugaresGridPage() {
  const { loading } = useAdminAuth();
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get("status");
  const [lugares, setLugares] = useState([]);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [status, setStatus] = useState(
    STATUS_FROM_URL[statusFromUrl] || "Todos"
  );
  const [cidade, setCidade] = useState("Todas");
  const [message, setMessage] = useState("");

  const loadLugares = useCallback(async () => {
    const supabase = createClient();
    const lugaresRes = await supabase
      .from("lugares")
      .select("*, localizacoes(cidade)")
      .order("nome");

    if (lugaresRes.error) {
      console.error("[admin lugares]", lugaresRes.error.message);
    }

    setLugares(lugaresRes.data ?? []);
  }, []);

  useEffect(() => {
    if (loading) return undefined;

    const timer = setTimeout(() => {
      loadLugares();
      const params = new URLSearchParams(window.location.search);
      if (params.get("success") === "created") setMessage("Local criado com sucesso.");
      if (params.get("success") === "updated") setMessage("Local atualizado com sucesso.");
    }, 0);

    return () => clearTimeout(timer);
  }, [loading, loadLugares]);

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(""), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    const mapped = STATUS_FROM_URL[statusFromUrl];
    if (mapped) setStatus(mapped);
  }, [statusFromUrl]);

  /**
   * @param {object} lugar
   */
  async function handleDelete(lugar) {
    const confirmed = window.confirm(`Desativar "${lugar.nome}"?`);
    if (!confirmed) return;

    const supabase = createClient();
    await supabase.from("lugares").update({ status: "desativado" }).eq("id", lugar.id);
    setLugares((items) =>
      items.map((item) =>
        item.id === lugar.id ? { ...item, status: "desativado", ativa: false } : item
      )
    );
  }

  const stats = useMemo(() => {
    const ativos = lugares.filter((l) => isAtivo(l)).length;
    const emAnalise = lugares.filter((l) => l.status === "em_analise").length;
    const parceiros = lugares.filter((l) => isAtivo(l) && isParceiro(l)).length;
    const curadoria = lugares.filter((l) => isAtivo(l) && isConteudoCuradoria(l)).length;
    return {
      total: lugares.length,
      ativos,
      inativos: lugares.length - ativos - emAnalise,
      emAnalise,
      parceiros,
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
      const ativo = isAtivo(lugar);
      const matchesStatus =
        status === "Todos" ||
        (status === "Ativos" && ativo) ||
        (status === "Inativos" && !ativo && lugar.status !== "em_analise") ||
        (status === "Em análise" && lugar.status === "em_analise") ||
        (status === "Parceiros" && ativo && isParceiro(lugar)) ||
        (status === "Curadoria" && ativo && isConteudoCuradoria(lugar)) ||
        (status === "Ambos" &&
          ativo &&
          isParceiro(lugar) &&
          isConteudoCuradoria(lugar));
      const matchesCidade = cidade === "Todas" || getCidade(lugar) === cidade;

      return matchesSearch && matchesCategoria && matchesStatus && matchesCidade;
    });
  }, [lugares, search, categoria, status, cidade]);

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

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-6">
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
          hint="plano R$ 299"
          accent="text-amber-700"
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
        <StatCard label="Inativos" value={stats.inativos} accent="text-[#5a6b66]" />
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
            <FilterChip active={categoria === "Todas"} onClick={() => setCategoria("Todas")}>
              Todas
            </FilterChip>
            {CATEGORIAS_LUGAR.map((item) => (
              <FilterChip
                key={item.nome}
                active={categoria === item.nome}
                onClick={() => setCategoria(item.nome)}
              >
                {item.icone} {item.nome}
              </FilterChip>
            ))}
          </div>
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
                "Inativos",
                "Em análise",
                "Parceiros",
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
        Exibindo <strong className="text-[#1a4a3a]">{filtered.length}</strong> de{" "}
        {lugares.length} locais
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-4xl">📍</p>
          <h2 className="mt-3 text-lg font-bold text-[#1a2e28]">Nenhum local encontrado</h2>
          <p className="mt-2 text-sm text-[#5a6b66]">
            Ajuste os filtros ou cadastre o primeiro lugar do guia.
          </p>
          <Link
            href="/admin/locais/novo"
            className="mt-6 inline-flex rounded-xl bg-[#1a4a3a] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Criar local
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((lugar) => (
            <LugarCard
              key={lugar.id}
              lugar={{
                ...lugar,
                ehParceiroFlag: isParceiro(lugar),
                ehCuradoriaFlag: isConteudoCuradoria(lugar),
              }}
              onDeactivate={() => handleDelete(lugar)}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
