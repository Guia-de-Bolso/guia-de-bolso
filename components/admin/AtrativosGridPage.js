"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import { useAdminFlashToast, useAdminToast } from "@/components/admin/AdminToastContext";
import { getCapaThumbFromAtrativo } from "@/lib/fotos";
import { CATEGORIAS_ATRATIVO, getCategoriaAtrativoMeta, normalizeCategoriaAtrativo } from "@/lib/atrativos";
import {
  ATRATIVO_DO_DIA_FIXAR_OPCOES,
  aplicarFixacaoAtrativoDoDia,
  isAtrativoFixadoHoje,
  removerFixacaoAtrativoDoDia,
} from "@/lib/atrativoDoDia";
import { createClient } from "@/lib/supabase";
import { ADMIN_ROTEIROS_NOVA_PATH, adminRoteiroEditarPath, roteiroDetalhePath } from "@/lib/roteirosPaths";

/**
 * @param {number|null|undefined} minutos
 * @returns {string}
 */
function formatDuracao(minutos) {
  if (minutos === null || minutos === undefined) return "—";
  const total = Number(minutos);
  if (!Number.isFinite(total)) return "—";
  const horas = Math.floor(total / 60);
  const mins = total % 60;
  return horas > 0 ? `${horas}h ${mins > 0 ? `${mins}m` : ""}`.trim() : `${mins}m`;
}

/**
 * @param {object} rota
 * @returns {string}
 */
function getAtrativoNome(rota) {
  return rota.nome || rota.titulo || "Roteiro sem nome";
}

/**
 * @param {object} rota
 * @returns {number}
 */
function getPontosCount(rota) {
  const row = rota?.rota_pontos;
  if (Array.isArray(row) && row[0]?.count != null) return Number(row[0].count) || 0;
  if (row && typeof row === "object" && "count" in row) return Number(row.count) || 0;
  return 0;
}

/**
 * @param {string} [value]
 * @returns {string}
 */
