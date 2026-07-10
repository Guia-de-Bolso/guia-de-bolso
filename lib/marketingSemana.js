/**
 * Calendário de marketing Instagram → Placid + agenda mLabs.
 */

import { getCapaFromAtrativo, getCapaFromLugar } from "./fotos.js";

/** @typedef {{ data: string, horario: string, formato: string, template_canva: string, texto_na_arte: string, legenda: string, hashtags: string, notas_producao: string }} MarketingRow */

/** @typedef {{ nome: string, photoUrl: string, source: string }} PhotoCatalogEntry */

export const MARKETING_CSV_COLUMNS = [
  "data",
  "horario",
  "formato",
  "template_canva",
  "texto_na_arte",
  "legenda",
  "hashtags",
  "notas_producao",
];

export const TEMPLATE_CANVA_TO_PLACID_KEY = {
  "post-praia": "post-feed",
  "post-dica": "post-feed",
  "story-simples": "story-simples",
  "story-enquete": "story-simples",
  "reel-capa": "reel-capa",
};

const POST_TEMPLATES = new Set(["post-praia", "post-dica"]);

const PLACID_ENV_BY_KEY = {
  "post-feed": "PLACID_TEMPLATE_POST_FEED",
  "story-simples": "PLACID_TEMPLATE_STORY_SIMPLES",
  "reel-capa": "PLACID_TEMPLATE_REEL_CAPA",
  "reel-video": "PLACID_TEMPLATE_REEL_VIDEO",
};

const PLACID_TEXT_LAYER = "text";
const PLACID_PHOTO_LAYER = "foto";

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeMarketingText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/**
 * @param {string} name
 * @returns {string}
 */
function normalizeCsvHeader(name) {
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Parseia CSV com separador `;` (campos entre aspas opcionais).
 * @param {string} content
 * @returns {MarketingRow[]}
 */
export function parseMarketingCsv(content) {
  const lines = String(content || "")
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]);
  const columnIndex = Object.fromEntries(
    header.map((name, index) => [normalizeCsvHeader(name), index])
  );

  return lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    /** @type {Record<string, string>} */
    const row = {};
    for (const column of MARKETING_CSV_COLUMNS) {
      const index = columnIndex[normalizeCsvHeader(column)];
      row[column] = index == null ? "" : String(cells[index] ?? "").trim();
    }
    return /** @type {MarketingRow} */ (row);
  });
}

/**
 * @param {string} line
 * @returns {string[]}
 */
function parseCsvLine(line) {
  /** @type {string[]} */
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (char === ";" && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }
    current += char;
  }

  cells.push(current);
  return cells;
}

/**
 * @param {string} templateCanva
 * @returns {string|null}
 */
export function resolvePlacidTemplateKey(templateCanva) {
  return TEMPLATE_CANVA_TO_PLACID_KEY[templateCanva] ?? null;
}

/**
 * @param {Record<string, string|undefined>} env
 * @param {string} placidKey
 * @returns {string|null}
 */
export function resolvePlacidTemplateUuid(env, placidKey) {
  const envName = PLACID_ENV_BY_KEY[placidKey];
  if (!envName) return null;
  const value = env[envName]?.trim();
  return value || null;
}

/**
 * @param {string} templateCanva
 * @returns {boolean}
 */
export function templateNeedsPlacePhoto(templateCanva) {
  return POST_TEMPLATES.has(templateCanva);
}

/**
 * @param {{ formato?: string, template_canva?: string }} row
 * @returns {boolean}
 */
export function isReelRow(row) {
  return String(row?.formato || "").trim().toLowerCase() === "reel";
}

/**
 * @param {{ formato?: string, template_canva?: string }} row
 * @returns {boolean}
 */
export function rowNeedsPlacePhoto(row) {
  if (isReelRow(row)) return true;
  return templateNeedsPlacePhoto(String(row?.template_canva || ""));
}

/**
 * @param {{ formato?: string, template_canva?: string }} row
 * @param {Record<string, string|undefined>} [env]
 * @returns {string|null}
 */
export function resolvePlacidTemplateKeyForRow(row, env = {}) {
  if (isReelRow(row)) {
    if (resolvePlacidTemplateUuid(env, "reel-video")) return "reel-video";
    if (resolvePlacidTemplateUuid(env, "reel-capa")) return "reel-capa";
    return null;
  }
  return resolvePlacidTemplateKey(String(row?.template_canva || ""));
}

