/**
 * Gera artes do calendário semanal via Placid e exporta agenda para mLabs.
 *
 * Uso:
 *   npm run marketing:semana -- ~/Downloads/calendario_07_14_julho.csv
 *   npm run marketing:semana -- --dry-run calendario.csv
 *   npm run marketing:reels -- --local-reels ~/Downloads/calendario_07_14_julho.csv
 *
 * Requer em .env.local:
 *   PLACID_API_TOKEN
 *   PLACID_TEMPLATE_POST_FEED
 *   PLACID_TEMPLATE_STORY_SIMPLES
 *   PLACID_TEMPLATE_REEL_CAPA
 *   PLACID_TEMPLATE_REEL_VIDEO (opcional — se omitido, usa reel-capa na API de vídeo)
 *   NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (fotos dos lugares)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildInstagramCaption,
  buildMarketingFilename,
  buildPhotoCatalog,
  buildPlacidLayers,
  buildReelCapaFilename,
  buildReelVideoClips,
  buildReelVideoLayers,
  extractPlacidImageUrl,
  extractPlacidVideoUrl,
  fetchPlacidImageResponse,
  isReelRow,
  matchPlacePhoto,
  parseMarketingCsv,
  parseReelScriptLines,
  resolveMarketingOutputDirName,
  resolvePlacidTemplateKeyForRow,
  resolvePlacidTemplateUuid,
  rowNeedsPlacePhoto,
} from "../lib/marketingSemana.js";
import {
  generateReelFromImage,
  isPlacidCreditsError,
} from "../lib/marketingReelLocal.js";
import { createServiceClient } from "../lib/supabase/service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PLACID_IMAGE_API_URL = "https://api.placid.app/api/rest/images";
const PLACID_VIDEO_API_URL = "https://api.placid.app/api/rest/videos";
const POLL_INTERVAL_MS = 1500;
const POLL_MAX_ATTEMPTS_IMAGE = 20;
const POLL_MAX_ATTEMPTS_VIDEO = 60;
const REQUEST_GAP_MS = 400;

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!(key in process.env)) process.env[key] = value;
  }
}

/**
 * @param {string[]} argv
 */
