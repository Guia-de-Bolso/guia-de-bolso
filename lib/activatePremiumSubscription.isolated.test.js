import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import pg from "pg";

const databaseUrl = process.env.PREMIUM_ACTIVATION_TEST_URL;
const migrationPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../supabase/migrations/20261103180000_activate_premium_subscription_atomic.sql"
);

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const LATER = "2027-06-01T00:00:00.000Z";
const MIDDLE = "2027-03-01T00:00:00.000Z";
const EARLIER = "2026-12-01T00:00:00.000Z";

const FIXTURE = `
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY
);

CREATE OR REPLACE FUNCTION auth.role()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), 'anon');
$$;

CREATE OR REPLACE FUNCTION auth.uid()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

CREATE TABLE IF NOT EXISTS public.perfis (
  id uuid PRIMARY KEY,
  nome text,
  role text,
  premium_ativo boolean DEFAULT false,
  premium_ate timestamptz,
  uso_ia_mes text,
  buscas_ia integer DEFAULT 0,
  roteiros_ia integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.play_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  purchase_token text NOT NULL UNIQUE,
  product_id text NOT NULL,
  order_id text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_dev()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT false;
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN;
  END IF;
END
$$;
`;

test(
  "activate_premium_subscription em banco isolado",
  { skip: databaseUrl ? false : "defina PREMIUM_ACTIVATION_TEST_URL para o Postgres descartável" },
  async (t) => {
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 4 });
    const admin = await pool.connect();

    try {
      await admin.query(FIXTURE);
      const migrationSql = readFileSync(migrationPath, "utf8");
      const executableSql = migrationSql
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n");
      assert.equal(executableSql.includes("DISABLE TRIGGER"), false);
      assert.equal(executableSql.includes("app.perfis_premium_write"), false);
      await admin.query(migrationSql);
      await admin.query(`
        DROP TRIGGER IF EXISTS perfis_guard_privileged_columns ON public.perfis;
        CREATE TRIGGER perfis_guard_privileged_columns
          BEFORE INSERT OR UPDATE ON public.perfis
          FOR EACH ROW
          EXECUTE FUNCTION public.perfis_guard_privileged_columns();
      `);
      await installRolePrivileges(admin);
      await assertMigrationContract(admin);
      await admin.query(`SELECT set_config('request.jwt.claim.role', 'service_role', false)`);
      await installProfileFailureTrigger(admin);

      await t.test("duas contas não vinculam o mesmo token ao mesmo tempo", async () => {
        await reset(admin);
        await seedUser(admin, USER_A);
        await seedUser(admin, USER_B);
        const token = "token-concorrente";
        const clientA = await pool.connect();
        const clientB = await pool.connect();

        try {
          await clientA.query(`SELECT set_config('request.jwt.claim.role', 'service_role', false)`);
          await clientB.query(`SELECT set_config('request.jwt.claim.role', 'service_role', false)`);
          const [first, second] = await Promise.all([
            activate(clientA, { userId: USER_A, token, expiresAt: LATER }),
            activate(clientB, { userId: USER_B, token, expiresAt: LATER }),
          ]);
          const results = [first, second];
          assert.equal(results.filter((item) => item.ok === true).length, 1);
          assert.equal(results.filter((item) => item.code === "PURCHASE_INVALID").length, 1);

          const row = await one(admin, `SELECT user_id::text FROM public.play_subscriptions WHERE purchase_token = $1`, [token]);
          const winner = results.find((item) => item.ok === true);
          const winnerId = first.ok ? USER_A : USER_B;
          assert.equal(winner.ok, true);
          assert.equal(row.user_id, winnerId);

          const loserId = winnerId === USER_A ? USER_B : USER_A;
          const loser = await one(admin, `SELECT premium_ativo FROM public.perfis WHERE id = $1`, [loserId]);
          assert.equal(loser.premium_ativo, false);
          const count = await one(admin, `SELECT count(*)::int AS total FROM public.play_subscriptions WHERE purchase_token = $1`, [token]);
          assert.equal(count.total, 1);
        } finally {
          clientA.release();
          clientB.release();
        }
      });

      await t.test("restauração com data menor não reduz a assinatura nem o perfil", async () => {
        await reset(admin);
        await seedUser(admin, USER_A, { premiumAtivo: true, premiumAte: LATER });
        await admin.query(
          `INSERT INTO public.play_subscriptions (user_id, purchase_token, product_id, expires_at)
           VALUES ($1, 'token-restore', 'guia_premium_mensal', $2)`,
          [USER_A, LATER]
        );

        const result = await activate(admin, {
          userId: USER_A,
          token: "token-restore",
          expiresAt: EARLIER,
          orderId: "restore-1",
        });

        assert.equal(result.ok, true);
        assert.equal(new Date(result.premium_ate).toISOString(), LATER);
        const sub = await one(admin, `SELECT expires_at FROM public.play_subscriptions WHERE purchase_token = 'token-restore'`);
        const profile = await one(admin, `SELECT premium_ativo, premium_ate FROM public.perfis WHERE id = $1`, [USER_A]);
        assert.equal(new Date(sub.expires_at).toISOString(), LATER);
        assert.equal(profile.premium_ativo, true);
        assert.equal(new Date(profile.premium_ate).toISOString(), LATER);
      });

      await t.test("renovação avança a data e outra assinatura mais longa continua valendo", async () => {
        await reset(admin);
        await seedUser(admin, USER_A, { premiumAtivo: true, premiumAte: MIDDLE });
        await admin.query(
          `INSERT INTO public.play_subscriptions (user_id, purchase_token, product_id, expires_at)
           VALUES ($1, 'token-curta', 'guia_premium_mensal', $2),
                  ($1, 'token-longa', 'play_mensal', $3)`,
          [USER_A, EARLIER, MIDDLE]
        );

        const result = await activate(admin, {
          userId: USER_A,
          token: "token-curta",
          expiresAt: LATER,
          orderId: "renew-1",
        });

        assert.equal(result.ok, true);
        assert.equal(new Date(result.premium_ate).toISOString(), LATER);
        const shortSub = await one(admin, `SELECT expires_at, order_id FROM public.play_subscriptions WHERE purchase_token = 'token-curta'`);
        const longSub = await one(admin, `SELECT expires_at, user_id::text FROM public.play_subscriptions WHERE purchase_token = 'token-longa'`);
        assert.equal(new Date(shortSub.expires_at).toISOString(), LATER);
        assert.equal(shortSub.order_id, "renew-1");
        assert.equal(new Date(longSub.expires_at).toISOString(), MIDDLE);
        assert.equal(longSub.user_id, USER_A);
      });

      await t.test("outra conta não transfere uma assinatura já gravada", async () => {
        await reset(admin);
        await seedUser(admin, USER_A, { premiumAtivo: true, premiumAte: LATER });
        await seedUser(admin, USER_B);
        await admin.query(
          `INSERT INTO public.play_subscriptions (user_id, purchase_token, product_id, expires_at)
           VALUES ($1, 'token-dono', 'guia_premium_mensal', $2)`,
          [USER_A, LATER]
        );

        const result = await activate(admin, {
          userId: USER_B,
          token: "token-dono",
          expiresAt: LATER,
        });

        assert.equal(result.ok, false);
        assert.equal(result.code, "PURCHASE_INVALID");
        const sub = await one(admin, `SELECT user_id::text FROM public.play_subscriptions WHERE purchase_token = 'token-dono'`);
        const loser = await one(admin, `SELECT premium_ativo FROM public.perfis WHERE id = $1`, [USER_B]);
        const owner = await one(admin, `SELECT premium_ate FROM public.perfis WHERE id = $1`, [USER_A]);
        assert.equal(sub.user_id, USER_A);
        assert.equal(loser.premium_ativo, false);
        assert.equal(new Date(owner.premium_ate).toISOString(), LATER);
      });

      await t.test("premium sem data de fim continua ilimitado", async () => {
        await reset(admin);
        await seedUser(admin, USER_A, { premiumAtivo: true, premiumAte: null });

        const result = await activate(admin, {
          userId: USER_A,
          token: "token-ilimitado",
          expiresAt: EARLIER,
        });

        assert.equal(result.ok, true);
        assert.equal(result.premium_ate, null);
        const profile = await one(admin, `SELECT premium_ativo, premium_ate FROM public.perfis WHERE id = $1`, [USER_A]);
        assert.equal(profile.premium_ativo, true);
        assert.equal(profile.premium_ate, null);
      });

      await t.test("assinatura sem expiração não é substituída por data finita", async () => {
        await reset(admin);
        await seedUser(admin, USER_A, { premiumAtivo: true, premiumAte: MIDDLE });
        await admin.query(
          `INSERT INTO public.play_subscriptions (user_id, purchase_token, product_id, expires_at)
           VALUES ($1, 'token-aberta', 'guia_premium_mensal', NULL)`,
          [USER_A]
        );

        const result = await activate(admin, {
          userId: USER_A,
          token: "token-aberta",
          expiresAt: LATER,
        });

        assert.equal(result.ok, true);
        assert.equal(result.premium_ate, null);
        const sub = await one(admin, `SELECT expires_at FROM public.play_subscriptions WHERE purchase_token = 'token-aberta'`);
        const profile = await one(admin, `SELECT premium_ativo, premium_ate FROM public.perfis WHERE id = $1`, [USER_A]);
        assert.equal(sub.expires_at, null);
        assert.equal(profile.premium_ativo, true);
        assert.equal(profile.premium_ate, null);
      });

      await t.test("usuário inexistente não grava assinatura", async () => {
        await reset(admin);
        const missing = "33333333-3333-4333-8333-333333333333";
        const result = await activate(admin, {
          userId: missing,
          token: "token-ausente",
          expiresAt: LATER,
        });
        assert.equal(result.ok, false);
        assert.equal(result.code, "VALIDATION");
        const count = await one(admin, `SELECT count(*)::int AS total FROM public.play_subscriptions`);
        assert.equal(count.total, 0);
      });

      await t.test("falha ao gravar o perfil desfaz a assinatura", async () => {
        await reset(admin);
        await seedUser(admin, USER_A);
        await admin.query(`SELECT set_config('test.fail_profile', '1', false)`);

        await assert.rejects(
          () => activate(admin, { userId: USER_A, token: "token-falha", expiresAt: LATER }),
          /falha simulada no perfil/
        );

        await admin.query(`SELECT set_config('test.fail_profile', '0', false)`);
        const count = await one(admin, `SELECT count(*)::int AS total FROM public.play_subscriptions`);
        const profile = await one(admin, `SELECT premium_ativo FROM public.perfis WHERE id = $1`, [USER_A]);
        assert.equal(count.total, 0);
        assert.equal(profile.premium_ativo, false);
      });

      await t.test("cria o perfil quando a conta existe e o perfil ainda não", async () => {
        await reset(admin);
        await admin.query(`INSERT INTO auth.users (id) VALUES ($1)`, [USER_A]);

        const result = await activate(admin, {
          userId: USER_A,
          token: "token-perfil-novo",
          expiresAt: LATER,
        });

        assert.equal(result.ok, true);
        const profile = await one(
          admin,
          `SELECT nome, role, premium_ativo, premium_ate FROM public.perfis WHERE id = $1`,
          [USER_A]
        );
        assert.equal(profile.nome, "Usuário");
        assert.equal(profile.premium_ativo, true);
        assert.equal(new Date(profile.premium_ate).toISOString(), LATER);
        assert.ok(profile.role == null || profile.role === "usuario");
      });

      await t.test("papel authenticated não altera premium nem role sem a RPC", async () => {
        await reset(admin);
        await seedUser(admin, USER_A, { role: "usuario" });
        await admin.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', false)`);

        await admin.query(
          `UPDATE public.perfis
           SET role = 'dev', premium_ativo = true, premium_ate = $2
           WHERE id = $1`,
          [USER_A, LATER]
        );

        const profile = await one(
          admin,
          `SELECT role, premium_ativo, premium_ate FROM public.perfis WHERE id = $1`,
          [USER_A]
        );
        assert.equal(profile.role, "usuario");
        assert.equal(profile.premium_ativo, false);
        assert.equal(profile.premium_ate, null);
        await admin.query(`SELECT set_config('request.jwt.claim.role', 'service_role', false)`);
      });

      await t.test("a RPC com service_role ativa o premium sem desligar o trigger", async () => {
        await reset(admin);
        await seedUser(admin, USER_A, { role: "usuario" });
        await admin.query(`SELECT set_config('request.jwt.claim.role', 'service_role', false)`);

        const result = await activate(admin, {
          userId: USER_A,
          token: "token-papel",
          expiresAt: LATER,
        });

        assert.equal(result.ok, true);
        const profile = await one(
          admin,
          `SELECT role, premium_ativo, premium_ate, buscas_ia FROM public.perfis WHERE id = $1`,
          [USER_A]
        );
        assert.equal(profile.role, "usuario");
        assert.equal(profile.premium_ativo, true);
        assert.equal(new Date(profile.premium_ate).toISOString(), LATER);
        assert.equal(profile.buscas_ia, 0);
        const flag = await one(admin, `SELECT current_setting('app.perfis_premium_write', true) AS flag`);
        assert.equal(flag.flag ?? "", "");
        const trigger = await one(
          admin,
          `SELECT tgenabled FROM pg_trigger WHERE tgname = 'perfis_guard_privileged_columns'`
        );
        assert.equal(trigger.tgenabled, "O");
        await admin.query(`SELECT set_config('request.jwt.claim.role', 'service_role', false)`);
      });

      await t.test("o papel authenticated não consegue chamar a RPC", async () => {
        await reset(admin);
        await seedUser(admin, USER_A);
        await admin.query(`GRANT USAGE ON SCHEMA public, auth TO authenticated`);

        try {
          await admin.query(`SET ROLE authenticated`);
          await assert.rejects(
            () => activate(admin, { userId: USER_A, token: "token-direto", expiresAt: LATER }),
            /permission denied|permissão negada/i
          );
        } finally {
          await admin.query(`RESET ROLE`);
        }

        const count = await one(admin, `SELECT count(*)::int AS total FROM public.play_subscriptions`);
        assert.equal(count.total, 0);
      });

      await t.test("anon também não executa a RPC nem cria função no schema public", async () => {
        await reset(admin);
        try {
          await admin.query(`SET ROLE anon`);
          await assert.rejects(
            () => activate(admin, { userId: USER_A, token: "token-anon", expiresAt: LATER }),
            /permission denied|permissão negada/i
          );
          await assert.rejects(
            () => admin.query(`CREATE FUNCTION public.captura_premium() RETURNS void LANGUAGE sql AS 'SELECT 1'`),
            /permission denied|permissão negada/i
          );
        } finally {
          await admin.query(`RESET ROLE`);
        }
      });

      await t.test("anon e authenticated não mudam premium mesmo definindo a flag", async () => {
        await reset(admin);
        await seedUser(admin, USER_A, { role: "usuario" });
        await admin.query(`
          DROP POLICY IF EXISTS perfis_update_anon_probe ON public.perfis;
          DROP POLICY IF EXISTS perfis_select_anon_probe ON public.perfis;
          CREATE POLICY perfis_select_anon_probe ON public.perfis
            FOR SELECT TO anon
            USING (true);
          CREATE POLICY perfis_update_anon_probe ON public.perfis
            FOR UPDATE TO anon
            USING (true)
            WITH CHECK (true);
        `);

        try {
          for (const role of ["authenticated", "anon"]) {
            await rewritePremiumAs(admin, role, USER_A);
            const profile = await one(
              admin,
              `SELECT nome, role, premium_ativo, premium_ate, buscas_ia FROM public.perfis WHERE id = $1`,
              [USER_A]
            );
            assert.equal(profile.nome, "Tentativa");
            assert.equal(profile.role, "usuario");
            assert.equal(profile.premium_ativo, false);
            assert.equal(profile.premium_ate, null);
            assert.equal(profile.buscas_ia, 0);
            await admin.query(
              `UPDATE public.perfis SET nome = 'Usuário' WHERE id = $1`,
              [USER_A]
            );
          }

          await admin.query("BEGIN");
          try {
            await admin.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [USER_A]);
            await admin.query(`SELECT set_config('request.jwt.claim.role', 'authenticated', true)`);
            await admin.query(`SET LOCAL ROLE authenticated`);
            await admin.query(`SELECT set_config('app.perfis_ia_usage_write', '1', true)`);
            const updated = await admin.query(
              `UPDATE public.perfis
               SET role = 'dev', premium_ativo = true, premium_ate = $2, buscas_ia = 4
               WHERE id = $1`,
              [USER_A, LATER]
            );
            assert.equal(updated.rowCount, 1);
            await admin.query("COMMIT");
          } catch (error) {
            await admin.query("ROLLBACK");
            throw error;
          }

          const withIaFlag = await one(
            admin,
            `SELECT role, premium_ativo, buscas_ia FROM public.perfis WHERE id = $1`,
            [USER_A]
          );
          assert.equal(withIaFlag.role, "usuario");
          assert.equal(withIaFlag.premium_ativo, false);
          assert.equal(withIaFlag.buscas_ia, 4);
        } finally {
          await admin.query(`DROP POLICY IF EXISTS perfis_update_anon_probe ON public.perfis`);
          await admin.query(`DROP POLICY IF EXISTS perfis_select_anon_probe ON public.perfis`);
          await admin.query(`RESET ROLE`);
          await admin.query(`SELECT set_config('request.jwt.claim.role', 'service_role', false)`);
        }
      });

      await t.test("não existe helper de premium e os papéis comuns não o executam", async () => {
        const missing = await one(
          admin,
          `SELECT count(*)::int AS total FROM pg_proc WHERE proname = 'perfis_premium_write_bypass'`
        );
        assert.equal(missing.total, 0);

        for (const role of ["authenticated", "anon"]) {
          await admin.query("BEGIN");
          try {
            await admin.query(`SET LOCAL ROLE ${role}`);
            await assert.rejects(
              () => admin.query(`SELECT public.perfis_premium_write_bypass()`),
              /does not exist|não existe/i
            );
            await admin.query("ROLLBACK");
          } catch (error) {
            await admin.query("ROLLBACK");
            throw error;
          }
        }
      });
    } finally {
      admin.release();
      await pool.end();
    }
  }
);

