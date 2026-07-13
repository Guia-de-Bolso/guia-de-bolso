#!/usr/bin/env node
/**
 * Converte o JSON da service account do Firebase para formatos aceitos na Vercel.
 *
 * Uso:
 *   node scripts/encode-firebase-service-account.mjs caminho/para/service-account.json
 *
 * Saída:
 * - FIREBASE_SERVICE_ACCOUNT_JSON_BASE64 (recomendado)
 * - FIREBASE_SERVICE_ACCOUNT_JSON (uma linha)
 * - FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const filePath = process.argv[2];

if (!filePath) {
  console.error("Uso: node scripts/encode-firebase-service-account.mjs <arquivo.json>");
  process.exit(1);
}

const absolutePath = resolve(filePath);
const raw = readFileSync(absolutePath, "utf8");
const parsed = JSON.parse(raw);

if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
  console.error("JSON inválido: precisa de project_id, client_email e private_key.");
  process.exit(1);
}

const minified = JSON.stringify(parsed);
const base64 = Buffer.from(minified, "utf8").toString("base64");
const escapedPrivateKey = String(parsed.private_key).replace(/\n/g, "\\n");

console.log("Cole na Vercel (recomendado):\n");
console.log("FIREBASE_SERVICE_ACCOUNT_JSON_BASE64=");
console.log(base64);
console.log("\nAlternativa (JSON em uma linha):\n");
console.log("FIREBASE_SERVICE_ACCOUNT_JSON=");
console.log(minified);
console.log("\nAlternativa (3 variáveis separadas):\n");
console.log(`FIREBASE_PROJECT_ID=${parsed.project_id}`);
console.log(`FIREBASE_CLIENT_EMAIL=${parsed.client_email}`);
console.log("FIREBASE_PRIVATE_KEY=");
console.log(escapedPrivateKey);