function parseCliArgs(argv) {
  const dryRun = argv.includes("--dry-run");
  const reelsOnly = argv.includes("--reels-only");
  const localReels = argv.includes("--local-reels");
  const files = argv.filter((arg) => !arg.startsWith("--"));
  return { dryRun, reelsOnly, localReels, csvPath: files[0] ?? "" };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @returns {Promise<{ lugares: object[], rotas: object[] }>}
 */
async function fetchPhotoSources() {
  const supabase = createServiceClient();
  if (!supabase) {
    throw new Error(
      "Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local para buscar fotos."
    );
  }

  const [lugaresResult, rotasResult] = await Promise.all([
    supabase
      .from("lugares")
      .select("nome, imagem_url, fotos, status")
      .eq("status", "ativo"),
    supabase
      .from("rotas")
      .select("nome, fotos, foto_capa, ativa")
      .eq("ativa", true),
  ]);

  if (lugaresResult.error) {
    throw new Error(`Erro ao buscar lugares: ${lugaresResult.error.message}`);
  }
  if (rotasResult.error) {
    throw new Error(`Erro ao buscar atrativos: ${rotasResult.error.message}`);
  }

  return {
    lugares: lugaresResult.data ?? [],
    rotas: rotasResult.data ?? [],
  };
}

/**
 * @param {string} token
 * @param {string} templateUuid
 * @param {Record<string, Record<string, string>>} layers
 * @returns {Promise<object>}
 */
async function createPlacidImage(token, templateUuid, layers) {
  const response = await fetch(PLACID_IMAGE_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_uuid: templateUuid,
      create_now: true,
      layers,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Placid HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

/**
 * @param {string} token
 * @param {Array<{ template_uuid: string, layers: object }>} clips
 * @returns {Promise<object>}
 */
async function createPlacidVideo(token, clips) {
  const response = await fetch(PLACID_VIDEO_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      clips,
      modifications: {
        format: "mp4",
        fps: 30,
      },
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Placid video HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

/**
 * @param {string} token
 * @param {number|string} mediaId
 * @param {"image"|"video"} kind
 * @returns {Promise<object>}
 */
async function getPlacidMedia(token, mediaId, kind) {
  const baseUrl = kind === "video" ? PLACID_VIDEO_API_URL : PLACID_IMAGE_API_URL;
  const response = await fetch(`${baseUrl}/${mediaId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.message ||
      payload?.error ||
      `Placid GET HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}

/**
 * @param {string} token
 * @param {object} initialPayload
 * @param {"image"|"video"} kind
 * @returns {Promise<object>}
 */
async function waitForPlacidMedia(token, initialPayload, kind) {
  let current = initialPayload;
  const maxAttempts = kind === "video" ? POLL_MAX_ATTEMPTS_VIDEO : POLL_MAX_ATTEMPTS_IMAGE;
  const extractUrl = kind === "video" ? extractPlacidVideoUrl : extractPlacidImageUrl;
  const label = kind === "video" ? "vídeo" : "imagem";

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    if (current?.status === "finished" && extractUrl(current)) {
      return current;
    }
    if (current?.status === "error") {
      const errors = Array.isArray(current.errors) ? current.errors.join("; ") : "erro desconhecido";
      throw new Error(`Placid falhou ao gerar ${label}: ${errors}`);
    }

    await sleep(POLL_INTERVAL_MS);
    if (!current?.id) break;
    current = await getPlacidMedia(token, current.id, kind);
  }

  throw new Error(`Timeout aguardando ${label} do Placid.`);
}

/**
 * @param {string} mediaUrl
 * @param {string} destPath
 * @param {string} token
 */
async function downloadPlacidFile(mediaUrl, destPath, token) {
  const response = await fetchPlacidImageResponse(mediaUrl, token);
  if (!response.ok) {
    throw new Error(`Download falhou (${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(destPath, buffer);
}

/**
 * @param {import("../lib/marketingSemana.js").MarketingRow} row
 * @param {import("../lib/marketingSemana.js").PhotoCatalogEntry[]} catalog
 * @param {string|undefined} fallbackPhotoUrl
 */
function resolveRowPhoto(row, catalog, fallbackPhotoUrl) {
  if (!rowNeedsPlacePhoto(row)) {
    return { photoUrl: null, photoSource: null, warnings: [] };
  }

  const hint = `${row.texto_na_arte} ${row.legenda} ${row.notas_producao}`;
  const match = matchPlacePhoto(hint, catalog);
  if (match) {
    return {
      photoUrl: match.photoUrl,
      photoSource: match.source,
      warnings: [],
    };
  }

  if (fallbackPhotoUrl) {
    return {
      photoUrl: fallbackPhotoUrl,
      photoSource: "fallback:MARKETING_FALLBACK_IMAGE_URL",
      warnings: [
        `Foto não encontrada no Supabase para "${row.texto_na_arte.slice(0, 60)}..." — usando fallback.`,
      ],
    };
  }

  return {
    photoUrl: null,
    photoSource: null,
    warnings: [
      `Foto não encontrada no Supabase para "${row.texto_na_arte.slice(0, 60)}..." — gerando sem camada foto.`,
    ],
  };
}

/**
 * @param {string} mp4Path
 * @param {string} capaPath
 * @returns {string}
 */
function resolveLocalReelImagePath(mp4Path, capaPath) {
  const candidates = [
    capaPath,
    mp4Path.replace(/\.mp4$/i, ".jpg"),
    mp4Path.replace(/-reel-/, "-reel-capa-").replace(/\.mp4$/i, ".jpg"),
  ];

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }

  throw new Error(
    "Capa JPG não encontrada para gerar o MP4 local. Gere as capas antes ou use o Placid."
  );
}

/**
 * @param {import("../lib/marketingSemana.js").MarketingRow} row
 * @param {string} mp4Path
 * @param {string} capaPath
 * @param {Record<string, unknown>} agendaEntry
 */
async function generateLocalReel(row, mp4Path, capaPath, agendaEntry) {
  const imagePath = resolveLocalReelImagePath(mp4Path, capaPath);
  const scriptLines = parseReelScriptLines(row.notas_producao, row.texto_na_arte);
  const durationSec = Math.min(
    30,
    Math.max(8, Math.round(scriptLines.length * 2.2 + 6))
  );

  await generateReelFromImage({
    inputPath: imagePath,
    outputPath: mp4Path,
    durationSec,
  });

  agendaEntry.status = "generated";
  agendaEntry.generator = "ffmpeg-local";
  agendaEntry.local_source_image = imagePath;
  agendaEntry.video_duration_sec = durationSec;
  agendaEntry.warnings.push(
    "MP4 gerado localmente (Ken Burns) — sem marca d'água do Placid."
  );
}
/**
 * @param {string} token
 * @param {import("../lib/marketingSemana.js").MarketingRow} row
 * @param {string|null} photoUrl
 * @param {string} capaAbsoluto
 */
async function generateReelCapaImage(token, row, photoUrl, capaAbsoluto) {
  const capaUuid = resolvePlacidTemplateUuid(process.env, "reel-capa");
  if (!capaUuid) return;

  const layers = buildPlacidLayers({
    templateCanva: "reel-capa",
    textoNaArte: row.texto_na_arte,
    photoUrl: null,
  });

  const created = await createPlacidImage(token, capaUuid, layers);
  const finished = await waitForPlacidMedia(token, created, "image");
  const imageUrl = extractPlacidImageUrl(finished);
  if (!imageUrl) return;

  await downloadPlacidFile(imageUrl, capaAbsoluto, token);
}

/**
 * @param {Record<string, unknown>} agendaEntry
 * @param {string} agendaPath
 */
function upsertAgendaItem(agendaEntry, agendaPath) {
  /** @type {{ items?: Array<Record<string, unknown>> } & Record<string, unknown>} */
  let agenda = { items: [] };
  if (fs.existsSync(agendaPath)) {
    agenda = JSON.parse(fs.readFileSync(agendaPath, "utf8"));
  }

  const items = Array.isArray(agenda.items) ? agenda.items : [];
  const index = items.findIndex((item) => item.ordem === agendaEntry.ordem);
  if (index >= 0) {
    items[index] = { ...items[index], ...agendaEntry };
  } else {
    items.push(agendaEntry);
  }

  items.sort((a, b) => Number(a.ordem) - Number(b.ordem));

  const nextAgenda = {
    ...agenda,
    atualizado_em: new Date().toISOString(),
    items,
    total: items.length,
    gerados: items.filter((item) => item.status === "generated").length,
    erros: items.filter((item) => item.status === "error").length,
  };

  fs.writeFileSync(agendaPath, `${JSON.stringify(nextAgenda, null, 2)}\n`, "utf8");
}

async function main() {
  loadEnvLocal();

  const { dryRun, reelsOnly, localReels, csvPath: rawCsvPath } = parseCliArgs(process.argv.slice(2));
  const csvPath = rawCsvPath ? path.resolve(process.cwd(), rawCsvPath) : "";

  if (!csvPath || !fs.existsSync(csvPath)) {
    console.error(
      "Uso: npm run marketing:semana -- [--dry-run] [--reels-only] [--local-reels] caminho/do/calendario.csv"
    );
    process.exit(1);
  }

  const token = process.env.PLACID_API_TOKEN?.trim();
  if (!token && !dryRun) {
    console.error("PLACID_API_TOKEN ausente em .env.local");
    process.exit(1);
  }

  const csvContent = fs.readFileSync(csvPath, "utf8");
  let rows = parseMarketingCsv(csvContent);
  if (reelsOnly) {
    rows = rows.filter((row) => isReelRow(row));
  }

  if (rows.length === 0) {
    console.error(reelsOnly ? "Nenhum reel encontrado no CSV." : "Nenhuma linha válida encontrada no CSV.");
    process.exit(1);
  }

  const outputDirName = resolveMarketingOutputDirName(csvPath);
  const outputDir = path.join(ROOT, "out", "marketing", outputDirName);
  fs.mkdirSync(outputDir, { recursive: true });

  let catalog = [];
  if (!localReels) {
    const { lugares, rotas } = await fetchPhotoSources();
    catalog = buildPhotoCatalog(lugares, rotas);
  }
  const fallbackPhotoUrl = process.env.MARKETING_FALLBACK_IMAGE_URL?.trim() || "";
  const agendaPath = path.join(outputDir, "agenda.json");

  /** @type {string[]} */
  const globalWarnings = [];

  console.log(`Calendário: ${rows.length} itens${reelsOnly ? " (somente reels)" : ""}`);
  console.log(`Saída: ${outputDir}`);
  if (
    reelsOnly &&
    !process.env.PLACID_TEMPLATE_REEL_VIDEO?.trim() &&
    process.env.PLACID_TEMPLATE_REEL_CAPA?.trim()
  ) {
    console.log(
      "PLACID_TEMPLATE_REEL_VIDEO não definido — usando template reel-capa na API de vídeo."
    );
  }
  if (localReels) {
    console.log("Modo local — MP4 via ffmpeg a partir da capa JPG.");
  }

  if (dryRun) console.log("Modo dry-run — sem chamadas ao Placid.");

  const reelClipMode = String(process.env.MARKETING_REEL_CLIP_MODE || "single")
    .trim()
    .toLowerCase();

  const allRows = parseMarketingCsv(csvContent);

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index];
    const itemOrdem =
      reelsOnly
        ? allRows.findIndex(
            (candidate) =>
              candidate.data === row.data &&
              candidate.horario === row.horario &&
              candidate.texto_na_arte === row.texto_na_arte
          ) + 1
        : index + 1;
    const placidKey = resolvePlacidTemplateKeyForRow(row, process.env);
    const templateUuid = placidKey
      ? resolvePlacidTemplateUuid(process.env, placidKey)
      : null;

    const filename = buildMarketingFilename(row.texto_na_arte, row.formato, itemOrdem);
    const capaFilename = buildReelCapaFilename(row.texto_na_arte, itemOrdem);
    const arquivoRelativo = path.join("out", "marketing", outputDirName, filename);
    const arquivoAbsoluto = path.join(outputDir, filename);
    const capaRelativo = path.join("out", "marketing", outputDirName, capaFilename);
    const capaAbsoluto = path.join(outputDir, capaFilename);

    const photo = resolveRowPhoto(row, catalog, fallbackPhotoUrl);

    /** @type {Record<string, unknown>} */
    const agendaEntry = {
      ordem: itemOrdem,
      data: row.data,
      horario: row.horario,
      formato: row.formato,
      template_canva: row.template_canva,
      template_placid: placidKey,
      texto_na_arte: row.texto_na_arte,
      legenda: buildInstagramCaption(row),
      hashtags: row.hashtags,
      notas_producao: row.notas_producao,
      arquivo: arquivoRelativo.replace(/\\/g, "/"),
      photo_url: photo.photoUrl,
      photo_source: photo.photoSource,
      warnings: [...photo.warnings],
    };

    if (isReelRow(row)) {
      agendaEntry.arquivo_capa = capaRelativo.replace(/\\/g, "/");
      agendaEntry.reel_script = row.notas_producao;
    }

    if ((!placidKey || !templateUuid) && !(isReelRow(row) && localReels)) {
      agendaEntry.status = "skipped";
      const missingTemplateMessage = isReelRow(row)
        ? "Configure PLACID_TEMPLATE_REEL_VIDEO ou PLACID_TEMPLATE_REEL_CAPA em .env.local."
        : `Template "${row.template_canva}" sem mapeamento ou UUID Placid.`;
      agendaEntry.warnings.push(missingTemplateMessage);
      upsertAgendaItem(agendaEntry, agendaPath);
      globalWarnings.push(`Item ${itemOrdem}: template não configurado.`);
      continue;
    }

    if (dryRun) {
      agendaEntry.status = "dry-run";
      if (isReelRow(row)) {
        const videoLayers = buildReelVideoLayers({
          textoNaArte: row.texto_na_arte,
          photoUrl: photo.photoUrl,
          notasProducao: row.notas_producao,
        });
        const scriptLines = parseReelScriptLines(row.notas_producao, row.texto_na_arte);
        agendaEntry.placid_video_clips = buildReelVideoClips(templateUuid, videoLayers, {
          scriptLines,
          textoNaArte: row.texto_na_arte,
          photoUrl: photo.photoUrl,
        });
      } else {
        agendaEntry.placid_layers = buildPlacidLayers({
          templateCanva: row.template_canva,
          textoNaArte: row.texto_na_arte,
          photoUrl: photo.photoUrl,
        });
      }
      upsertAgendaItem(agendaEntry, agendaPath);
      console.log(`[dry-run] ${itemOrdem}. ${row.data} ${row.horario} → ${filename}`);
      continue;
    }

    try {
      if (isReelRow(row) && localReels) {
        await generateLocalReel(row, arquivoAbsoluto, capaAbsoluto, agendaEntry);
        console.log(`✓ ${itemOrdem}. ${filename} (local)`);
      } else if (isReelRow(row)) {
        const videoLayers = buildReelVideoLayers({
          textoNaArte: row.texto_na_arte,
          photoUrl: photo.photoUrl,
          notasProducao: row.notas_producao,
        });
        const scriptLines = parseReelScriptLines(row.notas_producao, row.texto_na_arte);
        const clipOptions =
          reelClipMode === "slideshow"
            ? { scriptLines, textoNaArte: row.texto_na_arte, photoUrl: photo.photoUrl }
            : { scriptLines: [], textoNaArte: row.texto_na_arte, photoUrl: photo.photoUrl };
        const clips = buildReelVideoClips(templateUuid, videoLayers, clipOptions);
        let created;
        try {
          created = await createPlacidVideo(token, clips);
        } catch (placidError) {
          if (isPlacidCreditsError(placidError)) {
            console.warn(`⚠ Item ${itemOrdem}: sem créditos Placid — gerando MP4 local.`);
            await generateLocalReel(row, arquivoAbsoluto, capaAbsoluto, agendaEntry);
            console.log(`✓ ${itemOrdem}. ${filename} (local)`);
            upsertAgendaItem(agendaEntry, agendaPath);
            await sleep(REQUEST_GAP_MS);
            continue;
          }
          throw placidError;
        }

        const finished = await waitForPlacidMedia(token, created, "video");
        const videoUrl = extractPlacidVideoUrl(finished);

        if (!videoUrl) {
          throw new Error("Placid não retornou video_url.");
        }

        await downloadPlacidFile(videoUrl, arquivoAbsoluto, token);

        try {
          await generateReelCapaImage(token, row, photo.photoUrl, capaAbsoluto);
          agendaEntry.capa_status = "generated";
        } catch (capaError) {
          agendaEntry.capa_status = "error";
          agendaEntry.warnings.push(
            capaError instanceof Error ? capaError.message : String(capaError)
          );
        }

        agendaEntry.status = "generated";
        agendaEntry.generator = "placid-video";
        agendaEntry.placid_video_id = finished.id ?? created.id ?? null;
        agendaEntry.placid_video_url = videoUrl;
        console.log(
          `✓ ${itemOrdem}. ${filename}${agendaEntry.capa_status === "generated" ? ` + ${capaFilename}` : ""}`
        );
      } else {
        const layers = buildPlacidLayers({
          templateCanva: row.template_canva,
          textoNaArte: row.texto_na_arte,
          photoUrl: photo.photoUrl,
        });
        const created = await createPlacidImage(token, templateUuid, layers);
        const finished = await waitForPlacidMedia(token, created, "image");
        const imageUrl = extractPlacidImageUrl(finished);

        if (!imageUrl) {
          throw new Error("Placid não retornou image_url.");
        }

        await downloadPlacidFile(imageUrl, arquivoAbsoluto, token);

        agendaEntry.status = "generated";
        agendaEntry.placid_image_id = finished.id ?? created.id ?? null;
        agendaEntry.placid_image_url = imageUrl;
        console.log(`✓ ${itemOrdem}. ${filename}`);
      }
    } catch (error) {
      agendaEntry.status = "error";
      agendaEntry.error = error instanceof Error ? error.message : String(error);
      agendaEntry.warnings.push(agendaEntry.error);
      globalWarnings.push(`Item ${itemOrdem}: ${agendaEntry.error}`);
      console.error(`✗ ${itemOrdem}. ${filename} — ${agendaEntry.error}`);
    }

    upsertAgendaItem(agendaEntry, agendaPath);
    await sleep(REQUEST_GAP_MS);
  }

  const agenda = fs.existsSync(agendaPath)
    ? JSON.parse(fs.readFileSync(agendaPath, "utf8"))
    : { total: 0, gerados: 0, erros: 0 };

  console.log("");
  console.log(`Agenda: ${agendaPath}`);
  console.log(`Gerados: ${agenda.gerados}/${agenda.total}`);

  if (agenda.erros > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
