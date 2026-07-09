"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EnderecoAutocomplete from "@/components/EnderecoAutocomplete";
import HorarioEditor from "@/components/admin/HorarioEditor";
import LugarQrSection from "@/components/admin/LugarQrSection";
import ParceiroProgramaFields from "@/components/admin/ParceiroProgramaFields";
import PhotoUploader from "@/components/admin/PhotoUploader";
import VideoUploader from "@/components/admin/VideoUploader";
import { getInitialPhotoItems, getPhotoEntryUrl } from "@/lib/fotos";
import {
  buildFotosUrlsFromPhotoItems,
  createPhotoItemFromFile,
  getPendingFilesFromPhotoItems,
  movePhotoItemToCover,
  movePhotoItem,
  revokePhotoItemPreview,
} from "@/lib/photoItems";
import { createClient } from "@/lib/supabase";
import { isLugarElegivelVideo } from "@/lib/lugarVideo";
import {
  LUGARES_FOTOS_BUCKET,
  getStorageErrorMessage,
  uploadEntityPhotos,
  uploadEntityVideo,
} from "@/lib/storageUpload";
import {
  filterTagIdsBySubcategoria,
  filterTagsBySubcategoria,
  getTagIds,
} from "@/lib/tags";
import { isLugarElegivelQr } from "@/lib/lugarQr";
import { getEffectiveCategoria } from "@/lib/lugarTaxonomia";
import { getCategoriasVisiveis } from "@/lib/categorias";
import {
  fetchTakenSlugs,
  isMissingSlugColumnError,
  isSlugAutoFromNome,
  resolveLugarSlug,
  slugifyNome,
} from "@/lib/slug";
import {
  buildParceiroProgramaPayload,
  fetchParceiroProgramaColumnsReady,
  isMissingParceiroProgramaColumnError,
} from "@/lib/parceiroAdmin";
import { LUGAR_STATUS, LUGAR_STATUS_FORM_OPTIONS } from "@/lib/lugarStatus";

const emptyHorario = {
  dom: "fechado",
  seg: "08:00-18:00",
  ter: "08:00-18:00",
  qua: "08:00-18:00",
  qui: "08:00-18:00",
  sex: "08:00-18:00",
  sab: "09:00-18:00",
};

export const emptyLocalForm = {
  nome: "",
  descricao: "",
  categoria: "Natureza",
  subcategoria: "",
  telefone: "",
  instagram: "",
  facebook_url: "",
  cardapio_url: "",
  site_url: "",
  descricao_longa: "",
  historia_cultura: "",
  status: LUGAR_STATUS.PAUSADO,
  eh_parceiro: false,
  conteudo_curadoria: false,
  parceiro_modalidade: null,
  parceiro_inicio_em: "",
  parceiro_fim_em: "",
  parceiro_status: null,
  ultima_curadoria_avaliacoes_em: "",
  proxima_curadoria_avaliacoes_em: "",
  parceiro_notas_internas: "",
  horarios: emptyHorario,
  mostrar_endereco: true,
  mostrar_horarios: true,
  tem_video: false,
  video_url: null,
};

const categorias = getCategoriasVisiveis().map((item) => item.nome);

const MAX_TAGS = 5;

/**
 * Aplica máscara brasileira ao telefone enquanto o usuário digita (até 11 dígitos).
 * @param {string} value - Valor bruto do input.
 * @returns {string} Telefone formatado, ex.: "(48) 9 1234-5678".
 */
function formatTelefone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}

/**
 * Campo de formulário com label e input estilizado.
 * @param {object} props
 * @param {string} props.label - Texto do label.
 * @returns {import("react").JSX.Element}
 */
function Input({ label, ...props }) {
  return (
    <label className="block text-sm font-semibold text-[#1a2e28]">
      {label}
      <input
        {...props}
        className="mt-1 w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2"
      />
    </label>
  );
}

/**
 * Formulário admin de criação/edição de lugar (dados, fotos, tags, horários e localização).
 * @param {object} props
 * @param {typeof emptyLocalForm} [props.initialData] - Valores iniciais do lugar.
 * @param {object|null} [props.initialLocalizacao] - Registro de `localizacoes` vinculado.
 * @param {Array<{ id: number|string }>} [props.initialTags] - Tags já associadas.
 * @param {string|null} [props.editingId] - UUID do lugar em edição; null para novo.
 * @returns {import("react").JSX.Element}
 */
