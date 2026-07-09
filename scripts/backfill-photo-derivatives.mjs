/**
 * Backfill de thumb + blur LQIP para fotos legadas (lugares e rotas).
 *
 * Cobre o que o upload novo já gera automaticamente:
 * - thumbnail WebP (~480px) no Storage
 * - blur por foto (data URL JPEG 10×10) no JSON `fotos`
 * - promoção de `imagem_url` / `foto_capa` / `fotos_lugar` para `fotos` JSON
 *
 * Requer em .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Uso:
 *   npm run photos:backfill -- --dry-run
 *   npm run photos:backfill -- --limit 5
 *   npm run photos:backfill -- --lugares-only
 *   npm run photos:backfill -- --rotas-only
 *   npm run photos:backfill -- --entity-id <uuid>
 *   npm run photos:backfill -- --force
 *   npm run photos:backfill -- --blur-only
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyPhotoBackfillUpdates,
  buildPublicStorageUrl,
  buildThumbStoragePath,
  getPhotoDerivativeBackfillNeeds,
  getPrimaryPhotoUrl,
  inferThumbPublicUrl,
  isManagedStoragePhotoUrl,
  listPhotoEntriesForEntity,
  LUGARES_FOTOS_BUCKET,
  mergePhotoDerivativeBackfill,
  parseStoragePublicUrl,
  ROTAS_FOTOS_BUCKET,
} from "../lib/photoBackfill.js";
import { createPhotoDerivativesFromBuffer } from "../lib/photoBackfillSharp.js";
import { parseFotos } from "../lib/fotos.js";
import { createServiceClient } from "../lib/supabase/service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

/**
 * @param {string[]} argv
 * @param {string} flag
 * @returns {string}
 */
function readFlagValue(argv, flag) {
  const index = argv.indexOf(flag);
  if (index === -1) return "";
  return argv[index + 1] || "";
}

/**
 * @param {string[]} argv
 */
function parseCliArgs(argv) {
  return {
    dryRun: argv.includes("--dry-run"),
    force: argv.includes("--force"),
    blurOnly: argv.includes("--blur-only"),
    lugaresOnly: argv.includes("--lugares-only"),
    rotasOnly: argv.includes("--rotas-only"),
    includeLegacyTable: argv.includes("--include-legacy-table"),
    limit: Number(readFlagValue(argv, "--limit")) || 0,
    entityId: readFlagValue(argv, "--entity-id"),
  };
}

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
 * @param {string} url
 * @returns {Promise<boolean>}
 */
async function urlExists(url) {
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * @param {string} url
 * @returns {Promise<Buffer>}
 */
async function downloadImage(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} ao baixar ${url}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} bucket
 * @param {string} objectPath
 * @param {Buffer} body
 */
async function uploadThumb(supabase, bucket, objectPath, body) {
  const { error } = await supabase.storage.from(bucket).upload(objectPath, body, {
    cacheControl: "3600",
    upsert: true,
    contentType: "image/webp",
  });
  if (error) throw error;
}

/**
 * @param {import('./photoBackfill.js').PhotoBackfillItem & { entry: unknown }} item
 * @param {object} ctx
 */
