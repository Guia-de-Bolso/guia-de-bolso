#!/usr/bin/env node
/**
 * Falha se existir route.js em app/api sem menção da rota em SECURITY_CHECKLIST.md.
 * Uso: node scripts/check-api-security-docs.mjs
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const apiRoot = path.join(root, "app", "api");
const checklistPath = path.join(root, "SECURITY_CHECKLIST.md");

function walkRoutes(dir, base = "") {
  const routes = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    const rel = base ? `${base}/${entry}` : entry;
    if (statSync(full).isDirectory()) {
      routes.push(...walkRoutes(full, rel));
    } else if (entry === "route.js") {
      routes.push(`/api/${base}`);
    }
  }
  return routes;
}

function normalizeRoute(route) {
  return route.replace(/\[([^\]]+)\]/g, "[$1]");
}

const checklist = readFileSync(checklistPath, "utf8");
const routes = walkRoutes(apiRoot).map(normalizeRoute).sort();

const missing = [];
for (const route of routes) {
  const pathForTable = route.replace(/\[([^\]]+)\]/g, "[$1]");
  const segment = route.split("/").filter(Boolean).slice(1).join("/");
  const found =
    checklist.includes(pathForTable) ||
    checklist.includes(route) ||
    (segment && checklist.includes(segment));
  if (!found) {
    missing.push(route);
  }
}

if (missing.length > 0) {
  console.error("Rotas API sem entrada aparente em SECURITY_CHECKLIST.md:\n");
  for (const r of missing) {
    console.error(`  - ${r}`);
  }
  console.error("\nAdicione uma linha na matriz de rotas em SECURITY_CHECKLIST.md.");
  process.exit(1);
}

console.log(`OK: ${routes.length} rotas API referenciadas no checklist.`);
process.exit(0);
