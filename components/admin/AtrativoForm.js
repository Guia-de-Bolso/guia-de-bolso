"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminStickySaveBar from "@/components/admin/AdminStickySaveBar";
import { useAdminToast } from "@/components/admin/AdminToastContext";
import EnderecoAutocomplete from "@/components/EnderecoAutocomplete";
import PhotoUploader from "@/components/admin/PhotoUploader";
import { getInitialPhotoItems, getPhotoEntryUrl } from "@/lib/fotos";
import {
  buildFotosUrlsFromPhotoItems,
  createPhotoItemFromFile,
  getPendingFilesFromPhotoItems,
  movePhotoItemToCover,
  movePhotoItem,
  revokePhotoItemPreview,
} from "@/lib/photoItems";
import {
  assignPontoDetalhesOrdem,
  mapPontoFromDb,
  sortPontoDetalhes,
} from "@/lib/atrativoPontos";
import {
  CATEGORIA_ATRATIVO_PADRAO,
  CATEGORIAS_ATRATIVO,
  CATEGORIAS_ATRATIVO_RESERVADAS,
  MAX_TAGS_ATRATIVO,
  normalizeCategoriaAtrativo,
} from "@/lib/atrativos";
import { ADMIN_ROTEIROS_PATH } from "@/lib/roteirosPaths";
import {
  ATRATIVO_DO_DIA_FIXAR_OPCOES,
  aplicarFixacaoAtrativoDoDia,
  isAtrativoFixadoHoje,
  removerFixacaoAtrativoDoDia,
} from "@/lib/atrativoDoDia";
import { createClient } from "@/lib/supabase";
import {
  ROTAS_FOTOS_BUCKET,
  uploadEntityPhotos,
} from "@/lib/storageUpload";
import {
  fetchTagsParaAtrativos,
  filterTagIdsByCategoriaAtrativo,
  filterTagsByCategoriaAtrativo,
  getTagIds,
} from "@/lib/tags";

const emptyForm = {
  nome: "",
  descricao: "",
  cidade: "Imbituba",
  categoria: CATEGORIA_ATRATIVO_PADRAO,
  dificuldade: "Fácil",
  duracao_minutos: "",
  distancia_km: "",
  ativa: true,
};

function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold text-[#1a2e28]">
      {label}
      {children}
    </label>
  );
}

function inputClass() {
  return "mt-1 w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2";
}

function createClientId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Botão expandir/recolher reutilizado em seções e itens.
 * @param {object} props
 * @param {boolean} props.expanded
 * @param {() => void} props.onClick
 * @param {string} [props.className]
 * @returns {import("react").JSX.Element}
 */