/**
 * Extrai linhas do roteiro do reel a partir de `notas_producao`.
 * @param {string} notasProducao
 * @param {string} textoNaArte
 * @returns {string[]}
 */
export function parseReelScriptLines(notasProducao, textoNaArte) {
  const raw = String(notasProducao || "");
  const match = raw.match(/texto do reel:\s*(.+)$/i);
  if (match?.[1]) {
    const lines = match[1]
      .split(/\s*\/\s*/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length > 0) return lines;
  }

  const fallback = String(textoNaArte || "").trim();
  return fallback ? [fallback] : [];
}

/**
 * @param {{ textoNaArte: string, photoUrl?: string|null, notasProducao?: string }} params
 * @returns {Record<string, Record<string, string|string[]>>}
 */
export function buildReelVideoLayers({ textoNaArte, photoUrl, notasProducao }) {
  const lines = parseReelScriptLines(notasProducao, textoNaArte);
  /** @type {Record<string, Record<string, string|string[]>>} */
  const layers = {
    [PLACID_TEXT_LAYER]: {
      text: lines.length > 1 ? lines : lines[0] || String(textoNaArte || "").trim(),
    },
  };

  if (photoUrl) {
    layers[PLACID_PHOTO_LAYER] = { image: photoUrl };
  }

  return layers;
}

/**
 * Monta clips do reel. Com várias linhas de roteiro, gera um clip por linha
 * (slideshow no Placid) reutilizando foto e trocando só o texto.
 *
 * @param {string} templateUuid
 * @param {Record<string, Record<string, string|string[]>>} layers
 * @param {{ scriptLines?: string[], textoNaArte?: string, photoUrl?: string|null }} [options]
 * @returns {Array<{ template_uuid: string, layers: Record<string, Record<string, string|string[]>> }>}
 */
export function buildReelVideoClips(templateUuid, layers, options = {}) {
  const scriptLines = Array.isArray(options.scriptLines)
    ? options.scriptLines.filter(Boolean)
    : [];
  const photoUrl = options.photoUrl || layers[PLACID_PHOTO_LAYER]?.image || null;
  const fallbackText = String(options.textoNaArte || layers[PLACID_TEXT_LAYER]?.text || "").trim();

  if (scriptLines.length <= 1) {
    return [
      {
        template_uuid: templateUuid,
        layers,
      },
    ];
  }

  return scriptLines.map((line) => {
    /** @type {Record<string, Record<string, string|string[]>>} */
    const clipLayers = {
      [PLACID_TEXT_LAYER]: { text: line },
    };
    if (photoUrl) {
      clipLayers[PLACID_PHOTO_LAYER] = { image: String(photoUrl) };
    }
    return {
      template_uuid: templateUuid,
      layers: clipLayers,
    };
  });
}

/**
 * @param {string} textoNaArte
 * @returns {string}
 */
export function extractPlaceHint(textoNaArte) {
  const firstLine = String(textoNaArte || "").split(/\n/)[0].trim();
  const beforeDot = firstLine.split(/[.?!]/)[0].trim();
  return beforeDot || firstLine;
}

/**
 * @param {string} text
 * @param {PhotoCatalogEntry[]} catalog
 * @returns {PhotoCatalogEntry|null}
 */
export function matchPlacePhoto(text, catalog) {
  const haystack = normalizeMarketingText(text);
  if (!haystack) return null;

  /** @type {PhotoCatalogEntry|null} */
  let best = null;

  for (const entry of catalog) {
    const needle = normalizeMarketingText(entry.nome);
    if (needle.length < 4) continue;
    if (!haystack.includes(needle)) continue;
    if (!best || needle.length > normalizeMarketingText(best.nome).length) {
      best = entry;
    }
  }

  return best;
}

/**
 * @param {Array<{ nome?: string, titulo?: string, imagem_url?: string, fotos?: unknown }>} lugares
 * @param {Array<{ nome?: string, titulo?: string, imagem_url?: string, fotos?: unknown, foto_capa?: string, imagem_capa?: string }>} rotas
 * @returns {PhotoCatalogEntry[]}
 */
