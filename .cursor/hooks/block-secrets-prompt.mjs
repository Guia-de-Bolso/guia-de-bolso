#!/usr/bin/env node
/**
 * Cursor hook: beforeSubmitPrompt — alerta se o prompt parece conter segredos.
 */
const ALLOW = JSON.stringify({ permission: "allow" });

function deny(userMessage, agentMessage) {
  process.stdout.write(
    JSON.stringify({
      permission: "deny",
      user_message: userMessage,
      agent_message: agentMessage,
    })
  );
  process.exit(2);
}

let raw = "";
const chunks = [];
for await (const chunk of process.stdin) {
  chunks.push(chunk);
}
raw = Buffer.concat(chunks).toString("utf8");

let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  process.stdout.write(ALLOW);
  process.exit(0);
}

const text = String(
  payload.prompt ?? payload.text ?? payload.message ?? payload.content ?? ""
);

const secretPatterns = [
  { re: /sk-ant-[a-zA-Z0-9_-]{10,}/, label: "Anthropic API key" },
  { re: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/, label: "JWT/token" },
  { re: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*\S+/, label: "Supabase service role" },
  { re: /service_role['"]?\s*[:=]\s*['"]?[a-zA-Z0-9_-]{20,}/i, label: "service_role key" },
  { re: /-----BEGIN (RSA |EC )?PRIVATE KEY-----/, label: "private key PEM" },
];

for (const { re, label } of secretPatterns) {
  if (re.test(text)) {
    deny(
      `O prompt parece conter um segredo (${label}). Remova a chave e use referência ao .env.local sem colar o valor.`,
      "Hook bloqueou envio de prompt com possível credencial. Nunca colar chaves no chat."
    );
  }
}

process.stdout.write(ALLOW);
process.exit(0);
