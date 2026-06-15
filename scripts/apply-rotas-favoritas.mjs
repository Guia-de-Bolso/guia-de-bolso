/**
 * Aplica supabase/rotas_favoritas.sql no projeto remoto.
 *
 * Requer SUPABASE_DB_PASSWORD no ambiente (.env.local ou export).
 * Senha: Supabase Dashboard → Project Settings → Database → Database password
 *
 * Uso: npm run db:rotas-favoritas
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

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

function getProjectRef(supabaseUrl) {
  try {
    return new URL(supabaseUrl).hostname.split(".")[0];
  } catch {
    return null;
  }
}

function buildConnectionString(projectRef, password) {
  const encoded = encodeURIComponent(password);
  return `postgresql://postgres.${projectRef}:${encoded}@aws-0-us-west-2.pooler.supabase.com:6543/postgres`;
}

async function main() {
  loadEnvLocal();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const password = process.env.SUPABASE_DB_PASSWORD;
  const projectRef = getProjectRef(supabaseUrl) ?? "rsdjbqzjdyeaedyqwrvc";

  if (!password) {
    console.error(
      [
        "SUPABASE_DB_PASSWORD não encontrada.",
        "",
        "1. Abra: https://supabase.com/dashboard/project/" +
          projectRef +
          "/settings/database",
        "2. Copie a Database password (ou redefina se necessário)",
        "3. Adicione em .env.local: SUPABASE_DB_PASSWORD=...",
        "4. Rode novamente: npm run db:rotas-favoritas",
        "",
        "Alternativa: cole o conteúdo de supabase/rotas_favoritas.sql no SQL Editor:",
        "https://supabase.com/dashboard/project/" + projectRef + "/sql/new",
      ].join("\n")
    );
    process.exit(1);
  }

  const sqlPath = path.join(ROOT, "supabase", "rotas_favoritas.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const connectionString = buildConnectionString(projectRef, password);
  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    await client.query(sql);
    const verify = await client.query(
      "SELECT to_regclass('public.rotas_favoritas') AS table_name"
    );
    const exists = verify.rows[0]?.table_name === "rotas_favoritas";
    if (!exists) {
      throw new Error("Tabela rotas_favoritas não foi criada.");
    }
    console.log("OK: tabela rotas_favoritas criada com policies RLS.");
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("Falha ao aplicar migration:", error.message);
  process.exit(1);
});
