import { serializePhotoEntry } from "./fotos.js";

/**
 * @typedef {{ id: string, file: File, preview: string, existing: false }} PendingPhotoItem
 */

/**
 * Cria item de foto pendente de upload a partir de um arquivo local.
 * @param {File} file
 * @returns {PendingPhotoItem}
 */
export function createPhotoItemFromFile(file) {
  return {
    id: `pending-${crypto.randomUUID()}`,
    file,
    preview: URL.createObjectURL(file),
    existing: false,
  };
}

/**
 * Libera URL de preview criada com `createObjectURL` para itens pendentes.
 * @param {{ preview?: string, existing?: boolean }} [item]
 * @returns {void}
 */
export function revokePhotoItemPreview(item) {
  if (item?.preview && !item.existing) {
    URL.revokeObjectURL(item.preview);
  }
}

/**
 * Extrai URLs já persistidas no storage dos itens do editor.
 * @param {Array<{ existing?: boolean, url?: string }>} [items]
 * @returns {string[]}
 */
export function getExistingUrlsFromPhotoItems(items) {
  return (items ?? [])
    .filter((item) => item.existing && item.url)
    .map((item) => item.url);
}

/**
 * Extrai arquivos pendentes de upload dos itens do editor (ordem da galeria).
 * @param {Array<{ file?: File }>} [items]
 * @returns {File[]}
 */
export function getPendingFilesFromPhotoItems(items) {
  return (items ?? []).filter((item) => item.file).map((item) => item.file);
}

/**
 * Move um item para a primeira posição (capa da galeria).
 * @param {Array<{ id: string }>} [items]
 * @param {string} id
 * @returns {Array<{ id: string }>}
 */
export function movePhotoItemToCover(items, id) {
  const list = items ?? [];
  const index = list.findIndex((item) => item.id === id);
  if (index <= 0) return list;

  const next = [...list];
  const [item] = next.splice(index, 1);
  next.unshift(item);
  return next;
}

/**
 * Troca um item de posição na galeria (±1).
 * @param {Array<{ id: string }>} [items]
 * @param {string} id
 * @param {-1|1} direction
 * @returns {Array<{ id: string }>}
 */
export function movePhotoItem(items, id, direction) {
  const list = items ?? [];
  const index = list.findIndex((item) => item.id === id);
  const nextIndex = index + direction;

  if (index < 0 || nextIndex < 0 || nextIndex >= list.length) return list;

  const next = [...list];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

/**
 * Monta entradas finais na ordem dos itens (existentes + recém-enviados).
 * @param {Array<{ existing?: boolean, url?: string, thumbUrl?: string, file?: File }>} [items]
 * @param {Array<string|{ url: string, thumb: string }>} [uploaded] - Na mesma ordem dos pendentes.
 * @returns {Array<string|{ url: string, thumb: string }>}
 */
export function buildFotosUrlsFromPhotoItems(items, uploaded = []) {
  let pendingIndex = 0;

  return (items ?? [])
    .map((item) => {
      if (item.existing && item.url) {
        return serializePhotoEntry({
          url: item.url,
          thumb: item.thumbUrl || item.url,
          blur: item.blurUrl,
        });
      }
      if (item.file) {
        const entry = uploaded[pendingIndex];
        pendingIndex += 1;
        if (!entry) return null;
        if (typeof entry === "string") return entry;
        return serializePhotoEntry(entry);
      }
      return null;
    })
    .filter(Boolean);
}