export default function LocalForm({
  initialData = emptyLocalForm,
  initialLocalizacao = null,
  initialTags = [],
  editingId = null,
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [localizacao, setLocalizacao] = useState(initialLocalizacao);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTagIds, setSelectedTagIds] = useState(
    () => getTagIds(initialTags).slice(0, MAX_TAGS)
  );
  const [tagLimitMessage, setTagLimitMessage] = useState("");
  const [photoItems, setPhotoItems] = useState(() => getInitialPhotoItems(initialData));
  const [photoError, setPhotoError] = useState("");
  const [videoUrl, setVideoUrl] = useState(initialData?.video_url || null);
  const [pendingVideo, setPendingVideo] = useState(null);
  const [videoRemoved, setVideoRemoved] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [slugColumnReady, setSlugColumnReady] = useState(true);
  const [parceiroColumnReady, setParceiroColumnReady] = useState(true);
  const { destaque: _destaqueLegado, ...initialSemDestaque } = initialData ?? {};

  const [form, setForm] = useState({
    ...emptyLocalForm,
    ...initialSemDestaque,
    horarios: initialData?.horarios || emptyHorario,
    telefone: formatTelefone(initialData?.telefone),
    mostrar_endereco: initialData?.mostrar_endereco ?? true,
    mostrar_horarios: initialData?.mostrar_horarios ?? true,
    tem_video: Boolean(initialData?.tem_video),
    slug: initialData?.slug || "",
    slug_auto: isSlugAutoFromNome(initialData?.slug, initialData?.nome),
  });

  const elegivelVideo = isLugarElegivelVideo(form);
  const showVideoAdmin =
    elegivelVideo || Boolean(pendingVideo) || (Boolean(videoUrl) && !videoRemoved);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("tags")
      .select("*")
      .order("nome")
      .then(({ data }) => setTags(data ?? []));

    fetchTakenSlugs(supabase, editingId).then(({ ready }) => setSlugColumnReady(ready));
    fetchParceiroProgramaColumnsReady(supabase).then(setParceiroColumnReady);
  }, [editingId]);

  useEffect(() => {
    const supabase = createClient();

    supabase
      .from("subcategorias")
      .select("*")
      .eq("categoria", form.categoria)
      .order("nome")
      .then(({ data }) => {
        const items = data ?? [];
        setSubcategorias(items);

        if (form.subcategoria && !items.some((item) => item.nome === form.subcategoria)) {
          setForm((current) => ({ ...current, subcategoria: "" }));
        }
      });
  }, [form.categoria, form.subcategoria]);

  useEffect(() => {
    if (tags.length === 0) return;
    if (!form.subcategoria?.trim()) {
      setSelectedTagIds([]);
      setTagLimitMessage("");
      return;
    }

    setSelectedTagIds((current) =>
      filterTagIdsBySubcategoria(
        current,
        tags,
        form.categoria,
        form.subcategoria
      ).slice(0, MAX_TAGS)
    );
    setTagLimitMessage("");
  }, [form.categoria, form.subcategoria, tags]);

  const tagsProntas = Boolean(form.categoria?.trim() && form.subcategoria?.trim());
  const visibleTags = tagsProntas
    ? filterTagsBySubcategoria(tags, form.categoria, form.subcategoria)
    : [];

  /**
   * Alterna seleção de tag respeitando o limite de {@link MAX_TAGS}.
   * @param {string} tagId - ID da tag como string.
   */
  function toggleTag(tagId) {
    setSelectedTagIds((current) => {
      if (current.includes(tagId)) {
        setTagLimitMessage("");
        return current.filter((id) => id !== tagId);
      }
      if (current.length >= MAX_TAGS) {
        setTagLimitMessage(`Você pode selecionar no máximo ${MAX_TAGS} tags.`);
        return current;
      }
      setTagLimitMessage("");
      return [...current, tagId];
    });
  }

  /**
   * Adiciona arquivos pendentes de upload à fila de fotos do lugar.
   * @param {File[]} files - Arquivos de imagem aceitos.
   */
  function addPhotoFiles(files) {
    setPhotoError("");
    setPhotoItems((current) => [
      ...current,
      ...files.map((file) => createPhotoItemFromFile(file)),
    ]);
  }

  /**
   * Remove um item da galeria e revoga preview blob se existir.
   * @param {string} id - ID interno do item em `photoItems`.
   */
  function removePhotoItem(id) {
    setPhotoItems((current) => {
      const item = current.find((entry) => entry.id === id);
      revokePhotoItemPreview(item);
      return current.filter((entry) => entry.id !== id);
    });
  }

  function setPhotoCover(id) {
    setPhotoItems((current) => movePhotoItemToCover(current, id));
  }

  /**
   * @param {string} id
   * @param {-1|1} direction
   */
  function reorderPhotoItem(id, direction) {
    setPhotoItems((current) => movePhotoItem(current, id, direction));
  }

  /**
   * Atualização parcial do lugar (ações rápidas do programa parceiro).
   * @param {object} patch
   */
  async function patchParceiroFields(patch) {
    if (!editingId) return;
    const supabase = createClient();
    const { error } = await supabase.from("lugares").update(patch).eq("id", editingId);
    if (error) {
      console.error(error);
      throw error;
    }
    setForm((current) => ({ ...current, ...patch }));
  }

  /**
   * Persiste lugar, fotos no Storage, localização e vínculos de tags no Supabase.
   * @param {import("react").FormEvent<HTMLFormElement>} event - Evento de submit do formulário.
   */
  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setPhotoError("");
    setVideoError("");
    const supabase = createClient();
    const {
      imagem_url: _imagemUrl,
      fotos: _fotos,
      video_url: _videoUrlField,
      endereco: _endereco,
      destaque: _destaqueCampo,
      slug: _slugField,
      slug_auto: _slugAuto,
      parceiro_modalidade: _parceiroModalidade,
      parceiro_inicio_em: _parceiroInicio,
      parceiro_fim_em: _parceiroFim,
      parceiro_status: _parceiroStatus,
      ultima_curadoria_avaliacoes_em: _ultimaCuradoria,
      proxima_curadoria_avaliacoes_em: _proximaCuradoria,
      parceiro_notas_internas: _parceiroNotas,
      ...formFields
    } = form;

    const { taken: takenSlugs, ready: slugReady } = await fetchTakenSlugs(
      supabase,
      editingId
    );
    setSlugColumnReady(slugReady);

    const slugValue =
      slugReady && isLugarElegivelQr(form)
        ? resolveLugarSlug({
            nome: form.nome,
            slugManual: form.slug,
            slugAuto: form.slug_auto,
            lugarId: editingId,
            takenSlugs,
            currentSlug: initialData?.slug || null,
          })
        : null;

    const payload = {
      ...formFields,
      categoria: getEffectiveCategoria(formFields),
      ...(slugReady ? { slug: slugValue } : {}),
      mostrar_endereco: Boolean(form.mostrar_endereco),
      mostrar_horarios: Boolean(form.mostrar_horarios),
      horarios: form.horarios,
      ...(parceiroColumnReady ? buildParceiroProgramaPayload(form) : {}),
    };
    let lugarId = editingId;
    const pendingFiles = getPendingFilesFromPhotoItems(photoItems);

    try {
      if (editingId) {
        const { error } = await supabase.from("lugares").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("lugares")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        lugarId = data?.id;
      }

      if (!lugarId) throw new Error("Não foi possível salvar o local.");
    } catch (error) {
      console.error(error);
      const message = error?.message || "";
      setPhotoError(
        isMissingSlugColumnError(error)
          ? "Coluna slug ainda não existe no banco. Rode supabase/lugares_qr_slug.sql no SQL Editor do Supabase e tente de novo."
          : isMissingParceiroProgramaColumnError(error)
            ? "Colunas do programa parceiro ainda não existem. Rode supabase/lugares_parceiro_programa.sql no SQL Editor do Supabase e tente de novo."
          : message.includes("lugares_slug_unique_idx") || message.includes("duplicate key")
            ? "Este slug já está em uso. Escolha outro slug ou altere o nome."
            : message ||
                "Não foi possível salvar o local. Se o erro citar colunas mostrar_endereco, mostrar_horarios ou slug, rode as migrations em supabase/."
      );
      setSaving(false);
      return;
    }

    try {
      if (pendingFiles.length > 0) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          throw new Error("Faça login para enviar fotos.");
        }
      }

      const uploadedUrls =
        pendingFiles.length > 0
          ? await uploadEntityPhotos(
              supabase,
              LUGARES_FOTOS_BUCKET,
              lugarId,
              pendingFiles
            )
          : [];
      const fotos = buildFotosUrlsFromPhotoItems(photoItems, uploadedUrls);

      const { error: fotosError } = await supabase
        .from("lugares")
        .update({
          fotos,
          imagem_url: getPhotoEntryUrl(fotos[0]) || null,
        })
        .eq("id", lugarId);

      if (fotosError) throw fotosError;
    } catch (error) {
      console.error(error);
      setPhotoError(
        getStorageErrorMessage(error) ||
          error?.message ||
          "Não foi possível salvar as fotos. Tente novamente."
      );
      setSaving(false);
      return;
    }

    if (lugarId && (pendingVideo || videoRemoved)) {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (pendingVideo && !user) {
          throw new Error("Faça login para enviar vídeo.");
        }

        let nextVideoUrl = videoRemoved ? null : videoUrl;

        if (pendingVideo) {
          nextVideoUrl = await uploadEntityVideo(
            supabase,
            LUGARES_FOTOS_BUCKET,
            lugarId,
            pendingVideo.file
          );
        }

        const { error: videoSaveError } = await supabase
          .from("lugares")
          .update({ video_url: nextVideoUrl })
          .eq("id", lugarId);

        if (videoSaveError) throw videoSaveError;
      } catch (error) {
        console.error(error);
        setVideoError(
          getStorageErrorMessage(error) ||
            error?.message ||
            "Não foi possível salvar o vídeo. Tente novamente."
        );
        setSaving(false);
        return;
      }
    }

    if (lugarId && localizacao?.endereco_completo) {
      await supabase.from("localizacoes").upsert(
        {
          lugar_id: lugarId,
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
        },
        { onConflict: "lugar_id" }
      );
    }

    if (lugarId) {
      await supabase.from("lugares_tags").delete().eq("lugar_id", lugarId);

      if (selectedTagIds.length > 0) {
        await supabase.from("lugares_tags").insert(
          selectedTagIds.map((tagId) => ({
            lugar_id: lugarId,
            tag_id: Number(tagId),
          }))
        );
      }
    }

    router.push("/admin/locais");
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Input label="Nome" value={form.nome || ""} onChange={(e) => {
          const nome = e.target.value;
          setForm((current) => {
            const next = { ...current, nome };
            if (current.slug_auto && isLugarElegivelQr(next)) {
              next.slug = slugifyNome(nome);
            }
            return next;
          });
        }} required />
        <label className="block text-sm font-semibold text-[#1a2e28]">
          Categoria
          <select
            value={form.categoria}
            onChange={(e) => {
              const categoria = e.target.value;
              setForm((current) => ({
                ...current,
                categoria,
                subcategoria: "",
                slug: isLugarElegivelQr({ categoria })
                  ? slugifyNome(current.nome)
                  : "",
                slug_auto: true,
              }));
            }}
            className="mt-1 w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm font-normal outline-none"
          >
            {categorias.map((cat) => <option key={cat}>{cat}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-[#1a2e28]">
          Subcategoria
          <select
            value={form.subcategoria || ""}
            onChange={(e) => setForm({ ...form, subcategoria: e.target.value })}
            className="mt-1 w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm font-normal outline-none"
          >
            <option value="">Sem subcategoria</option>
            {subcategorias.map((subcategoria) => (
              <option key={subcategoria.id} value={subcategoria.nome}>
                {subcategoria.icone ? `${subcategoria.icone} ` : ""}
                {subcategoria.nome}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-[#1a2e28]">
          Status
          <select
            value={form.status || LUGAR_STATUS.PAUSADO}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 w-full rounded-xl bg-[#f0f4f3] px-3 py-2 text-sm font-normal outline-none"
          >
            {LUGAR_STATUS_FORM_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} — {option.hint}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Telefone"
          type="tel"
          inputMode="numeric"
          placeholder="(48) 9 1234-5678"
          value={form.telefone || ""}
          onChange={(e) => setForm({ ...form, telefone: formatTelefone(e.target.value) })}
        />
        <Input label="Instagram" value={form.instagram || ""} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
        <Input label="Facebook" value={form.facebook_url || ""} onChange={(e) => setForm({ ...form, facebook_url: e.target.value })} placeholder="URL ou @pagina" />
        <Input label="Cardápio URL" value={form.cardapio_url || ""} onChange={(e) => setForm({ ...form, cardapio_url: e.target.value })} />
        <Input label="Site URL" value={form.site_url || ""} onChange={(e) => setForm({ ...form, site_url: e.target.value })} />
      </div>

      {!slugColumnReady && isLugarElegivelQr(form) && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          QR Code e slug ainda não estão ativos neste banco. Rode o arquivo{" "}
          <code className="rounded bg-white px-1 py-0.5 text-xs">supabase/lugares_qr_slug.sql</code>{" "}
          no SQL Editor do Supabase. Você pode salvar o local normalmente até lá.
        </p>
      )}

      {slugColumnReady && isLugarElegivelQr(form) && (
        <div className="mt-4">
          <label className="block text-sm font-semibold text-[#1a2e28]">
            Slug (URL curta)
            <input
              value={form.slug || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  slug: e.target.value,
                  slug_auto: false,
                })
              }
              placeholder={slugifyNome(form.nome) || "bar-do-ze"}
              className="mt-1 w-full rounded-xl bg-[#f0f4f3] px-3 py-2 font-mono text-sm font-normal outline-none ring-[#1a4a3a]/20 focus:ring-2"
            />
          </label>
          <p className="mt-1 text-xs text-[#5a6b66]">
            Link público: /q/{form.slug || slugifyNome(form.nome) || "…"}
            {form.slug_auto ? " · gerado automaticamente do nome" : " · editado manualmente"}
          </p>
        </div>
      )}

      <ParceiroProgramaFields
        form={form}
        setForm={setForm}
        columnReady={parceiroColumnReady}
        editingId={editingId}
        onPatchSave={patchParceiroFields}
      />

      <PhotoUploader
        items={photoItems}
        onAddFiles={addPhotoFiles}
        onRemove={removePhotoItem}
        onSetCover={setPhotoCover}
        onMove={reorderPhotoItem}
        disabled={saving}
        error={photoError}
      />

      {!isLugarElegivelVideo(form) && (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl bg-[#f7faf9] px-3 py-3 text-sm text-[#1a2e28]">
          <input
            type="checkbox"
            checked={Boolean(form.tem_video)}
            onChange={(e) =>
              setForm((current) => ({ ...current, tem_video: e.target.checked }))
            }
            className="mt-1 h-4 w-4 rounded border-[#c5d5cf] text-[#1a4a3a]"
          />
          <span>
            <strong>Habilitar vídeo neste local</strong>
            <span className="mt-0.5 block text-xs font-normal text-[#5a6b66]">
              Por padrão, vídeo é só para Natureza e Aventura. Marque para outras categorias.
            </span>
          </span>
        </label>
      )}

      {showVideoAdmin && (
        <VideoUploader
          currentUrl={videoRemoved ? null : videoUrl}
          pending={pendingVideo}
          disabled={saving}
          error={videoError}
          onPendingChange={(next) => {
            setVideoError("");
            setVideoRemoved(false);
            if (pendingVideo?.preview) {
              URL.revokeObjectURL(pendingVideo.preview);
            }
            setPendingVideo(next);
          }}
          onRemove={() => {
            setVideoError("");
            if (pendingVideo?.preview) {
              URL.revokeObjectURL(pendingVideo.preview);
            }
            setPendingVideo(null);
            setVideoUrl(null);
            setVideoRemoved(true);
          }}
        />
      )}

      <div className="mt-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[#1a2e28]">Tags</p>
          <span className="text-xs font-semibold text-[#5a6b66]">
            {selectedTagIds.length}/{MAX_TAGS} selecionadas
          </span>
        </div>
        {tagLimitMessage && (
          <p className="mb-2 text-xs font-semibold text-[#d9534f]">{tagLimitMessage}</p>
        )}
        <p className="mb-2 text-xs text-[#5a6b66]">
          Máximo de {MAX_TAGS} tags por local. Escolha categoria e subcategoria para ver as
          opções.
        </p>
        <div className="grid max-h-[min(28rem,70vh)] gap-2 overflow-y-auto rounded-2xl bg-[#f7faf9] p-3 md:grid-cols-3">
          {!tagsProntas ? (
            <p className="text-sm text-[#5a6b66] md:col-span-3">
              Selecione a <strong>subcategoria</strong> acima para exibir as tags compatíveis.
            </p>
          ) : visibleTags.length === 0 ? (
            <p className="text-sm text-[#5a6b66] md:col-span-3">
              {tags.length === 0
                ? "Nenhuma tag cadastrada."
                : `Nenhuma tag cadastrada para ${form.subcategoria} (${form.categoria}).`}
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
        Descrição curta
        <textarea value={form.descricao || ""} onChange={(e) => setForm({ ...form, descricao: e.target.value })} className="mt-1 min-h-20 w-full rounded-xl bg-[#f0f4f3] p-3 text-sm font-normal outline-none" />
      </label>

      <label className="mt-4 block text-sm font-semibold text-[#1a2e28]">
        Descrição longa
        <textarea value={form.descricao_longa || ""} onChange={(e) => setForm({ ...form, descricao_longa: e.target.value })} className="mt-1 min-h-24 w-full rounded-xl bg-[#f0f4f3] p-3 text-sm font-normal outline-none" />
      </label>

      <label className="mt-4 block text-sm font-semibold text-[#1a2e28]">
        História e cultura
        <span className="mt-0.5 block text-xs font-normal text-[#5a6b66]">
          Origem do nome, contexto histórico ou cultural — exibido em seção separada no app.
        </span>
        <textarea value={form.historia_cultura || ""} onChange={(e) => setForm({ ...form, historia_cultura: e.target.value })} className="mt-1 min-h-24 w-full rounded-xl bg-[#f0f4f3] p-3 text-sm font-normal outline-none" />
      </label>

      <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-[#1a2e28]">
        <input
          type="checkbox"
          checked={Boolean(form.mostrar_horarios)}
          onChange={(e) =>
            setForm({ ...form, mostrar_horarios: e.target.checked })
          }
        />
        Este local tem horário de funcionamento
      </label>

      {form.mostrar_horarios && (
        <div className="mt-2">
          <p className="text-sm font-semibold text-[#1a2e28]">Horários</p>
          <div className="mt-2">
            <HorarioEditor
              horarios={form.horarios}
              onChange={(horarios) => setForm({ ...form, horarios })}
            />
          </div>
        </div>
      )}

      <label className="mt-6 flex items-center gap-2 text-sm font-semibold text-[#1a2e28]">
        <input
          type="checkbox"
          checked={Boolean(form.mostrar_endereco)}
          onChange={(e) =>
            setForm({ ...form, mostrar_endereco: e.target.checked })
          }
        />
        Exibir endereço no app
      </label>

      <div className="mt-4">
        <p className="mb-2 text-sm font-semibold text-[#1a2e28]">
          Endereço estruturado
        </p>
        <EnderecoAutocomplete
          initialValue={localizacao}
          onSave={(value) => setLocalizacao(value)}
        />
      </div>

      <button disabled={saving} className="mt-5 rounded-xl bg-[#1a4a3a] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? "Salvando..." : "Salvar local"}
      </button>
    </form>

    {editingId && isLugarElegivelQr(form) && (
      <LugarQrSection
        slugColumnReady={slugColumnReady}
        lugar={{
          id: editingId,
          nome: form.nome,
          categoria: form.categoria,
          subcategoria: form.subcategoria,
          slug: form.slug || initialData?.slug,
          status: form.status,
          imagemUrl: photoItems[0]?.preview || photoItems[0]?.url || null,
        }}
      />
    )}
    </>
  );
}