export function buildPhotoCatalog(lugares, rotas) {
  /** @type {PhotoCatalogEntry[]} */
  const catalog = [];

  for (const lugar of lugares ?? []) {
    const nome = String(lugar.nome || "").trim();
    const photoUrl = getCapaFromLugar(lugar);
    if (!nome || !photoUrl) continue;
    catalog.push({ nome, photoUrl, source: `lugares:${nome}` });
  }

  for (const rota of rotas ?? []) {
    const nome = String(rota.nome || rota.titulo || "").trim();
    const photoUrl = getCapaFromAtrativo(rota);
    if (!nome || !photoUrl) continue;
    catalog.push({ nome, photoUrl, source: `rotas:${nome}` });
  }

  return catalog.sort(
    (a, b) => normalizeMarketingText(b.nome).length - normalizeMarketingText(a.nome).length
  );
}

/**
 * @param {{ templateCanva: string, textoNaArte: string, photoUrl?: string|null }} params
 * @returns {Record<string, Record<string, string>>}
 */
export function buildPlacidLayers({ templateCanva, textoNaArte, photoUrl }) {
  /** @type {Record<string, Record<string, string>>} */
  const layers = {
    [PLACID_TEXT_LAYER]: { text: String(textoNaArte || "").trim() },
  };

  if (templateNeedsPlacePhoto(templateCanva) && photoUrl) {
    layers[PLACID_PHOTO_LAYER] = { image: photoUrl };
  }

  return layers;
}

/**
 * @param {string} textoNaArte
 * @param {string} formato
 * @param {number} ordem
 * @returns {string}
 */
export function buildMarketingFilename(textoNaArte, formato, ordem) {
  const hint = extractPlaceHint(textoNaArte);
  const slug = normalizeMarketingText(hint)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  const safeSlug = slug || "conteudo";
  const extension = String(formato || "").toLowerCase() === "reel" ? "mp4" : "jpg";
  return `${String(ordem).padStart(2, "0")}-${formato}-${safeSlug}.${extension}`;
}

/**
 * Nome do arquivo de capa estática para reels (upload opcional no mLabs).
 * @param {string} textoNaArte
 * @param {number} ordem
 * @returns {string}
 */
export function buildReelCapaFilename(textoNaArte, ordem) {
  const hint = extractPlaceHint(textoNaArte);
  const slug = normalizeMarketingText(hint)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const safeSlug = slug || "conteudo";
  return `${String(ordem).padStart(2, "0")}-reel-capa-${safeSlug}.jpg`;
}

/**
 * @param {string} csvPath
 * @returns {string}
 */
export function resolveMarketingOutputDirName(csvPath) {
  const base = String(csvPath || "")
    .split(/[/\\]/)
    .pop()
    ?.replace(/\.csv$/i, "")
    ?.trim();

  if (!base) return "semana-marketing";
  if (base.toLowerCase().startsWith("calendario_")) {
    return `semana-${base.slice("calendario_".length)}`;
  }
  return base;
}

/**
 * Monta legenda completa para o Instagram (legenda + hashtags).
 * @param {MarketingRow} row
 * @returns {string}
 */
export function buildInstagramCaption(row) {
  const legenda = String(row.legenda || "").trim();
  const hashtags = String(row.hashtags || "").trim();

  if (!legenda || legenda === "—" || legenda === "-") {
    return hashtags;
  }
  if (!hashtags || hashtags === "—" || hashtags === "-") {
    return legenda;
  }
  return `${legenda}\n\n${hashtags}`;
}

/**
 * @param {string} imageUrl
 * @param {string} [token]
 * @returns {Promise<Response>}
 */
export async function fetchPlacidImageResponse(imageUrl, token) {
  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; GuiaDeBolsoMarketing/1.0)",
  };

  let response = await fetch(imageUrl, { headers });
  if (response.ok) return response;

  if (token) {
    response = await fetch(imageUrl, {
      headers: {
        ...headers,
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return response;
}

/**
 * @param {unknown} payload
 * @returns {string|null}
 */
export function extractPlacidImageUrl(payload) {
  if (!payload || typeof payload !== "object") return null;
  const url = /** @type {{ image_url?: string }} */ (payload).image_url;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}

/**
 * @param {unknown} payload
 * @returns {string|null}
 */
export function extractPlacidVideoUrl(payload) {
  if (!payload || typeof payload !== "object") return null;
  const record = /** @type {{ video_url?: string, image_url?: string }} */ (payload);
  const url = record.video_url || record.image_url;
  return typeof url === "string" && url.trim() ? url.trim() : null;
}