function ExpandToggleButton({ expanded, onClick, className = "" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      className={`flex shrink-0 items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#1a4a3a] shadow-sm ring-1 ring-[#1a4a3a]/10 ${className}`}
    >
      {expanded ? "Recolher" : "Expandir"}
      <svg
        className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

/**
 * Card de item (ponto ou dica) com cabeçalho recolhível quando há conteúdo.
 * @param {object} props
 * @param {number} props.index
 * @param {string} props.title
 * @param {string} [props.subtitle]
 * @param {boolean} props.expanded
 * @param {() => void} props.onToggle
 * @param {boolean} props.collapsible
 * @param {string} [props.badgeClassName]
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").JSX.Element}
 */
function CollapsibleItemCard({
  index,
  title,
  subtitle,
  expanded,
  onToggle,
  collapsible,
  badgeClassName = "bg-[#1a4a3a] text-white",
  children,
}) {
  return (
    <article className="rounded-2xl bg-white p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${badgeClassName}`}
        >
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-[#1a2e28]">{title}</p>
              {collapsible && !expanded && subtitle && (
                <p className="mt-0.5 line-clamp-2 text-xs text-[#5a6b66]">{subtitle}</p>
              )}
            </div>
            {collapsible && <ExpandToggleButton expanded={expanded} onClick={onToggle} />}
          </div>
          {(expanded || !collapsible) && <div className="mt-3 grid gap-3">{children}</div>}
        </div>
      </div>
    </article>
  );
}

/**
 * Seção do formulário que pode ser recolhida quando já há itens cadastrados.
 * @param {object} props
 * @param {string} props.title
 * @param {string} props.description
 * @param {number} props.count
 * @param {string} props.countLabel
 * @param {boolean} props.expanded
 * @param {() => void} props.onToggle
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").JSX.Element}
 */
function CollapsibleFormSection({
  title,
  description,
  count,
  countLabel,
  expanded,
  onToggle,
  children,
}) {
  const collapsible = count > 0;

  return (
    <section className="mt-6 rounded-2xl bg-[#f7faf9] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-[#1a2e28]">{title}</h2>
            {count > 0 && (
              <span className="rounded-full bg-[#d4ede8] px-2.5 py-0.5 text-xs font-bold text-[#1a4a3a]">
                {count} {countLabel}
              </span>
            )}
          </div>
          {expanded || !collapsible ? (
            <p className="mt-1 text-sm text-[#5a6b66]">{description}</p>
          ) : (
            <p className="mt-1 text-sm text-[#5a6b66]">
              Conteúdo cadastrado. Expanda para visualizar e editar.
            </p>
          )}
        </div>
        {collapsible && (
          <ExpandToggleButton expanded={expanded} onClick={onToggle} />
        )}
      </div>
      {(expanded || !collapsible) && <div className="mt-4">{children}</div>}
    </section>
  );
}

function formatAtrativoSaveError(error) {
  const message = error?.message || "";
  const missingTables = [
    { name: "rota_ponto_detalhes", file: "supabase/rota_ponto_detalhes.sql" },
    { name: "rotas_localizacoes", file: "supabase/rotas_localizacoes.sql" },
    { name: "rota_dicas", file: "supabase/rota_dicas.sql" },
  ];

  for (const table of missingTables) {
    if (message.includes(table.name)) {
      return `A tabela ${table.name} ainda não existe no Supabase. Abra o SQL Editor do projeto e execute o arquivo ${table.file}.`;
    }
  }

  return message || "Não foi possível salvar o roteiro. Tente novamente.";
}

function normalizeAtrativo(rota) {
  return {
    ...emptyForm,
    ...(rota ?? {}),
    nome: rota?.nome || rota?.titulo || "",
    categoria: normalizeCategoriaAtrativo(rota?.categoria),
    duracao_minutos: rota?.duracao_minutos ?? "",
    distancia_km: rota?.distancia_km ?? "",
    ativa: rota?.ativa ?? true,
  };
}

/**
 * Formulário admin de criação/edição de rota turística com fotos, tags e pontos do percurso.
 * @param {object} props
 * @param {object|null} [props.initialData] - Dados da rota em edição.
 * @param {Array<object>} [props.initialPontos] - Pontos de `rota_pontos`.
 * @param {Array<{ texto?: string, ordem?: number }>} [props.initialDicas] - Dicas de `rota_dicas`.
 * @param {object|null} [props.initialLocalizacao] - Registro de `rotas_localizacoes`.
 * @param {string[]} [props.initialTagIds] - IDs de tags já vinculadas.
 * @param {string|null} [props.editingId] - UUID da rota; null para criar.
 * @returns {import("react").JSX.Element}
 */
export default function AtrativoForm({
  initialData = null,
  initialPontos = [],
  initialDicas = [],
  initialLocalizacao = null,
  initialTagIds = [],
  editingId = null,
}) {
  const router = useRouter();
  const { showToast } = useAdminToast();
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [photoError, setPhotoError] = useState("");
  const [tagLimitMessage, setTagLimitMessage] = useState("");
  const [form, setForm] = useState(normalizeAtrativo(initialData));
  const [photoItems, setPhotoItems] = useState(() =>
    getInitialPhotoItems(initialData, "foto_capa")
  );
  const [pontos, setPontos] = useState(() =>
    initialPontos.map((ponto, index) => ({
      ...mapPontoFromDb(ponto, index),
      clientId: ponto.id ? `ponto-${ponto.id}` : createClientId("ponto"),
    }))
  );
  const [novoPonto, setNovoPonto] = useState({ nome: "", novaDescricao: "", detalhes: [] });
  const [dicas, setDicas] = useState(
    initialDicas.map((dica, index) => ({
      texto: dica.texto || "",
      ordem: dica.ordem || index + 1,
      clientId: dica.id ? `dica-${dica.id}` : createClientId("dica"),
    }))
  );
  const [novaDica, setNovaDica] = useState("");
  const [localizacao, setLocalizacao] = useState(initialLocalizacao);
  const [pontosExpanded, setPontosExpanded] = useState(() => initialPontos.length === 0);
  const [dicasExpanded, setDicasExpanded] = useState(() => initialDicas.length === 0);
  const [expandedPontoIds, setExpandedPontoIds] = useState(() => new Set());
  const [expandedDicaIds, setExpandedDicaIds] = useState(() => new Set());
  const [pontoNovaDescricao, setPontoNovaDescricao] = useState({});
  const [tags, setTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState(() =>
    initialTagIds.map((id) => String(id))
  );

  useEffect(() => {
    const supabase = createClient();
    fetchTagsParaAtrativos(supabase).then(setTags);
  }, []);

  useEffect(() => {
    if (tags.length === 0) return;

    setSelectedTagIds((current) =>
      filterTagIdsByCategoriaAtrativo(current, tags, form.categoria).slice(0, MAX_TAGS_ATRATIVO)
    );
    setTagLimitMessage("");
  }, [form.categoria, tags]);

  const visibleTags = filterTagsByCategoriaAtrativo(tags, form.categoria);

  function toggleTag(tagId) {
    setDirty(true);
    setTagLimitMessage("");
    setSelectedTagIds((current) => {
      if (current.includes(tagId)) {
        return current.filter((id) => id !== tagId);
      }
      if (current.length >= MAX_TAGS_ATRATIVO) {
        setTagLimitMessage(`Você pode selecionar no máximo ${MAX_TAGS_ATRATIVO} tags.`);
        return current;
      }
      return [...current, tagId];
    });
  }

  function addPhotoFiles(files) {
    setDirty(true);
    setPhotoError("");
    setPhotoItems((current) => [
      ...current,
      ...files.map((file) => createPhotoItemFromFile(file)),
    ]);
  }

  function removePhotoItem(id) {
    setDirty(true);
    setPhotoItems((current) => {
      const item = current.find((entry) => entry.id === id);
      revokePhotoItemPreview(item);
      return current.filter((entry) => entry.id !== id);
    });
  }

  function setPhotoCover(id) {
    setDirty(true);
    setPhotoItems((current) => movePhotoItemToCover(current, id));
  }

  /**
   * @param {string} id
   * @param {-1|1} direction
   */
  function reorderPhotoItem(id, direction) {
    setDirty(true);
    setPhotoItems((current) => movePhotoItem(current, id, direction));
  }

  function toggleExpandedId(setter, clientId) {
    setter((current) => {
      const next = new Set(current);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  }

  function removeExpandedId(setter, clientId) {
    if (!clientId) return;
    setter((current) => {
      if (!current.has(clientId)) return current;
      const next = new Set(current);
      next.delete(clientId);
      return next;
    });
  }

  function updatePonto(index, field, value) {
    setDirty(true);
    setPontos((current) =>
      current.map((ponto, itemIndex) =>
        itemIndex === index ? { ...ponto, [field]: value } : ponto
      )
    );
  }

  function addDetalheToNovoPonto() {
    if (!novoPonto.novaDescricao.trim()) return;

    setDirty(true);
    setNovoPonto((current) => ({
      ...current,
      detalhes: sortPontoDetalhes([
        ...current.detalhes,
        { texto: current.novaDescricao.trim(), ordem: current.detalhes.length + 1 },
      ]),
      novaDescricao: "",
    }));
  }

  function removeDetalheFromNovoPonto(index) {
    setDirty(true);
    setNovoPonto((current) => ({
      ...current,
      detalhes: sortPontoDetalhes(
        current.detalhes.filter((_, itemIndex) => itemIndex !== index)
      ),
    }));
  }

  function addDetalheToPonto(pontoIndex, texto) {
    if (!texto.trim()) return;

    setDirty(true);
    setPontos((current) =>
      current.map((ponto, itemIndex) =>
        itemIndex === pontoIndex
          ? {
              ...ponto,
              detalhes: sortPontoDetalhes([
                ...ponto.detalhes,
                { texto: texto.trim(), ordem: ponto.detalhes.length + 1 },
              ]),
            }
          : ponto
      )
    );
  }

  function updateDetalhePonto(pontoIndex, detalheIndex, texto) {
    setDirty(true);
    setPontos((current) =>
      current.map((ponto, itemIndex) =>
        itemIndex === pontoIndex
          ? {
              ...ponto,
              detalhes: assignPontoDetalhesOrdem(
                ponto.detalhes.map((detalhe, index) =>
                  index === detalheIndex ? { ...detalhe, texto } : detalhe
                )
              ),
            }
          : ponto
      )
    );
  }

  function removeDetalhePonto(pontoIndex, detalheIndex) {
    setDirty(true);
    setPontos((current) =>
      current.map((ponto, itemIndex) =>
        itemIndex === pontoIndex
          ? {
              ...ponto,
              detalhes: assignPontoDetalhesOrdem(
                ponto.detalhes.filter((_, index) => index !== detalheIndex)
              ),
            }
          : ponto
      )
    );
  }

  function moveDetalhePonto(pontoIndex, detalheIndex, direction) {
    setDirty(true);
    setPontos((current) =>
      current.map((ponto, itemIndex) => {
        if (itemIndex !== pontoIndex) return ponto;

        const nextIndex = detalheIndex + direction;
        if (nextIndex < 0 || nextIndex >= ponto.detalhes.length) return ponto;

        const next = [...ponto.detalhes];
        [next[detalheIndex], next[nextIndex]] = [next[nextIndex], next[detalheIndex]];

        return {
          ...ponto,
          detalhes: assignPontoDetalhesOrdem(next),
        };
      })
    );
  }

  function addPonto() {
    if (!novoPonto.nome.trim()) return;

    setDirty(true);
    setPontos((current) => [
      ...current,
      {
        nome: novoPonto.nome.trim(),
        ordem: current.length + 1,
        detalhes: sortPontoDetalhes(novoPonto.detalhes),
        clientId: createClientId("ponto"),
      },
    ]);
    setNovoPonto({ nome: "", novaDescricao: "", detalhes: [] });
  }

  function removePonto(index) {
    setDirty(true);
    setPontos((current) => {
      removeExpandedId(setExpandedPontoIds, current[index]?.clientId);
      return current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((ponto, itemIndex) => ({ ...ponto, ordem: itemIndex + 1 }));
    });
  }

  function movePonto(index, direction) {
    setDirty(true);
    setPontos((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next.map((ponto, itemIndex) => ({ ...ponto, ordem: itemIndex + 1 }));
    });
  }

  function addDica() {
    if (!novaDica.trim()) return;

    setDirty(true);
    setDicas((current) => [
      ...current,
      {
        texto: novaDica.trim(),
        ordem: current.length + 1,
        clientId: createClientId("dica"),
      },
    ]);
    setNovaDica("");
  }

  function updateDica(index, texto) {
    setDirty(true);
    setDicas((current) =>
      current.map((dica, itemIndex) =>
        itemIndex === index ? { ...dica, texto } : dica
      )
    );
  }

  function removeDica(index) {
    setDirty(true);
    setDicas((current) => {
      removeExpandedId(setExpandedDicaIds, current[index]?.clientId);
      return current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((dica, itemIndex) => ({ ...dica, ordem: itemIndex + 1 }));
    });
  }

  function moveDica(index, direction) {
    setDirty(true);
    setDicas((current) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next.map((dica, itemIndex) => ({ ...dica, ordem: itemIndex + 1 }));
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    setPhotoError("");

    const supabase = createClient();
    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      cidade: form.cidade,
      categoria: normalizeCategoriaAtrativo(form.categoria),
      dificuldade: form.dificuldade,
      duracao_minutos: form.duracao_minutos ? Number(form.duracao_minutos) : null,
      distancia_km: form.distancia_km ? Number(form.distancia_km) : null,
      ativa: Boolean(form.ativa),
    };

    let rotaId = editingId;

    try {
      if (editingId) {
        const { error } = await supabase.from("rotas").update(payload).eq("id", editingId);
        if (error) throw error;
        await supabase.from("rota_pontos").delete().eq("rota_id", editingId);
        await supabase.from("rota_dicas").delete().eq("rota_id", editingId);
        await supabase.from("rotas_tags").delete().eq("rota_id", editingId);
      } else {
        const { data, error } = await supabase
          .from("rotas")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        rotaId = data?.id;
      }

      if (!rotaId) throw new Error("Não foi possível salvar o roteiro.");

      const pendingFiles = getPendingFilesFromPhotoItems(photoItems);
      const uploadedUrls = await uploadEntityPhotos(
        supabase,
        ROTAS_FOTOS_BUCKET,
        rotaId,
        pendingFiles
      );
      const fotos = buildFotosUrlsFromPhotoItems(photoItems, uploadedUrls);
      const capa = getPhotoEntryUrl(fotos[0]) || "";

      const { error: fotosError } = await supabase
        .from("rotas")
        .update({
          fotos,
          foto_capa: capa || null,
        })
        .eq("id", rotaId);

      if (fotosError) throw fotosError;

      if (pontos.length > 0) {
        for (let index = 0; index < pontos.length; index += 1) {
          const ponto = pontos[index];
          const { data: pontoRow, error: pontoError } = await supabase
            .from("rota_pontos")
            .insert({
              rota_id: rotaId,
              ordem: index + 1,
              nome: ponto.nome.trim(),
              descricao: null,
            })
            .select("id")
            .single();

          if (pontoError) throw pontoError;

          const detalhes = sortPontoDetalhes(ponto.detalhes);
          if (pontoRow?.id && detalhes.length > 0) {
            const { error: detalhesError } = await supabase
              .from("rota_ponto_detalhes")
              .insert(
                detalhes.map((detalhe, detalheIndex) => ({
                  ponto_id: pontoRow.id,
                  ordem: detalheIndex + 1,
                  texto: detalhe.texto,
                }))
              );

            if (detalhesError) throw detalhesError;
          }
        }
      }

      const dicasValidas = dicas
        .map((dica) => dica.texto.trim())
        .filter(Boolean);

      if (dicasValidas.length > 0) {
        const { error: dicasError } = await supabase.from("rota_dicas").insert(
          dicasValidas.map((texto, index) => ({
            rota_id: rotaId,
            ordem: index + 1,
            texto,
          }))
        );
        if (dicasError) throw dicasError;
      }

      const validTagIds = getTagIds(
        visibleTags.filter((tag) => selectedTagIds.includes(String(tag.id)))
      );

      if (validTagIds.length > 0) {
        const { error: tagsError } = await supabase.from("rotas_tags").insert(
          validTagIds.map((tagId) => ({
            rota_id: rotaId,
            tag_id: Number(tagId),
          }))
        );
        if (tagsError) throw tagsError;
      }

      if (rotaId && localizacao?.endereco_completo?.trim()) {
        const { error: localizacaoError } = await supabase
          .from("rotas_localizacoes")
          .upsert(
            {
              rota_id: rotaId,
              rua: localizacao.rua || null,
              numero: localizacao.numero || null,
              bairro: localizacao.bairro || null,
              cidade: localizacao.cidade || null,
              estado: localizacao.estado || null,
              cep: localizacao.cep || null,
              pais: localizacao.pais || "Brasil",
              endereco_completo: localizacao.endereco_completo,
              latitude: localizacao.latitude,
              longitude: localizacao.longitude,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "rota_id" }
          );

        if (localizacaoError) throw localizacaoError;
      }
    } catch (error) {
      console.error(error);
      setSaveError(formatAtrativoSaveError(error));
      showToast("Não foi possível salvar o roteiro.", { tone: "error" });
      setSaving(false);
      return;
    }

    setDirty(false);
    router.push(`${ADMIN_ROTEIROS_PATH}?success=${editingId ? "updated" : "created"}`);
  }

  return (
    <>
    <form
      id="admin-atrativo-form"
      onSubmit={handleSubmit}
      onChange={() => setDirty(true)}
      className="rounded-2xl bg-white p-5 shadow-sm"
    >
      {saveError && (
        <div
          className="mb-4 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          role="alert"
        >
          <svg
            className="h-5 w-5 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="min-w-0 flex-1">{saveError}</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome">
          <input
            required
            value={form.nome}
            onChange={(event) => setForm({ ...form, nome: event.target.value })}
            className={inputClass()}
          />
        </Field>

        <Field label="Cidade">
          <select
            value={form.cidade}
            onChange={(event) => setForm({ ...form, cidade: event.target.value })}
            className={inputClass()}
          >
            <option>Imbituba</option>
          </select>
        </Field>

        <Field label="Tipo de roteiro">
          <select
            value={form.categoria}
            onChange={(event) => setForm({ ...form, categoria: event.target.value })}
            className={inputClass()}
          >
            {CATEGORIAS_ATRATIVO.map((item) => (
              <option key={item.nome} value={item.nome}>
                {item.icone} {item.nome}
                {CATEGORIAS_ATRATIVO_RESERVADAS.has(item.nome)
                  ? " — ainda sem roteiros na aba"
                  : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dificuldade">
          <select
            value={form.dificuldade}
            onChange={(event) => setForm({ ...form, dificuldade: event.target.value })}
            className={inputClass()}
          >
            <option>Fácil</option>
            <option>Moderado</option>
            <option>Difícil</option>
          </select>
        </Field>

        <Field label="Duração em minutos">
          <input
            type="number"
            min="0"
            value={form.duracao_minutos}
            onChange={(event) => setForm({ ...form, duracao_minutos: event.target.value })}
            className={inputClass()}
          />
        </Field>

        <Field label="Distância em km">
          <input
            type="number"
            min="0"
            step="0.1"
            value={form.distancia_km}
            onChange={(event) => setForm({ ...form, distancia_km: event.target.value })}
            className={inputClass()}
          />
        </Field>

        <div className="flex items-end gap-5 md:col-span-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-[#1a2e28]">
            <input
              type="checkbox"
              checked={Boolean(form.ativa)}
              onChange={(event) => setForm({ ...form, ativa: event.target.checked })}
            />
            Ativa
          </label>
        </div>

        {editingId && (
          <div className="md:col-span-2 rounded-2xl border border-amber-200 bg-amber-50/80 p-4">
            <p className="text-sm font-bold text-[#1a2e28]">Roteiro do dia</p>
            <p className="mt-1 text-xs text-[#5a6b66]">
              Sem fixação, o app alterna um roteiro publicado por dia. Fixar substitui a rotação
              automática até a data indicada.
            </p>
            {isAtrativoFixadoHoje(initialData) ? (
              <p className="mt-2 text-xs font-semibold text-amber-900">
                Fixada até {String(initialData?.rota_do_dia_fixada_ate ?? "").slice(0, 10)}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {ATRATIVO_DO_DIA_FIXAR_OPCOES.map((opcao) => (
                <button
                  key={opcao.dias}
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    const supabase = createClient();
                    const { error } = await aplicarFixacaoAtrativoDoDia(
                      supabase,
                      editingId,
                      opcao.dias
                    );
                    if (error) {
                      setSaveError(error.message || "Não foi possível fixar.");
                      return;
                    }
                    setSaveError("");
                  }}
                  className="rounded-xl bg-white px-3 py-1.5 text-xs font-semibold text-[#1a4a3a] ring-1 ring-amber-200 hover:bg-amber-100 disabled:opacity-50"
                >
                  Fixar {opcao.label}
                </button>
              ))}
              {isAtrativoFixadoHoje(initialData) && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    const supabase = createClient();
                    const { error } = await removerFixacaoAtrativoDoDia(supabase, editingId);
                    if (error) {
                      setSaveError(error.message || "Não foi possível remover fixação.");
                    }
                  }}
                  className="rounded-xl bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-300 disabled:opacity-50"
                >
                  Remover fixação
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <PhotoUploader
        items={photoItems}
        onAddFiles={addPhotoFiles}
        onRemove={removePhotoItem}
        onSetCover={setPhotoCover}
        onMove={reorderPhotoItem}
        disabled={saving}
        error={photoError}
      />

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1a2e28]">Tags</p>
          <span className="text-xs font-semibold text-[#5a6b66]">
            {selectedTagIds.length}/{MAX_TAGS_ATRATIVO} selecionadas
          </span>
        </div>
        {tagLimitMessage && (
          <p className="mb-2 text-xs font-semibold text-[#d9534f]">{tagLimitMessage}</p>
        )}
        <p className="mb-2 text-xs text-[#5a6b66]">
          Máximo de {MAX_TAGS_ATRATIVO} tags por roteiro, filtradas pelo tipo selecionado.
        </p>
        <div className="grid gap-2 rounded-2xl bg-[#f7faf9] p-3 md:grid-cols-3">
          {visibleTags.length === 0 ? (
            <p className="text-sm text-[#5a6b66]">
              {tags.length === 0
                ? "Nenhuma tag cadastrada."
                : `Nenhuma tag disponível para ${form.categoria}.`}
            </p>
          ) : (
            visibleTags.map((tag) => {
              const tagId = String(tag.id);
              return (
                <label
                  key={tag.id}
                  className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#1a2e28]"
                >
                  <input
                    type="checkbox"
                    checked={selectedTagIds.includes(tagId)}
                    onChange={() => toggleTag(tagId)}
                  />
                  <span>{tag.icone}</span>
                  {tag.nome}
                </label>
              );
            })
          )}
        </div>
      </div>

      <label className="mt-4 block text-sm font-semibold text-[#1a2e28]">
        Descrição
        <textarea
          rows={4}
          value={form.descricao}
          onChange={(event) => setForm({ ...form, descricao: event.target.value })}
          className="mt-1 w-full rounded-xl bg-[#f0f4f3] p-3 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2"
        />
      </label>

      <CollapsibleFormSection
        title="Pontos do Percurso"
        description="Cada ponto tem um nome e uma ou mais descrições (listadas em ordem no app)."
        count={pontos.length}
        countLabel={pontos.length === 1 ? "ponto" : "pontos"}
        expanded={pontosExpanded}
        onToggle={() => setPontosExpanded((current) => !current)}
      >
        <div className="grid gap-3">
          {pontos.length === 0 ? (
            <p className="text-sm text-[#5a6b66]">Nenhum ponto adicionado.</p>
          ) : (
            pontos.map((ponto, index) => {
              const pontoCollapsible =
                Boolean(ponto.nome?.trim()) || ponto.detalhes.length > 0;
              const pontoExpanded = expandedPontoIds.has(ponto.clientId);
              const detalhesCount = ponto.detalhes.length;
              const pontoSubtitle = detalhesCount
                ? `${detalhesCount} ${detalhesCount === 1 ? "descrição" : "descrições"}`
                : "Sem descrições";

              return (
              <CollapsibleItemCard
                key={ponto.clientId}
                index={index}
                title={ponto.nome?.trim() || `Ponto ${index + 1}`}
                subtitle={pontoSubtitle}
                expanded={pontoExpanded}
                onToggle={() => toggleExpandedId(setExpandedPontoIds, ponto.clientId)}
                collapsible={pontoCollapsible}
              >
                    <input
                      value={ponto.nome}
                      onChange={(event) => updatePonto(index, "nome", event.target.value)}
                      className={inputClass()}
                      placeholder="Nome do ponto"
                    />

                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
                        Descrições
                      </p>
                      {ponto.detalhes.length === 0 ? (
                        <p className="mt-2 text-sm text-[#5a6b66]">Nenhuma descrição ainda.</p>
                      ) : (
                        <div className="mt-2 grid gap-2">
                          {ponto.detalhes.map((detalhe, detalheIndex) => (
                            <div
                              key={`${ponto.clientId}-detalhe-${detalheIndex}`}
                              className="rounded-xl bg-[#f7faf9] p-2"
                            >
                              <textarea
                                value={detalhe.texto}
                                onChange={(event) =>
                                  updateDetalhePonto(index, detalheIndex, event.target.value)
                                }
                                className="min-h-14 w-full rounded-lg bg-white p-2 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
                                placeholder="Descrição do ponto"
                              />
                              <div className="mt-2 flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  disabled={detalheIndex === 0}
                                  onClick={() => moveDetalhePonto(index, detalheIndex, -1)}
                                  className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  ↑
                                </button>
                                <button
                                  type="button"
                                  disabled={detalheIndex === ponto.detalhes.length - 1}
                                  onClick={() => moveDetalhePonto(index, detalheIndex, 1)}
                                  className="rounded-lg bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                  ↓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeDetalhePonto(index, detalheIndex)}
                                  className="rounded-lg bg-[#fde2e2] px-2 py-1 text-xs font-semibold text-[#d9534f]"
                                >
                                  Remover
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                        <textarea
                          value={pontoNovaDescricao[index] || ""}
                          placeholder="Nova descrição"
                          onChange={(event) =>
                            setPontoNovaDescricao((current) => ({
                              ...current,
                              [index]: event.target.value,
                            }))
                          }
                          className="min-h-14 rounded-xl bg-[#f0f4f3] p-3 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            addDetalheToPonto(index, pontoNovaDescricao[index] || "");
                            setPontoNovaDescricao((current) => ({ ...current, [index]: "" }));
                          }}
                          className="rounded-xl bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white"
                        >
                          Adicionar descrição
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => movePonto(index, -1)} className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                        ↑ Ponto
                      </button>
                      <button type="button" onClick={() => movePonto(index, 1)} className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                        ↓ Ponto
                      </button>
                      <button type="button" onClick={() => removePonto(index)} className="rounded-lg bg-[#fde2e2] px-3 py-1 text-xs font-semibold text-[#d9534f]">
                        Remover ponto
                      </button>
                    </div>
              </CollapsibleItemCard>
              );
            })
          )}
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl bg-white p-3">
          <input
            value={novoPonto.nome}
            placeholder="Nome do ponto"
            onChange={(event) => setNovoPonto({ ...novoPonto, nome: event.target.value })}
            className={inputClass()}
          />

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#5a6b66]">
              Descrições do novo ponto
            </p>
            {novoPonto.detalhes.length > 0 && (
              <ol className="mt-2 grid list-none gap-2 p-0">
                {novoPonto.detalhes.map((detalhe, index) => (
                  <li
                    key={`novo-detalhe-${index}`}
                    className="flex items-start gap-2 rounded-xl bg-[#f7faf9] p-2 text-sm text-[#1a2e28]"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d4ede8] text-xs font-bold text-[#1a4a3a]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 pt-0.5">{detalhe.texto}</span>
                    <button
                      type="button"
                      onClick={() => removeDetalheFromNovoPonto(index)}
                      className="rounded-lg bg-[#fde2e2] px-2 py-1 text-xs font-semibold text-[#d9534f]"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ol>
            )}

            <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
              <textarea
                value={novoPonto.novaDescricao}
                placeholder="Nova descrição"
                onChange={(event) =>
                  setNovoPonto({ ...novoPonto, novaDescricao: event.target.value })
                }
                className="min-h-14 rounded-xl bg-[#f0f4f3] p-3 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
              />
              <button
                type="button"
                onClick={addDetalheToNovoPonto}
                className="rounded-xl bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white"
              >
                Adicionar descrição
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={addPonto}
            className="rounded-xl bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white"
          >
            Adicionar Ponto
          </button>
        </div>
      </CollapsibleFormSection>

      <CollapsibleFormSection
        title="Dicas"
        description="Orientações práticas exibidas ao final da página do roteiro no app."
        count={dicas.length}
        countLabel={dicas.length === 1 ? "dica" : "dicas"}
        expanded={dicasExpanded}
        onToggle={() => setDicasExpanded((current) => !current)}
      >
        <div className="grid gap-3">
          {dicas.length === 0 ? (
            <p className="text-sm text-[#5a6b66]">Nenhuma dica adicionada.</p>
          ) : (
            dicas.map((dica, index) => {
              const dicaCollapsible = Boolean(dica.texto?.trim());
              const dicaExpanded = expandedDicaIds.has(dica.clientId);
              const texto = dica.texto?.trim() || "";

              return (
              <CollapsibleItemCard
                key={dica.clientId}
                index={index}
                title={
                  texto
                    ? texto.length > 56
                      ? `${texto.slice(0, 56)}…`
                      : texto
                    : `Dica ${index + 1}`
                }
                subtitle={texto.length > 56 ? texto : undefined}
                expanded={dicaExpanded}
                onToggle={() => toggleExpandedId(setExpandedDicaIds, dica.clientId)}
                collapsible={dicaCollapsible}
                badgeClassName="bg-[#d4ede8] text-[#1a4a3a]"
              >
                    <textarea
                      value={dica.texto}
                      onChange={(event) => updateDica(index, event.target.value)}
                      className="min-h-16 w-full rounded-xl bg-[#f0f4f3] p-3 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
                      placeholder="Ex.: Leve água e protetor solar."
                    />
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => moveDica(index, -1)}
                        className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDica(index, 1)}
                        className="rounded-lg bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDica(index)}
                        className="rounded-lg bg-[#fde2e2] px-3 py-1 text-xs font-semibold text-[#d9534f]"
                      >
                        Remover
                      </button>
                    </div>
              </CollapsibleItemCard>
              );
            })
          )}
        </div>

        <div className="mt-4 grid gap-3 rounded-2xl bg-white p-3 md:grid-cols-[1fr_auto]">
          <textarea
            value={novaDica}
            placeholder="Nova dica"
            onChange={(event) => setNovaDica(event.target.value)}
            className="min-h-16 rounded-xl bg-[#f0f4f3] p-3 text-sm outline-none ring-[#1a4a3a]/20 focus:ring-2"
          />
          <button
            type="button"
            onClick={addDica}
            className="rounded-xl bg-[#1a4a3a] px-4 py-2 text-sm font-semibold text-white"
          >
            Adicionar Dica
          </button>
        </div>
      </CollapsibleFormSection>

      <div className="mt-6">
        <p className="mb-1 text-sm font-semibold text-[#1a2e28]">
          Ponto de partida no mapa
        </p>
        <p className="mb-3 text-xs text-[#5a6b66]">
          Usado pelo botão &quot;Como chegar&quot; no app. O endereço não aparece
          na página do roteiro — só abre a navegação.
        </p>
        <EnderecoAutocomplete
          initialValue={localizacao}
          onSave={(value) => {
            setDirty(true);
            setLocalizacao(value);
          }}
        />
      </div>
    </form>

    <AdminStickySaveBar
      formId="admin-atrativo-form"
      dirty={dirty}
      saving={saving}
      requireDirty={Boolean(editingId)}
      saveLabel={editingId ? "Salvar alterações" : "Salvar roteiro"}
      cancelHref={ADMIN_ROTEIROS_PATH}
    />
    </>
  );
}