async function processPhotoItem(item, ctx) {
  const needs = getPhotoDerivativeBackfillNeeds(item.entry, { force: ctx.force });
  if (!needs.needed || !needs.normalized) {
    return { skipped: true, reason: "completo" };
  }

  const fullUrl = needs.normalized.url;
  const managed = isManagedStoragePhotoUrl(fullUrl);
  let thumbUrl = needs.normalized.thumb;
  let blur = needs.normalized.blur || "";

  if (needs.missingThumb && managed && !ctx.blurOnly) {
    const inferredThumb = inferThumbPublicUrl(fullUrl, ctx.supabaseUrl);
    if (inferredThumb && (await urlExists(inferredThumb))) {
      thumbUrl = inferredThumb;
    }
  }

  const stillNeedsThumb =
    ctx.blurOnly === false &&
    needs.missingThumb &&
    (!thumbUrl || thumbUrl === fullUrl);

  const stillNeedsBlur = needs.missingBlur || !blur;

  if (!stillNeedsThumb && !stillNeedsBlur) {
    return {
      skipped: false,
      serialized: mergePhotoDerivativeBackfill(needs.normalized, { thumbUrl, blur }),
      action: "db-only-thumb-link",
    };
  }

  if (ctx.dryRun) {
    return {
      skipped: false,
      dryRun: true,
      fullUrl,
      wouldUploadThumb: stillNeedsThumb && managed,
      wouldWriteBlur: stillNeedsBlur,
    };
  }

  const imageBuffer = await downloadImage(fullUrl);
  const derivatives = await createPhotoDerivativesFromBuffer(imageBuffer);

  if (stillNeedsBlur) {
    blur = derivatives.blur;
  }

  if (stillNeedsThumb && managed) {
    const location = parseStoragePublicUrl(fullUrl);
    if (!location) throw new Error(`URL de storage inválida: ${fullUrl}`);

    const thumbPath = buildThumbStoragePath(location.path);
    await uploadThumb(ctx.supabase, location.bucket, thumbPath, derivatives.thumbBuffer);
    thumbUrl = buildPublicStorageUrl(ctx.supabaseUrl, location.bucket, thumbPath);
  } else if (stillNeedsThumb && !managed) {
    thumbUrl = fullUrl;
  }

  return {
    skipped: false,
    serialized: mergePhotoDerivativeBackfill(needs.normalized, { thumbUrl, blur }),
    action: stillNeedsThumb && managed ? "thumb+blur" : "blur-only",
  };
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @returns {Promise<Map<string, string[]>>}
 */
async function loadLegacyFotosLugar(supabase) {
  const { data, error } = await supabase
    .from("fotos_lugar")
    .select("lugar_id, url, imagem_url, foto_url, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    if (/relation .* does not exist/i.test(error.message)) {
      return new Map();
    }
    throw error;
  }

  /** @type {Map<string, string[]>} */
  const byLugar = new Map();

  for (const row of data ?? []) {
    const url = row.url || row.imagem_url || row.foto_url;
    if (!url) continue;
    if (!byLugar.has(row.lugar_id)) byLugar.set(row.lugar_id, []);
    byLugar.get(row.lugar_id).push(url);
  }

  return byLugar;
}

/**
 * @param {object} config
 */
async function backfillTable(config) {
  const {
    supabase,
    table,
    fotosField,
    legacyUrlField,
    coverField,
    bucketLabel,
    rows,
    ctx,
    stats,
  } = config;

  for (const row of rows) {
    if (ctx.limit > 0 && stats.processed >= ctx.limit) return;

    let items = listPhotoEntriesForEntity(row, { fotosField, legacyUrlField });

    if (
      items.length === 0 &&
      table === "lugares" &&
      ctx.legacyFotosByLugar?.has(row.id)
    ) {
      const legacyUrls = ctx.legacyFotosByLugar.get(row.id) ?? [];
      items = legacyUrls.map((url, index) => ({
        entry: url,
        index,
        promoteLegacy: true,
      }));
    }

    if (!items.length) continue;

    const rawEntries = parseFotos(row[fotosField]);
    const baseEntries =
      rawEntries.length > 0
        ? [...rawEntries]
        : items.some((item) => item.promoteLegacy)
          ? items.map((item) => item.entry)
          : [];

    /** @type {Array<string|object|null>} */
    const updates = [];
    let entityChanged = false;

    for (const item of items) {
      if (ctx.limit > 0 && stats.processed >= ctx.limit) break;

      const needs = getPhotoDerivativeBackfillNeeds(item.entry, { force: ctx.force });
      if (!needs.needed) {
        stats.skipped += 1;
        continue;
      }

      stats.processed += 1;

      try {
        const result = await processPhotoItem(item, ctx);

        if (result.skipped) {
          stats.skipped += 1;
          continue;
        }

        if (result.dryRun) {
          stats.planned += 1;
          console.log(
            `[dry-run] ${bucketLabel} ${row.id} foto ${item.index + 1}: ${result.fullUrl}` +
              (result.wouldUploadThumb ? " + thumb" : "") +
              (result.wouldWriteBlur ? " + blur" : "")
          );
          continue;
        }

        updates[item.index] = result.serialized;
        entityChanged = true;
        stats.updated += 1;
        console.log(
          `OK ${bucketLabel} ${row.id} foto ${item.index + 1} (${result.action}): ${needs.normalized?.url}`
        );
      } catch (error) {
        stats.errors += 1;
        console.error(
          `ERRO ${bucketLabel} ${row.id} foto ${item.index + 1}: ${error?.message || error}`
        );
      }
    }

    if (!entityChanged || ctx.dryRun) continue;

    const nextFotos = applyPhotoBackfillUpdates(baseEntries, updates, items);
    const payload = { [fotosField]: nextFotos };

    if (coverField) {
      payload[coverField] = getPrimaryPhotoUrl(nextFotos) || null;
    }

    const { error } = await supabase.from(table).update(payload).eq("id", row.id);
    if (error) throw error;

    stats.entitiesSaved += 1;
  }
}