async function installRolePrivileges(client) {
  await client.query(`
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    GRANT SELECT, UPDATE ON public.perfis TO anon, authenticated;
    ALTER TABLE public.perfis ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS perfis_update_own_usage ON public.perfis;
    CREATE POLICY perfis_update_own_usage ON public.perfis
      FOR UPDATE TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
    DROP POLICY IF EXISTS perfis_select_own ON public.perfis;
    CREATE POLICY perfis_select_own ON public.perfis
      FOR SELECT TO authenticated
      USING (auth.uid() = id);
  `);
}

async function assertMigrationContract(client) {
  const activateFn = await one(
    client,
    `SELECT prosecdef, proconfig, prosrc
     FROM pg_proc
     WHERE proname = 'activate_premium_subscription'`
  );
  assert.equal(activateFn.prosecdef, true);
  assert.ok(activateFn.proconfig.some((item) => item === "search_path=public"));
  assert.equal(activateFn.prosrc.includes("DISABLE TRIGGER"), false);
  assert.equal(activateFn.prosrc.includes("app.perfis_premium_write"), false);
  assert.equal(activateFn.prosrc.includes("GREATEST"), true);

  const triggerFn = await one(
    client,
    `SELECT prosrc FROM pg_proc WHERE proname = 'perfis_guard_privileged_columns'`
  );
  assert.equal(triggerFn.prosrc.includes("app.perfis_premium_write"), false);

  const grants = await client.query(
    `SELECT grantee
     FROM information_schema.routine_privileges
     WHERE routine_name = 'activate_premium_subscription'
       AND privilege_type = 'EXECUTE'`
  );
  const grantees = grants.rows.map((row) => row.grantee);
  assert.equal(grantees.includes("service_role"), true);
  assert.equal(grantees.includes("anon"), false);
  assert.equal(grantees.includes("authenticated"), false);
  assert.equal(grantees.includes("PUBLIC"), false);
}

