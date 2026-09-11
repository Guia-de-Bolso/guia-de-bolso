#!/usr/bin/env node
/**
 * Aplica complete-pausados-lote-1: tags, subcategoria e contatos.
 *
 * Uso:
 *   node --env-file=.env.local scripts/apply-complete-pausados.mjs
 *   node --env-file=.env.local scripts/apply-complete-pausados.mjs --dry-run
 */
import { createClient } from "@supabase/supabase-js";
import { COMPLETE_PAUSADOS_LOTE_1 } from "./data/complete-pausados-lote-1.js";
import { tagMatchesSubcategoria } from "../lib/tagSubcategorias.js";

const dryRun = process.argv.includes("--dry-run");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: allTags, error: tagsErr } = await supabase
  .from("tags")
  .select("id, nome, categorias, subcategorias");
if (tagsErr) {
  console.error(tagsErr.message);
  process.exit(1);
}

const tagByName = new Map(
  (allTags || []).map((t) => [String(t.nome).trim().toLowerCase(), t])
);

const summary = { updated: 0, skipped: 0, tagLinks: 0, warnings: [] };

for (const item of COMPLETE_PAUSADOS_LOTE_1) {
  const slug = String(item.slug || "").trim();
  const { data: lugar, error } = await supabase
    .from("lugares")
    .select("id, nome, slug, status, categoria, subcategoria, telefone, instagram, site_url, cardapio_url")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error(`Erro ao ler ${slug}: ${error.message}`);
    process.exit(1);
  }
  if (!lugar) {
    summary.warnings.push(`slug não encontrado: ${slug}`);
    summary.skipped += 1;
    continue;
  }
  if (lugar.status !== "pausado") {
    summary.warnings.push(`${slug}: status=${lugar.status} (só atualiza pausado)`);
    summary.skipped += 1;
    continue;
  }

  const nextSub = item.subcategoria || lugar.subcategoria;
  const nextCat = lugar.categoria;
  const patch = {};
  if (item.subcategoria && item.subcategoria !== lugar.subcategoria) {
    patch.subcategoria = item.subcategoria;
  }
  if (item.telefone && !lugar.telefone) patch.telefone = item.telefone;
  if (item.instagram && !lugar.instagram) patch.instagram = item.instagram;
  if (item.site_url && !lugar.site_url) patch.site_url = item.site_url;
  if (item.cardapio_url && !lugar.cardapio_url) patch.cardapio_url = item.cardapio_url;

  const tagIds = [];
  for (const name of item.tags || []) {
    const tag = tagByName.get(String(name).trim().toLowerCase());
    if (!tag) {
      summary.warnings.push(`${slug}: tag inexistente "${name}"`);
      continue;
    }
    if (!tagMatchesSubcategoria(tag, nextCat, nextSub)) {
      summary.warnings.push(
        `${slug}: tag "${name}" fora de ${nextCat}/${nextSub}`
      );
      continue;
    }
    tagIds.push(tag.id);
  }
  const uniqueTagIds = [...new Set(tagIds)].slice(0, 5);

  if (dryRun) {
    console.log(
      `[dry-run] ${lugar.nome} (${slug}) patch=${JSON.stringify(patch)} tags=${uniqueTagIds.length}`
    );
    summary.updated += 1;
    summary.tagLinks += uniqueTagIds.length;
    continue;
  }

  if (Object.keys(patch).length > 0) {
    const { error: upErr } = await supabase
      .from("lugares")
      .update(patch)
      .eq("id", lugar.id);
    if (upErr) {
      console.error(`Falha update ${slug}: ${upErr.message}`);
      process.exit(1);
    }
  }

  if (uniqueTagIds.length > 0) {
    const { data: existing } = await supabase
      .from("lugares_tags")
      .select("tag_id")
      .eq("lugar_id", lugar.id);
    const have = new Set((existing || []).map((r) => r.tag_id));
    const toInsert = uniqueTagIds
      .filter((id) => !have.has(id))
      .map((tag_id) => ({ lugar_id: lugar.id, tag_id }));
    if (toInsert.length > 0) {
      const { error: linkErr } = await supabase.from("lugares_tags").insert(toInsert);
      if (linkErr) {
        console.error(`Falha tags ${slug}: ${linkErr.message}`);
        process.exit(1);
      }
      summary.tagLinks += toInsert.length;
    }
  }

  console.log(`ok ${lugar.nome} (${slug})`);
  summary.updated += 1;
}

console.log(JSON.stringify(summary, null, 2));
if (summary.warnings.length) {
  console.log("warnings:");
  for (const w of summary.warnings) console.log("-", w);
}
