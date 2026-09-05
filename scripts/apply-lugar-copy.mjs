#!/usr/bin/env node
/**
 * Grava descricao / descricao_longa / historia_cultura em lugares (service role).
 *
 * Uso:
 *   node --env-file=.env.local scripts/apply-lugar-copy.mjs scripts/data/lugar-copy-lote-1.js
 */
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import path from "node:path";

const fileArg = process.argv[2];
if (!fileArg) {
  console.error("Uso: node --env-file=.env.local scripts/apply-lugar-copy.mjs <arquivo.js>");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const mod = await import(pathToFileURL(path.resolve(fileArg)).href);
const lote =
  mod.LUGAR_COPY_LOTE_1 ||
  mod.LUGAR_COPY_LOTE_2 ||
  mod.LUGAR_COPY_LOTE_3 ||
  mod.LUGAR_COPY_LOTE_4 ||
  mod.LUGAR_COPY_LOTE_5 ||
  mod.default;
if (!Array.isArray(lote) || lote.length === 0) {
  console.error("Arquivo sem array de copy (LUGAR_COPY_LOTE_1 a 5).");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

let ok = 0;
for (const item of lote) {
  const slug = String(item.slug || "").trim();
  if (!slug) {
    console.error("Item sem slug.");
    process.exit(1);
  }

  const { data, error } = await supabase
    .from("lugares")
    .update({
      descricao: item.descricao,
      descricao_longa: item.descricao_longa,
      historia_cultura: item.historia_cultura || null,
    })
    .eq("slug", slug)
    .select("slug, nome");

  let rows = data;
  if (error) {
    console.error(`Falha em ${slug}: ${error.message}`);
    process.exit(1);
  }

  if (!rows?.length && item.nome) {
    const byNome = await supabase
      .from("lugares")
      .update({
        descricao: item.descricao,
        descricao_longa: item.descricao_longa,
        historia_cultura: item.historia_cultura || null,
      })
      .eq("nome", item.nome)
      .select("slug, nome");
    if (byNome.error) {
      console.error(`Falha por nome (${item.nome}): ${byNome.error.message}`);
      process.exit(1);
    }
    rows = byNome.data;
  }

  if (!rows?.length) {
    console.error(`Não encontrado: ${slug}${item.nome ? ` / ${item.nome}` : ""}`);
    process.exit(1);
  }
  console.log(`ok ${rows[0].slug || slug} (${rows[0].nome})`);
  ok += 1;
}

console.log(`Atualizados: ${ok}`);
