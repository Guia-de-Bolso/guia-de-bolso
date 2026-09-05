# Getting started — fork and local run

This guide is for someone who **cloned or forked** the repo and wants a working instance. Team members with access to the production Supabase project can skip the schema section and only fill `.env.local`.

Portuguese companion: [onboarding.md](../onboarding.md).

---

## What this repository is

Guia de Bolso is a **production** city guide (Imbituba, Brazil): Next.js 16 on Vercel, Supabase (Postgres + Auth + Storage), Anthropic Claude for search and itineraries, Capacitor apps on iOS and Android.

The GitHub tree includes application code, SQL migrations, and this handbook. It does **not** include:

- Production `.env` values
- The live catalog dump (places, photos, partner contracts, users)
- A single `schema_baseline.sql` that recreates production from empty Postgres

That is deliberate. A fork should stand up **your** project and **your** data.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | **20+** and **&lt; 26** (`package.json` `engines`) |
| npm | Comes with Node |
| Git | Any recent |
| Supabase project | Free tier is enough to start |
| Anthropic API key | Required for AI search / itineraries |

Optional later: Google OAuth, Twilio (SMS), Google Maps key, Upstash Redis, Firebase (push), Play / App Store IAP credentials.

---

## 1. Clone and install

```bash
git clone https://github.com/BrunoDislilerDev/guia-de-bolso.git
cd guia-de-bolso
npm install
cp .env.example .env.local
```

Minimum `.env.local` to boot the UI:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-or-publishable-key
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Never put `service_role` in a `NEXT_PUBLIC_*` variable. Full list: [environment.md](./environment.md).

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a populated `lugares` table the home will render empty states — that is expected.

---

## 2. Supabase project

1. Create a project (any region; production uses `us-west-2`).
2. Copy **Project URL** and **anon / publishable** key into `.env.local`.
3. Authentication → URL configuration:
   - Site URL: `http://localhost:3000`
   - Redirect: `http://localhost:3000/auth/callback`
4. Enable **Google** and/or **Phone** providers if you want login locally (Twilio for SMS).

### Schema

Core tables (`lugares`, `perfis`, `favoritos`, …) were originally created in the Dashboard. The repo versions **incremental** SQL under [`supabase/`](../../supabase/).

For a new environment:

1. Recreate base tables from the column reference in [database.md](../database.md) and modeling notes in [DATABASE_ARCHITECTURE.md](../DATABASE_ARCHITECTURE.md).
2. Apply files in [migrations.md — Manifest](../migrations.md#manifest) in order. Prefer idempotent scripts. After route child tables, always re-run `rotas_policies.sql`.
3. Security bundle: `security_p0_complete.sql` plus [security-rls.md](../security-rls.md).
4. Create Storage buckets used by the app (`lugares-fotos`, avatars, etc.) and apply `storage*.sql`.

There is no automated `supabase db reset` against production. Do not point a fork at the production project.

### First admin user

Sign in once so `perfis` exists, then in the SQL Editor (dev only):

```sql
UPDATE perfis SET role = 'dev' WHERE id = '<auth.users.id>';
```

`dev` unlocks the full admin. `admin` is the operational CMS only. See [authentication.md](./authentication.md).

---

## 3. Verify

| Check | Expected |
|-------|----------|
| `GET http://localhost:3000/api/health` | `{ "ok": true, "service": "guia-de-bolso", ... }` |
| `npm test` | Unit tests on `lib/*.test.js` pass |
| `npm run lint` | ESLint clean enough for CI |
| Home | Loads; catalog depends on your `lugares` rows with `status = 'ativo'` |
| `/login` | OAuth callback or SMS, if providers are configured |

```bash
npm run lint
npm test
npm run check:api-security
npm run build
```

E2E: `npx playwright install chromium && npm run test:e2e`.

---

## 4. Native apps (optional)

Capacitor lives in `android/` and `ios/` (bundle `app.guiadebolso`). Store listings use `/baixar`. Native Google / Apple sign-in and push need extra env vars — [authentication.md](./authentication.md), [push-notifications.md](../push-notifications.md), [deployment.md](../deployment.md).

You can develop the product fully on web.

---

## 5. What “done” looks like for a professional fork

- Isolated Supabase (not production)
- RLS enabled; anon key cannot write privileged columns
- At least one active place so the consumer UI is exercisable
- AI routes return `LOGIN_REQUIRED` when logged out and increment usage when logged in
- Admin layout rejects non-admin roles

If something fails, check env scopes (`NEXT_PUBLIC_*` is baked at **build** time) and Auth redirect URLs.

---

## Related

- [Onboarding (team)](./onboarding.md)
- [Deploy](../deployment.md)
- [LICENSE](../../LICENSE) — brand and production data are not yours to republish