async function main() {
  loadEnvLocal();

  const args = parseCliArgs(process.argv.slice(2));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabase = createServiceClient();

  if (!supabaseUrl || !supabase) {
    console.error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local"
    );
    process.exit(1);
  }

  const ctx = {
    supabase,
    supabaseUrl,
    dryRun: args.dryRun,
    force: args.force,
    blurOnly: args.blurOnly,
    limit: args.limit,
    legacyFotosByLugar: args.includeLegacyTable
      ? await loadLegacyFotosLugar(supabase)
      : null,
  };

  const stats = {
    processed: 0,
    updated: 0,
    skipped: 0,
    planned: 0,
    errors: 0,
    entitiesSaved: 0,
  };

  console.log(
    `Backfill de fotos — dryRun=${args.dryRun} force=${args.force} blurOnly=${args.blurOnly} limit=${args.limit || "∞"}`
  );

  if (!args.rotasOnly) {
    let query = supabase.from("lugares").select("id, fotos, imagem_url");
    if (args.entityId) query = query.eq("id", args.entityId);

    const { data: lugares, error } = await query;
    if (error) throw error;

    await backfillTable({
      supabase,
      table: "lugares",
      fotosField: "fotos",
      legacyUrlField: "imagem_url",
      coverField: "imagem_url",
      bucketLabel: LUGARES_FOTOS_BUCKET,
      rows: lugares ?? [],
      ctx,
      stats,
    });
  }

  if (!args.lugaresOnly) {
    let query = supabase.from("rotas").select("id, fotos, foto_capa");
    if (args.entityId) query = query.eq("id", args.entityId);

    const { data: rotas, error } = await query;
    if (error) throw error;

    await backfillTable({
      supabase,
      table: "rotas",
      fotosField: "fotos",
      legacyUrlField: "foto_capa",
      coverField: "foto_capa",
      bucketLabel: ROTAS_FOTOS_BUCKET,
      rows: rotas ?? [],
      ctx,
      stats,
    });
  }

  console.log("");
  console.log("Resumo:");
  console.log(`  Processadas: ${stats.processed}`);
  console.log(`  Atualizadas: ${stats.updated}`);
  console.log(`  Entidades salvas: ${stats.entitiesSaved}`);
  console.log(`  Ignoradas (já completas): ${stats.skipped}`);
  if (args.dryRun) console.log(`  Planejadas (dry-run): ${stats.planned}`);
  console.log(`  Erros: ${stats.errors}`);
}

main().catch((error) => {
  console.error("Falha no backfill:", error?.message || error);
  process.exit(1);
});