function dificuldadeBadgeClass(value) {
  const d = String(value || "").toLowerCase();
  if (d.includes("dif")) return "bg-red-100 text-red-700";
  if (d.includes("mod") || d.includes("méd") || d.includes("med")) {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-[#d4ede8] text-[#1a4a3a]";
}

/**
 * @param {string} nome
 * @returns {string}
 */
function getInitials(nome) {
  return String(nome || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

/**
 * @param {object} props
 * @param {string} props.label
 * @param {string} props.value
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
 * @param {object} props
 * @param {object} props.rota
 * @param {(dias: number) => void} props.onFixarAtrativoDoDia
 * @param {() => void} props.onRemoverFixacao
 * @param {() => void} props.onDeactivate
 * @returns {import("react").JSX.Element}
 */
function AtrativoCard({ rota, onFixarAtrativoDoDia, onRemoverFixacao, onDeactivate }) {
  const capa = getCapaThumbFromAtrativo(rota);
  const meta = getCategoriaAtrativoMeta(rota.categoria);
  const pontos = getPontosCount(rota);
  const nome = getAtrativoNome(rota);
  const ativa = rota.ativa !== false;

  return (
    <article
      className={`group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 transition-all hover:shadow-lg ${
        ativa ? "ring-black/5 hover:ring-[#1a4a3a]/15" : "opacity-90 ring-red-100"
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54]">
        {capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={capa}
            alt=""
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-white/90">
            {getInitials(nome)}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#1a4a3a] shadow-sm backdrop-blur-sm">
            {meta.icone} {meta.nome}
          </span>
          {isAtrativoFixadoHoje(rota) && (
            <span className="rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-amber-950 shadow-sm">
              📌 Roteiro do dia
            </span>
          )}
        </div>

        <div className="absolute bottom-3 left-3 right-3">
          <h2 className="line-clamp-2 text-lg font-bold leading-snug text-white">{nome}</h2>
          <p className="mt-0.5 text-xs text-white/80">
            {rota.cidade || "Cidade não informada"}
            {pontos > 0 && ` · ${pontos} ${pontos === 1 ? "ponto" : "pontos"}`}
          </p>
        </div>
      </div>

      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 text-sm text-[#5a6b66]">
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#f7faf9] px-2 py-1 text-xs font-semibold">
            <span aria-hidden>⏱</span>
            {formatDuracao(rota.duracao_minutos)}
          </span>
          {rota.distancia_km != null && Number.isFinite(Number(rota.distancia_km)) && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-[#f7faf9] px-2 py-1 text-xs font-semibold">
              <span aria-hidden>📍</span>
              {Number(rota.distancia_km).toFixed(1)} km
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${dificuldadeBadgeClass(
              rota.dificuldade
            )}`}
          >
            {rota.dificuldade || "Fácil"}
          </span>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef3f1] pt-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              ativa ? "bg-[#d4ede8] text-[#1a4a3a]" : "bg-red-50 text-red-600"
            }`}
          >
            {ativa ? "Publicada" : "Inativa"}
          </span>

          <div className="flex flex-wrap items-center gap-2">
            {isAtrativoFixadoHoje(rota) ? (
              <button
                type="button"
                onClick={onRemoverFixacao}
                className="rounded-xl bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-200"
              >
                Remover fixação
              </button>
            ) : (
              ATRATIVO_DO_DIA_FIXAR_OPCOES.map((opcao) => (
                <button
                  key={opcao.dias}
                  type="button"
                  onClick={() => onFixarAtrativoDoDia(opcao.dias)}
                  className="rounded-xl bg-[#f0f4f3] px-2.5 py-1.5 text-xs font-semibold text-[#1a4a3a] hover:bg-[#e3e9e6]"
                >
                  Fixar {opcao.label}
                </button>
              ))
            )}
            {ativa && (
              <Link
                href={roteiroDetalhePath(rota.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl bg-[#f0f4f3] px-3 py-1.5 text-xs font-semibold text-[#1a4a3a] hover:bg-[#e3e9e6]"
              >
                Ver
              </Link>
            )}
            <Link
              href={adminRoteiroEditarPath(rota.id)}
              className="rounded-xl bg-[#1a4a3a] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#153d31]"
            >
              Editar
            </Link>
            {ativa && (
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
 * Listagem admin de atrativos com métricas, filtros e cards interativos.
 * @returns {import("react").JSX.Element}
 */
export default function AtrativosGridPage() {
  const { loading } = useAdminAuth();
  const { showToast } = useAdminToast();
  useAdminFlashToast({ enabled: !loading });
  const [atrativos, setAtrativos] = useState([]);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [status, setStatus] = useState("Todas");
  const [cidade, setCidade] = useState("Todas");

  const loadAtrativos = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("rotas")
      .select("*, rota_pontos(count)")
      .order("created_at", { ascending: false });

    setAtrativos(data ?? []);
  }, []);

  useEffect(() => {
    if (loading) return undefined;

    const timer = setTimeout(() => {
      loadAtrativos();
    }, 0);

    return () => clearTimeout(timer);
  }, [loading, loadAtrativos]);

  /**
   * @param {object} rota
   */
  async function fixarAtrativoDoDia(rota, dias) {
    const supabase = createClient();
    const { ate, error } = await aplicarFixacaoAtrativoDoDia(supabase, rota.id, dias);

    if (error) {
      showToast(error.message || "Não foi possível fixar o roteiro do dia.", {
        tone: "error",
      });
      return;
    }

    setAtrativos((items) =>
      items.map((item) => ({
        ...item,
        rota_do_dia_fixada_ate: item.id === rota.id ? ate : null,
      }))
    );
    showToast(`Roteiro do dia fixado até ${ate}.`);
  }

  async function removerFixacao(rota) {
    const supabase = createClient();
    const { error } = await removerFixacaoAtrativoDoDia(supabase, rota.id);

    if (error) {
      showToast(error.message || "Não foi possível remover a fixação.", {
        tone: "error",
      });
      return;
    }

    setAtrativos((items) =>
      items.map((item) =>
        item.id === rota.id ? { ...item, rota_do_dia_fixada_ate: null } : item
      )
    );
    showToast("Fixação do roteiro do dia removida.");
  }

  /**
   * @param {object} rota
   */
  async function softDelete(rota) {
    const confirmed = window.confirm(`Desativar o roteiro "${getAtrativoNome(rota)}"?`);
    if (!confirmed) return;

    const supabase = createClient();
    setAtrativos((items) =>
      items.map((item) => (item.id === rota.id ? { ...item, ativa: false } : item))
    );
    await supabase.from("rotas").update({ ativa: false }).eq("id", rota.id);
    showToast("Roteiro desativado.");
  }

  const stats = useMemo(() => {
    const ativas = atrativos.filter((r) => r.ativa !== false).length;
    const fixadaHoje = atrativos.filter((r) => isAtrativoFixadoHoje(r)).length;
    return {
      total: atrativos.length,
      ativas,
      inativas: atrativos.length - ativas,
      fixadaHoje,
    };
  }, [atrativos]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return atrativos.filter((rota) => {
      const nome = getAtrativoNome(rota).toLowerCase();
      const matchesSearch =
        !term ||
        nome.includes(term) ||
        String(rota.cidade || "")
          .toLowerCase()
          .includes(term);
      const cat = normalizeCategoriaAtrativo(rota.categoria);
      const matchesCategoria = categoria === "Todas" || cat === categoria;
      const ativa = rota.ativa !== false;
      const matchesStatus =
        status === "Todas" ||
        (status === "Ativas" && ativa) ||
        (status === "Inativas" && !ativa) ||
        (status === "Fixada hoje" && isAtrativoFixadoHoje(rota));
      const matchesCidade = cidade === "Todas" || rota.cidade === cidade;

      return matchesSearch && matchesCategoria && matchesStatus && matchesCidade;
    });
  }, [atrativos, search, categoria, status, cidade]);

  const novoAtrativoLink = (
    <Link
      href={ADMIN_ROTEIROS_NOVA_PATH}
      className="inline-flex items-center gap-2 rounded-xl bg-[#1a4a3a] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1a4a3a]/25 transition hover:bg-[#153d31]"
    >
      <span className="text-lg leading-none">+</span>
      Novo roteiro
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
      title="Roteiros"
      subtitle="Trilhas, roteiros e percursos curados para o app"
      headerAction={novoAtrativoLink}
    >
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} accent="text-[#1a4a3a]" />
        <StatCard
          label="Publicadas"
          value={stats.ativas}
          hint="visíveis no app"
          accent="text-emerald-700"
        />
        <StatCard
          label="Fixada hoje"
          value={stats.fixadaHoje}
          hint="override da rotação diária"
          accent="text-amber-700"
        />
        <StatCard label="Inativas" value={stats.inativas} accent="text-[#5a6b66]" />
      </div>

      <div className="mb-5 space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa8a3]">
            🔍
          </span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou cidade..."
            className="w-full rounded-xl bg-[#f0f4f3] py-2.5 pl-10 pr-3 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
          />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9aa8a3]">
            Tipo de roteiro
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterChip active={categoria === "Todas"} onClick={() => setCategoria("Todas")}>
              Todas
            </FilterChip>
            {CATEGORIAS_ATRATIVO.map((item) => (
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
              {["Todas", "Ativas", "Inativas", "Fixada hoje"].map((item) => (
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
        {atrativos.length} roteiros
      </p>

      {filtered.length === 0 ? (
        <AdminEmptyState
          title={
            atrativos.length === 0
              ? "Nenhum roteiro cadastrado"
              : "Nenhum roteiro encontrado"
          }
          description={
            atrativos.length === 0
              ? "Crie o primeiro roteiro curado do guia."
              : "Ajuste os filtros ou a busca para ver outros resultados."
          }
          actionLabel={atrativos.length === 0 ? "Criar roteiro" : "Limpar filtros"}
          actionHref={atrativos.length === 0 ? ADMIN_ROTEIROS_NOVA_PATH : undefined}
          onAction={
            atrativos.length === 0
              ? undefined
              : () => {
                  setSearch("");
                  setCategoria("Todas");
                  setStatus("Todas");
                  setCidade("Todas");
                }
          }
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((rota) => (
            <AtrativoCard
              key={rota.id}
              rota={rota}
              onFixarAtrativoDoDia={(dias) => fixarAtrativoDoDia(rota, dias)}
              onRemoverFixacao={() => removerFixacao(rota)}
              onDeactivate={() => softDelete(rota)}
            />
          ))}
        </div>
      )}
    </AdminShell>
  );
}
