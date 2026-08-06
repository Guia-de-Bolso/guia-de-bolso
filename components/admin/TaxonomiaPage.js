"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import { getCategoriasVisiveis } from "@/lib/categorias";
import {
  CATEGORIAS_TAXONOMIA,
  countLugaresComSubcategoria,
  createSubcategoriaAdmin,
  createTagAdmin,
  deleteSubcategoriaAdmin,
  deleteTagAdmin,
  fetchSubcategoriaUsageMap,
  fetchSubcategoriasAdmin,
  fetchTagUsageMap,
  fetchTagsAdmin,
  formatCategoriasLabel,
  formatSubcategoriasLabel,
  tagFormHasSubcategoria,
  toggleTagFormSubcategoria,
  updateSubcategoriaAdmin,
  updateTagAdmin,
} from "@/lib/adminTaxonomia";
import { tagMatchesSubcategoria } from "@/lib/tagSubcategorias";
import { createClient } from "@/lib/supabase";

const TABS = [
  { id: "subcategorias", label: "Subcategorias" },
  { id: "tags", label: "Tags" },
];

const categoryStyles = {
  Natureza: "bg-[#d4ede8] text-[#1a4a3a]",
  Gastronomia: "bg-[#f0e4d4] text-[#6b5344]",
  Noite: "bg-[#e4d4f0] text-[#5c4a6e]",
  Serviços: "bg-[#c5dff5] text-[#2a5a7a]",
  Cultura: "bg-purple-100 text-purple-700",
  Aventura: "bg-orange-100 text-orange-700",
  "Bem-estar": "bg-pink-100 text-pink-700",
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
      <div
        className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed inset-x-4 top-[10%] z-50 mx-auto max-h-[80vh] max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl md:inset-x-auto md:left-1/2 md:-translate-x-1/2"
        role="dialog"
        aria-modal="true"
        aria-labelledby="taxonomia-modal-title"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id="taxonomia-modal-title" className="text-lg font-bold text-[#1a2e28]">
            {title}
          </h2>
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
 * Admin — CRUD de subcategorias e tags.
 * @returns {import("react").JSX.Element}
 */
export default function TaxonomiaPage() {
  const { loading: authLoading } = useAdminAuth();
  const [tab, setTab] = useState("subcategorias");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [subcategorias, setSubcategorias] = useState([]);
  const [subUsage, setSubUsage] = useState(new Map());
  const [filtroCategoriaSub, setFiltroCategoriaSub] = useState("Todas");
  const [buscaSub, setBuscaSub] = useState("");

  const [tags, setTags] = useState([]);
  const [tagUsage, setTagUsage] = useState(new Map());
  const [filtroCategoriaTag, setFiltroCategoriaTag] = useState("Todas");
  const [filtroSubcategoriaTag, setFiltroSubcategoriaTag] = useState("Todas");
  const [buscaTag, setBuscaTag] = useState("");

  const [subModal, setSubModal] = useState(null);
  const [tagModal, setTagModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [subForm, setSubForm] = useState({
    categoria: CATEGORIAS_TAXONOMIA[0],
    nome: "",
    icone: "",
    migrarLugares: true,
  });
  const [subLugarCount, setSubLugarCount] = useState(0);

  const [tagForm, setTagForm] = useState({
    nome: "",
    icone: "",
    categorias: [],
    subcategorias: [],
    aplica_em_rotas: false,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const [subs, subsMap, tagsList, tagsMap] = await Promise.all([
      fetchSubcategoriasAdmin(supabase),
      fetchSubcategoriaUsageMap(supabase),
      fetchTagsAdmin(supabase),
      fetchTagUsageMap(supabase),
    ]);

    setSubcategorias(subs);
    setSubUsage(subsMap);
    setTags(tagsList);
    setTagUsage(tagsMap);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    loadData();
  }, [authLoading, loadData]);

  const subsFiltradas = useMemo(() => {
    const term = buscaSub.trim().toLowerCase();
    return subcategorias.filter((item) => {
      if (filtroCategoriaSub !== "Todas" && item.categoria !== filtroCategoriaSub) {
        return false;
      }
      if (!term) return true;
      return (
        item.nome?.toLowerCase().includes(term) ||
        item.categoria?.toLowerCase().includes(term)
      );
    });
  }, [subcategorias, filtroCategoriaSub, buscaSub]);

  const subcategoriasFiltroTag = useMemo(() => {
    if (filtroCategoriaTag === "Todas" || filtroCategoriaTag === "Atrativos") {
      return subcategorias;
    }
    return subcategorias.filter((item) => item.categoria === filtroCategoriaTag);
  }, [subcategorias, filtroCategoriaTag]);

  const tagsFiltradas = useMemo(() => {
    const term = buscaTag.trim().toLowerCase();
    return tags.filter((item) => {
      if (filtroCategoriaTag === "Atrativos") {
        if (!item.aplica_em_rotas) return false;
      } else if (filtroCategoriaTag !== "Todas") {
        if (!item.categorias?.includes(filtroCategoriaTag)) return false;
      }

      if (filtroSubcategoriaTag !== "Todas") {
        const [cat, sub] = filtroSubcategoriaTag.split("::");
        if (!tagMatchesSubcategoria(item, cat, sub)) return false;
      }

      if (!term) return true;
      return (
        item.nome?.toLowerCase().includes(term) ||
        item.subcategorias?.some(
          (ref) =>
            ref.nome?.toLowerCase().includes(term) ||
            ref.categoria?.toLowerCase().includes(term)
        )
      );
    });
  }, [tags, filtroCategoriaTag, filtroSubcategoriaTag, buscaTag]);

  const stats = useMemo(
    () => ({
      subcategorias: subcategorias.length,
      tags: tags.length,
      tagsAtrativos: tags.filter((t) => t.aplica_em_rotas).length,
    }),
    [subcategorias, tags]
  );

  function openNovaSub() {
    setMessage("");
    setSubForm({
      categoria: CATEGORIAS_TAXONOMIA[0],
      nome: "",
      icone: "",
      migrarLugares: true,
    });
    setSubLugarCount(0);
    setSubModal({ mode: "create" });
  }

  /**
   * @param {object} item
   */
  async function openEditSub(item) {
    setMessage("");
    setSubForm({
      categoria: item.categoria,
      nome: item.nome,
      icone: item.icone || "",
      migrarLugares: true,
    });
    setSubModal({
      mode: "edit",
      id: item.id,
      nomeAntigo: item.nome,
      categoriaAntiga: item.categoria,
    });

    const supabase = createClient();
    const count = await countLugaresComSubcategoria(supabase, item.categoria, item.nome);
    setSubLugarCount(count);
  }

  function openNovaTag() {
    setMessage("");
    setTagForm({
      nome: "",
      icone: "",
      categorias: [],
      subcategorias: [],
      aplica_em_rotas: false,
    });
    setTagModal({ mode: "create" });
  }

  /**
   * @param {object} item
   */
  function openEditTag(item) {
    setMessage("");
    setTagForm({
      nome: item.nome,
      icone: item.icone || "",
      categorias: [...(item.categorias || [])],
      subcategorias: [...(item.subcategorias || [])],
      aplica_em_rotas: Boolean(item.aplica_em_rotas),
    });
    setTagModal({ mode: "edit", id: item.id });
  }

  /**
   * @param {import("react").FormEvent} event
   * @returns {Promise<void>}
   */
  async function handleSubSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const subMudou =
      subModal?.mode === "edit" &&
      (subForm.nome.trim() !== subModal.nomeAntigo ||
        subForm.categoria !== subModal.categoriaAntiga);

    let result;

    if (subModal?.mode === "create") {
      result = await createSubcategoriaAdmin(supabase, subForm);
    } else {
      result = await updateSubcategoriaAdmin(supabase, subModal.id, {
        ...subForm,
        nomeAntigo: subModal.nomeAntigo,
        categoriaAntiga: subModal.categoriaAntiga,
        migrarLugares: subMudou && subForm.migrarLugares,
      });
    }

    setSaving(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setSubModal(null);
    setMessage(
      subModal?.mode === "create"
        ? "Subcategoria criada."
        : subMudou && subForm.migrarLugares
          ? "Subcategoria atualizada e lugares migrados."
          : "Subcategoria atualizada."
    );
    await loadData();
  }

  /**
   * @param {import("react").FormEvent} event
   * @returns {Promise<void>}
   */
  async function handleTagSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const result =
      tagModal?.mode === "create"
        ? await createTagAdmin(supabase, tagForm)
        : await updateTagAdmin(supabase, tagModal.id, tagForm);

    setSaving(false);

    if (result.error) {
      setMessage(result.error);
      return;
    }

    setTagModal(null);
    setMessage(tagModal?.mode === "create" ? "Tag criada." : "Tag atualizada.");
    await loadData();
  }

  /**
   * @returns {Promise<void>}
   */
  async function confirmDelete() {
    if (!deleteTarget) return;

    setSaving(true);
    setMessage("");
    const supabase = createClient();

    const result =
      deleteTarget.type === "sub"
        ? await deleteSubcategoriaAdmin(supabase, deleteTarget.item)
        : await deleteTagAdmin(supabase, deleteTarget.item);

    setSaving(false);
    setDeleteTarget(null);

    if (!result.ok) {
      setMessage(result.error || "Não foi possível excluir.");
      return;
    }

    setMessage("Excluído com sucesso.");
    await loadData();
  }

  /**
   * @param {{ categoria: string, nome: string }} ref
   */
  function toggleTagSubcategoria(ref) {
    setTagForm((current) => ({
      ...current,
      subcategorias: toggleTagFormSubcategoria(current.subcategorias, ref),
    }));
  }

  const subMudou =
    subModal?.mode === "edit" &&
    (subForm.nome.trim() !== subModal.nomeAntigo ||
      subForm.categoria !== subModal.categoriaAntiga);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell
      title="Taxonomia"
      subtitle="Subcategorias e tags do catálogo"
      contentClassName="bg-[#f0f4f3]"
    >
      {message && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 text-sm font-medium text-[#1a2e28] shadow-sm ring-1 ring-black/5">
          <span>{message}</span>
          <button
            type="button"
            onClick={() => setMessage("")}
            className="shrink-0 text-xs text-[#5a6b66] hover:underline"
          >
            Fechar
          </button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
            Subcategorias
          </p>
          <p className="mt-1 text-2xl font-bold text-[#1a4a3a]">{stats.subcategorias}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">Tags</p>
          <p className="mt-1 text-2xl font-bold text-[#1a4a3a]">{stats.tags}</p>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
            Tags em atrativos
          </p>
          <p className="mt-1 text-2xl font-bold text-purple-700">{stats.tagsAtrativos}</p>
        </div>
      </div>

      <div className="mb-5 flex gap-2 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-black/5">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === item.id
                ? "bg-[#1a4a3a] text-white"
                : "text-[#5a6b66] hover:bg-[#f7faf9]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "subcategorias" && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={openNovaSub}
              className="rounded-xl bg-[#1a4a3a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1a4a3a]/25"
            >
              + Nova subcategoria
            </button>
          </div>

          <div className="mb-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <input
              type="search"
              value={buscaSub}
              onChange={(e) => setBuscaSub(e.target.value)}
              placeholder="Buscar subcategoria…"
              className="w-full rounded-xl bg-[#f0f4f3] px-4 py-2.5 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterChip
                active={filtroCategoriaSub === "Todas"}
                onClick={() => setFiltroCategoriaSub("Todas")}
              >
                Todas
              </FilterChip>
              {getCategoriasVisiveis().map((cat) => (
                <FilterChip
                  key={cat.nome}
                  active={filtroCategoriaSub === cat.nome}
                  onClick={() => setFiltroCategoriaSub(cat.nome)}
                >
                  {cat.icone} {cat.nome}
                </FilterChip>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/80" />
              ))}
            </div>
          ) : subsFiltradas.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#5a6b66] shadow-sm">
              Nenhuma subcategoria encontrada.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {subsFiltradas.map((item) => {
                const uso =
                  subUsage.get(`${item.categoria}::${item.nome}`) || 0;
                const catClass =
                  categoryStyles[item.categoria] || "bg-gray-100 text-gray-600";

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl" aria-hidden>
                        {item.icone || "📁"}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${catClass}`}
                      >
                        {item.categoria}
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold text-[#1a2e28]">{item.nome}</h3>
                    <p className="mt-1 text-xs text-[#9aa8a3]">
                      {uso === 0
                        ? "Nenhum local"
                        : `${uso} local${uso !== 1 ? "is" : ""}`}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditSub(item)}
                        className="flex-1 rounded-lg bg-[#f0f4f3] py-2 text-xs font-semibold text-[#1a4a3a]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: "sub", item })
                        }
                        disabled={uso > 0}
                        title={
                          uso > 0
                            ? "Remova ou migre os locais antes de excluir"
                            : "Excluir"
                        }
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {tab === "tags" && (
        <>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={openNovaTag}
              className="rounded-xl bg-[#1a4a3a] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#1a4a3a]/25"
            >
              + Nova tag
            </button>
          </div>

          <div className="mb-4 space-y-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <input
              type="search"
              value={buscaTag}
              onChange={(e) => setBuscaTag(e.target.value)}
              placeholder="Buscar tag…"
              className="w-full rounded-xl bg-[#f0f4f3] px-4 py-2.5 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
            />
            <div className="flex gap-2 overflow-x-auto pb-1">
              <FilterChip
                active={filtroCategoriaTag === "Todas"}
                onClick={() => setFiltroCategoriaTag("Todas")}
              >
                Todas
              </FilterChip>
              <FilterChip
                active={filtroCategoriaTag === "Atrativos"}
                onClick={() => setFiltroCategoriaTag("Atrativos")}
              >
                🗺️ Atrativos
              </FilterChip>
              {getCategoriasVisiveis().map((cat) => (
                <FilterChip
                  key={cat.nome}
                  active={filtroCategoriaTag === cat.nome}
                  onClick={() => {
                    setFiltroCategoriaTag(cat.nome);
                    setFiltroSubcategoriaTag("Todas");
                  }}
                >
                  {cat.icone} {cat.nome}
                </FilterChip>
              ))}
            </div>
            {subcategoriasFiltroTag.length > 0 && filtroCategoriaTag !== "Atrativos" && (
              <div className="flex flex-wrap gap-2 border-t border-[#e3e9e6] pt-3">
                <FilterChip
                  active={filtroSubcategoriaTag === "Todas"}
                  onClick={() => setFiltroSubcategoriaTag("Todas")}
                >
                  Todas subcategorias
                </FilterChip>
                {subcategoriasFiltroTag.map((sub) => {
                  const key = `${sub.categoria}::${sub.nome}`;
                  return (
                    <FilterChip
                      key={key}
                      active={filtroSubcategoriaTag === key}
                      onClick={() => setFiltroSubcategoriaTag(key)}
                    >
                      {sub.icone ? `${sub.icone} ` : ""}
                      {sub.nome}
                    </FilterChip>
                  );
                })}
              </div>
            )}
          </div>

          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/80" />
              ))}
            </div>
          ) : tagsFiltradas.length === 0 ? (
            <p className="rounded-2xl bg-white p-8 text-center text-sm text-[#5a6b66] shadow-sm">
              Nenhuma tag encontrada.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tagsFiltradas.map((item) => {
                const uso = tagUsage.get(item.id) || { lugares: 0, atrativos: 0 };
                const totalUso = uso.lugares + uso.atrativos;

                return (
                  <article
                    key={item.id}
                    className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl" aria-hidden>
                        {item.icone || "🏷️"}
                      </span>
                      {item.aplica_em_rotas && (
                        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-purple-800">
                          Atrativos
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 font-bold text-[#1a2e28]">{item.nome}</h3>
                    <p className="mt-1 text-xs text-[#5a6b66]">
                      {formatSubcategoriasLabel(item.subcategorias)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#9aa8a3]">
                      {formatCategoriasLabel(item.categorias)}
                    </p>
                    <p className="mt-0.5 text-xs text-[#9aa8a3]">
                      {totalUso === 0
                        ? "Sem uso"
                        : [
                            uso.lugares > 0 && `${uso.lugares} local(is)`,
                            uso.atrativos > 0 && `${uso.atrativos} atrativo(s)`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditTag(item)}
                        className="flex-1 rounded-lg bg-[#f0f4f3] py-2 text-xs font-semibold text-[#1a4a3a]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ type: "tag", item })
                        }
                        disabled={totalUso > 0}
                        title={
                          totalUso > 0
                            ? "Tag em uso — remova dos locais/atrativos antes"
                            : "Excluir"
                        }
                        className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Excluir
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <AdminModal
        open={Boolean(subModal)}
        title={subModal?.mode === "create" ? "Nova subcategoria" : "Editar subcategoria"}
        onClose={() => !saving && setSubModal(null)}
      >
        <form onSubmit={handleSubSubmit} className="space-y-4">
          <Field label="Categoria">
            <select
              value={subForm.categoria}
              onChange={(e) =>
                setSubForm((c) => ({ ...c, categoria: e.target.value }))
              }
              className="w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm outline-none"
              required
            >
              {CATEGORIAS_TAXONOMIA.map((nome) => (
                <option key={nome} value={nome}>
                  {nome}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Nome">
            <input
              value={subForm.nome}
              onChange={(e) => setSubForm((c) => ({ ...c, nome: e.target.value }))}
              className="w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
              required
            />
          </Field>
          <Field label="Ícone (emoji)">
            <input
              value={subForm.icone}
              onChange={(e) => setSubForm((c) => ({ ...c, icone: e.target.value }))}
              placeholder="🏖️"
              maxLength={8}
              className="w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
            />
          </Field>

          {subMudou && subLugarCount > 0 && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200">
              <input
                type="checkbox"
                checked={subForm.migrarLugares}
                onChange={(e) =>
                  setSubForm((c) => ({
                    ...c,
                    migrarLugares: e.target.checked,
                  }))
                }
                className="mt-0.5"
              />
              <span>
                Migrar <strong>{subLugarCount}</strong> local
                {subLugarCount !== 1 ? "is" : ""} de &quot;{subModal.nomeAntigo}&quot; para
                &quot;{subForm.nome.trim()}&quot;
              </span>
            </label>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSubModal(null)}
              disabled={saving}
              className="flex-1 rounded-xl bg-[#f0f4f3] py-2.5 text-sm font-semibold text-[#5a6b66]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#1a4a3a] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={Boolean(tagModal)}
        title={tagModal?.mode === "create" ? "Nova tag" : "Editar tag"}
        onClose={() => !saving && setTagModal(null)}
      >
        <form onSubmit={handleTagSubmit} className="space-y-4">
          <Field label="Nome">
            <input
              value={tagForm.nome}
              onChange={(e) => setTagForm((c) => ({ ...c, nome: e.target.value }))}
              className="w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
              required
            />
          </Field>
          <Field label="Ícone (emoji)">
            <input
              value={tagForm.icone}
              onChange={(e) => setTagForm((c) => ({ ...c, icone: e.target.value }))}
              placeholder="🏄"
              maxLength={8}
              className="w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
            />
          </Field>

          <div>
            <p className="text-sm font-semibold text-[#1a2e28]">Subcategorias</p>
            <p className="mt-0.5 text-xs text-[#9aa8a3]">
              Onde a tag aparece no formulário de locais (após escolher categoria e
              subcategoria).
            </p>
            <div className="mt-3 max-h-56 space-y-3 overflow-y-auto rounded-xl bg-[#f7faf9] p-3">
              {getCategoriasVisiveis().map((cat) => {
                const subs = subcategorias.filter((item) => item.categoria === cat.nome);
                if (subs.length === 0) return null;

                return (
                  <div key={cat.nome}>
                    <p className="text-xs font-bold text-[#1a4a3a]">
                      {cat.icone} {cat.nome}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {subs.map((sub) => {
                        const ref = { categoria: sub.categoria, nome: sub.nome };
                        const active = tagFormHasSubcategoria(tagForm.subcategorias, ref);
                        return (
                          <button
                            key={`${sub.categoria}-${sub.id}`}
                            type="button"
                            onClick={() => toggleTagSubcategoria(ref)}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                              active
                                ? "bg-[#1a4a3a] text-white"
                                : "bg-white text-[#5a6b66] ring-1 ring-[#e3e9e6]"
                            }`}
                          >
                            {sub.icone ? `${sub.icone} ` : ""}
                            {sub.nome}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            {tagForm.subcategorias.length > 0 && (
              <p className="mt-2 text-xs text-[#5a6b66]">
                Selecionadas: {formatSubcategoriasLabel(tagForm.subcategorias)}
              </p>
            )}
          </div>

          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-[#f7faf9] p-3 text-sm">
            <input
              type="checkbox"
              checked={tagForm.aplica_em_rotas}
              onChange={(e) =>
                setTagForm((c) => ({
                  ...c,
                  aplica_em_rotas: e.target.checked,
                }))
              }
            />
            <span>
              <span className="font-semibold text-[#1a2e28]">Aplica em atrativos</span>
              <span className="mt-0.5 block text-xs text-[#5a6b66]">
                Disponível no admin de atrativos curados
              </span>
            </span>
          </label>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTagModal(null)}
              disabled={saving}
              className="flex-1 rounded-xl bg-[#f0f4f3] py-2.5 text-sm font-semibold text-[#5a6b66]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-xl bg-[#1a4a3a] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </AdminModal>

      <AdminModal
        open={Boolean(deleteTarget)}
        title="Confirmar exclusão"
        onClose={() => !saving && setDeleteTarget(null)}
      >
        <p className="text-sm text-[#5a6b66]">
          {deleteTarget?.type === "sub"
            ? `Excluir a subcategoria "${deleteTarget.item.nome}" (${deleteTarget.item.categoria})? Esta ação não pode ser desfeita.`
            : `Excluir a tag "${deleteTarget?.item?.nome}"? Esta ação não pode ser desfeita.`}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            disabled={saving}
            className="flex-1 rounded-xl bg-[#f0f4f3] py-2.5 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={saving}
            className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Excluindo…" : "Excluir"}
          </button>
        </div>
      </AdminModal>
    </AdminShell>
  );
}