async function rewritePremiumAs(client, role, userId) {
  await client.query("BEGIN");
  try {
    await client.query(`SELECT set_config('request.jwt.claim.sub', $1, true)`, [userId]);
    await client.query(`SELECT set_config('request.jwt.claim.role', $1, true)`, [role]);
    await client.query(`SET LOCAL ROLE ${role}`);
    await client.query(`SELECT set_config('app.perfis_premium_write', '1', true)`);
    const seen = await client.query(`SELECT auth.uid()::text AS uid, auth.role() AS role`);
    const updated = await client.query(
      `UPDATE public.perfis
       SET nome = 'Tentativa', role = 'dev', premium_ativo = true, premium_ate = $2, buscas_ia = 99
       WHERE id = $1`,
      [userId, LATER]
    );
    assert.equal(updated.rowCount, 1, `${role} uid=${seen.rows[0]?.uid} claim=${seen.rows[0]?.role}`);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function installProfileFailureTrigger(client) {
  await client.query(`
    CREATE OR REPLACE FUNCTION public.test_fail_profile_write()
    RETURNS trigger
    LANGUAGE plpgsql
    AS $fn$
    BEGIN
      IF current_setting('test.fail_profile', true) = '1' THEN
        RAISE EXCEPTION 'falha simulada no perfil';
      END IF;
      RETURN NEW;
    END;
    $fn$;

    DROP TRIGGER IF EXISTS test_fail_profile_write ON public.perfis;
    CREATE TRIGGER test_fail_profile_write
    BEFORE INSERT OR UPDATE ON public.perfis
    FOR EACH ROW
    EXECUTE FUNCTION public.test_fail_profile_write();
  `);
}

async function reset(client) {
  await client.query(`SELECT set_config('request.jwt.claim.role', 'service_role', false)`);
  await client.query(`SELECT set_config('test.fail_profile', '0', false)`);
  await client.query(`TRUNCATE public.play_subscriptions, public.perfis, auth.users`);
}

async function seedUser(client, id, { role = "usuario", premiumAtivo = false, premiumAte = null } = {}) {
  await client.query(`INSERT INTO auth.users (id) VALUES ($1)`, [id]);
  await client.query(
    `INSERT INTO public.perfis (id, nome, role, premium_ativo, premium_ate)
     VALUES ($1, 'Usuário', $2, $3, $4)`,
    [id, role, premiumAtivo, premiumAte]
  );
}

async function activate(client, { userId, token, expiresAt, orderId = null }) {
  const { rows } = await client.query(
    `SELECT public.activate_premium_subscription($1, $2, $3, $4, $5) AS result`,
    [userId, expiresAt, token, "guia_premium_mensal", orderId]
  );
  return rows[0].result;
}

async function one(client, sql, params = []) {
  const { rows } = await client.query(sql, params);
  return rows[0];
}
