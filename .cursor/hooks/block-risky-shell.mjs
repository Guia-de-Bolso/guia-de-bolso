#!/usr/bin/env node
/**
 * Cursor hook: beforeShellExecution — bloqueia comandos git/env destrutivos ou perigosos.
 * stdin: JSON com { command: string }
 * stdout: { permission: "allow"|"deny"|"ask", user_message?, agent_message? }
 */
import { readFileSync } from "node:fs";

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

function ask(userMessage, agentMessage) {
  process.stdout.write(
    JSON.stringify({
      permission: "ask",
      user_message: userMessage,
      agent_message: agentMessage,
    })
  );
  process.exit(0);
}

let raw = "";
try {
  raw = readFileSync(0, "utf8");
} catch {
  process.stdout.write(ALLOW);
  process.exit(0);
}

let payload = {};
try {
  payload = raw ? JSON.parse(raw) : {};
} catch {
  process.stdout.write(ALLOW);
  process.exit(0);
}

const command = String(payload.command ?? payload.cmd ?? "").trim();
if (!command) {
  process.stdout.write(ALLOW);
  process.exit(0);
}

const lower = command.toLowerCase();

// Secrets / env files
const envFilePattern = /\.env(\.|$)|credentials\.json|service[-_]?role|\.pem\b|id_rsa/i;
if (
  /\bgit\s+add\b/i.test(command) &&
  (envFilePattern.test(command) || /\b\.env\b/i.test(command))
) {
  deny(
    "Bloqueado: não adicionar arquivos de ambiente ou credenciais ao git.",
    "O hook bloqueou git add de .env/credenciais. Esses arquivos devem permanecer fora do repositório."
  );
}

if (/\bgit\s+commit\b/i.test(command) && envFilePattern.test(command)) {
  deny(
    "Bloqueado: commit menciona arquivos de ambiente/credenciais.",
    "Verifique o staging; nunca commitar .env.local ou chaves."
  );
}

// Destructive git
if (/\bgit\s+push\b[^;\n]*--force\b/i.test(command) || /\bgit\s+push\s+-f\b/i.test(command)) {
  deny(
    "Bloqueado: git push --force. Peça confirmação explícita ao usuário antes de tentar de novo.",
    "Force push negado pelo hook de segurança do projeto."
  );
}

if (/\bgit\s+reset\s+--hard\b/i.test(command)) {
  deny(
    "Bloqueado: git reset --hard descarta trabalho local.",
    "Use git stash ou revert se precisar desfazer mudanças com segurança."
  );
}

if (/\bgit\s+clean\s+-[a-z]*f/i.test(command)) {
  ask(
    "git clean remove arquivos não rastreados. Confirme se é intencional.",
    "Hook pediu confirmação para git clean."
  );
}

// Cat de secrets
if (
  /\b(cat|type|less|more|head|tail)\b/i.test(command) &&
  envFilePattern.test(command)
) {
  ask(
    "Leitura de arquivo sensível (.env/credenciais). Confirme se é necessário.",
    "Evite colar conteúdo de .env no chat; use variáveis já configuradas."
  );
}

process.stdout.write(ALLOW);
process.exit(0);
