/**
 * Aplica supabase/lugares_plano_lancamento_bulk.sql no projeto remoto.
 *
 * Requer SUPABASE_DB_PASSWORD no ambiente (.env.local ou export).
 *
 * Uso: npm run db:plano-lancamento
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
        "2. Copie a Database password",
        "3. Adicione em .env.local: SUPABASE_DB_PASSWORD=...",
        "4. Rode novamente: npm run db:plano-lancamento",
        "",
        "Alternativa: cole supabase/lugares_plano_lancamento_bulk.sql no SQL Editor.",
      ].join("\n")
    );
    process.exit(1);
  }

  const sqlPath = path.join(ROOT, "supabase", "lugares_plano_lancamento_bulk.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const client = new pg.Client({
    connectionString: buildConnectionString(projectRef, password),
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    await client.query(sql);

    const { rows } = await client.query(`
      SELECT
        CASE
          WHEN eh_parceiro THEN 'parceiro'
          WHEN perfil_promo_ate IS NOT NULL THEN 'lancamento'
          ELSE 'presenca'
        END AS plano,
        count(*)::int AS total
      FROM lugares
      WHERE status = 'ativo'
        AND categoria NOT IN ('Natureza', 'Aventura')
      GROUP BY 1
      ORDER BY 1
    `);

    console.log("OK: planos comerciais atualizados.");
    for (const row of rows) {
      console.log(`  ${row.plano}: ${row.total} locais ativos`);
    }
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("Falha ao aplicar classificação de planos:", error.message);
  process.exit(1);
});
