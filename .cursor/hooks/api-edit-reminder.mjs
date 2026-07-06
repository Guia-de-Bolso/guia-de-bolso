#!/usr/bin/env node
/**
 * Cursor hook: postToolUse — lembrete de segurança após editar rotas API.
 * stdout: { additional_context: string } ou vazio
 */
import { readFileSync } from "node:fs";

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  process.exit(0);
}

let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  process.exit(0);
}

function collectPaths(value, out = []) {
  if (!value) return out;
  if (typeof value === "string") {
    if (value.includes("app/api/") || value.includes("app\\api\\")) {
      out.push(value);
    }
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectPaths(item, out);
    return out;
  }
  if (typeof value === "object") {
    for (const v of Object.values(value)) collectPaths(v, out);
  }
  return out;
}

const paths = collectPaths(payload);
const apiPaths = paths.filter((p) => /app[/\\]api[/\\]/.test(p));

if (apiPaths.length === 0) {
  process.exit(0);
}

const context = [
  "Lembrete (hook API): rota em app/api/ alterada.",
  "Verifique: auth (`getAuthUser`), admin role, rate limit, service role só server-side.",
  "Atualize a matriz em SECURITY_CHECKLIST.md e rode: node scripts/check-api-security-docs.mjs",
].join(" ");

process.stdout.write(JSON.stringify({ additional_context: context }));
process.exit(0);
