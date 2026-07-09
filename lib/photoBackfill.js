import { normalizePhotoEntry, parseFotos, serializePhotoEntry } from "./fotos.js";

export const LUGARES_FOTOS_BUCKET = "lugares-fotos";
export const ROTAS_FOTOS_BUCKET = "rotas-fotos";

/** @typedef {'lugares'|'rotas'} PhotoEntityTable */

/**
 * @typedef {object} StorageLocation
 * @property {string} bucket
 * @property {string} path
 */

/**
 * @typedef {object} PhotoBackfillNeeds
 * @property {boolean} needed
 * @property {boolean} missingBlur
 * @property {boolean} missingThumb
 * @property {import('./fotos.js').PhotoEntry|null} normalized
 */

/**
 * @typedef {object} PhotoBackfillItem
 * @property {number} index
 * @property {unknown} entry
 * @property {boolean} [promoteLegacy]
 */

/**
 * @param {string} url
 * @returns {boolean}
 */
export function isManagedStoragePhotoUrl(url) {
  return /\/storage\/v1\/object\/public\/(lugares-fotos|rotas-fotos)\//.test(url);
}

/**
 * @param {string} url
 * @returns {StorageLocation|null}
 */
export function parseStoragePublicUrl(url) {
  try {
    const parsed = new URL(url);
    const prefix = "/storage/v1/object/public/";
    const idx = parsed.pathname.indexOf(prefix);
    if (idx === -1) return null;

    const rest = parsed.pathname.slice(idx + prefix.length);
    const slash = rest.indexOf("/");
    if (slash === -1) return null;

    return {
      bucket: rest.slice(0, slash),
      path: decodeURIComponent(rest.slice(slash + 1)),
    };
  } catch {
    return null;
  }
}

/**
 * @param {string} supabaseUrl
 * @param {string} bucket
 * @param {string} objectPath
 * @returns {string}
 */
export function buildPublicStorageUrl(supabaseUrl, bucket, objectPath) {
  const base = String(supabaseUrl || "").replace(/\/$/, "");
  const encodedPath = objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/storage/v1/object/public/${bucket}/${encodedPath}`;
}

/**
 * @param {string} fullPath
 * @returns {string}
 */
export function buildThumbStoragePath(fullPath) {
  if (/-thumb\.[^.]+$/.test(fullPath)) return fullPath;
  const dot = fullPath.lastIndexOf(".");
  if (dot === -1) return `${fullPath}-thumb`;
  return `${fullPath.slice(0, dot)}-thumb${fullPath.slice(dot)}`;
}

/**
 * @param {string} fullPublicUrl
 * @param {string} supabaseUrl
 * @returns {string|null}
 */
export function inferThumbPublicUrl(fullPublicUrl, supabaseUrl) {
  const location = parseStoragePublicUrl(fullPublicUrl);
  if (!location) return null;
  return buildPublicStorageUrl(
    supabaseUrl,
    location.bucket,
    buildThumbStoragePath(location.path)
  );
}

/**
 * @param {unknown} entry
 * @param {{ force?: boolean }} [options]
 * @returns {PhotoBackfillNeeds}
 */
export function getPhotoDerivativeBackfillNeeds(entry, options = {}) {
  const normalized = normalizePhotoEntry(entry);
  if (!normalized?.url) {
    return { needed: false, missingBlur: false, missingThumb: false, normalized: null };
  }

  const missingBlur = !normalized.blur;
  const missingThumb =
    !normalized.thumb || normalized.thumb === normalized.url;

  if (options.force) {
    return {
      needed: true,
      missingBlur: true,
      missingThumb: true,
      normalized,
    };
  }

  return {
    needed: missingBlur || missingThumb,
    missingBlur,
    missingThumb,
    normalized,
  };
}

/**
 * Lista entradas de fotos de uma entidade (JSON ou URL legada única).
 * @param {object} entity
 * @param {{ fotosField?: string, legacyUrlField?: string }} [options]
 * @returns {PhotoBackfillItem[]}
 */
export function listPhotoEntriesForEntity(entity, options = {}) {
  const { fotosField = "fotos", legacyUrlField = "imagem_url" } = options;
  const raw = parseFotos(entity?.[fotosField]);

  if (raw.length > 0) {
    return raw.map((entry, index) => ({ entry, index, promoteLegacy: false }));
  }

  const legacy = entity?.[legacyUrlField];
  if (legacy) {
    return [{ entry: legacy, index: 0, promoteLegacy: true }];
  }

  return [];
}

/**
 * Mescla derivados gerados na entrada serializada para o JSON `fotos`.
 * @param {import('./fotos.js').PhotoEntry} existing
 * @param {{ thumbUrl?: string, blur?: string }} result
 * @returns {string|{ url: string, thumb?: string, blur?: string }}
 */
export function mergePhotoDerivativeBackfill(existing, result) {
  return serializePhotoEntry({
    url: existing.url,
    thumb: result.thumbUrl || existing.thumb || existing.url,
    blur: result.blur || existing.blur,
  });
}

/**
 * Aplica backfill em todas as entradas de uma entidade.
 * @param {unknown[]} entries
 * @param {Array<string|{ url: string, thumb?: string, blur?: string }>} updates
 * @param {PhotoBackfillItem[]} items
 * @returns {Array<string|{ url: string, thumb?: string, blur?: string }>}
 */
export function applyPhotoBackfillUpdates(entries, updates, items) {
  const next = [...entries];

  for (const item of items) {
    const update = updates[item.index];
    if (!update) continue;
    next[item.index] = update;
  }

  return next.filter(Boolean);
}

/**
 * @param {Array<string|{ url: string, thumb?: string, blur?: string }>} fotos
 * @returns {string}
 */
export function getPrimaryPhotoUrl(fotos) {
  const first = fotos?.[0];
  if (!first) return "";
  return typeof first === "string" ? first : first.url || "";
}
