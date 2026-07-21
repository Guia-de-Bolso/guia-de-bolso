#!/usr/bin/env node
/**
 * Debug local de envio de push: busca tokens ativos no Supabase e envia
 * uma notificação de teste usando uma service account local.
 *
 * Uso:
 *   node --env-file=.env.local scripts/debug-push-local.mjs <service-account.json>
 *
 * Não imprime tokens nem chaves — apenas metadados e o resultado do envio.
 */

import { readFileSync } from "node:fs";
import { initializeApp, cert } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

const serviceAccountPath = process.argv[2];
if (!serviceAccountPath) {
  console.error("Uso: node --env-file=.env.local scripts/debug-push-local.mjs <service-account.json>");
  process.exit(1);
}

const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, "utf8"));
console.log("service account project_id:", serviceAccount.project_id);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY no ambiente.");
  process.exit(1);
}

const response = await fetch(
  `${supabaseUrl}/rest/v1/push_tokens?select=token,platform,enabled,updated_at&enabled=eq.true`,
  {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  }
);
const rows = await response.json();
if (!Array.isArray(rows) || rows.length === 0) {
  console.error("Nenhum token ativo encontrado em push_tokens.", rows);
  process.exit(1);
}

for (const row of rows) {
  console.log(
    `token ativo: plataforma=${row.platform} tamanho=${row.token.length} atualizado=${row.updated_at ?? "?"}`
  );
}

const app = initializeApp({
  credential: cert(serviceAccount),
});

const result = await getMessaging(app).sendEachForMulticast({
  tokens: rows.map((row) => row.token),
  notification: {
    title: "Teste local Guia de Bolso",
    body: "Envio direto do computador — push está ok",
  },
  android: { priority: "high" },
  apns: { payload: { aps: { sound: "default" } } },
});

console.log("\nsuccessCount:", result.successCount, "| failureCount:", result.failureCount);
result.responses.forEach((r, i) => {
  if (r.success) {
    console.log(`#${i}: OK (messageId ${r.messageId})`);
  } else {
    console.log(`#${i}: ERRO ${r.error?.code} — ${r.error?.message}`);
  }
});
