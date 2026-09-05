# Environment variables

Canonical reference for local, Vercel, and CI. Template: [`.env.example`](../../.env.example).

**Never** commit `.env.local` or live keys.

Portuguese original: [../environment.md](../environment.md).

---

## Quick table

| Variable | Required | Scope | Where |
|----------|:--------:|-------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Build + runtime | Vercel, `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Build + runtime | Anon/publishable — **not** service_role |
| `ANTHROPIC_API_KEY` | Yes* | Server | Vercel, `.env.local` |
| `ANTHROPIC_MODEL` | Recommended | Server | Default `claude-sonnet-4-5` |
| `NEXT_PUBLIC_SITE_URL` | Optional | Build | Canonical URL (QR, absolute links) |
| `NEXT_PUBLIC_APP_STORE_URL` | Optional | Build | `/baixar` iOS redirect |
| `NEXT_PUBLIC_PLAY_STORE_URL` | Optional | Build | `/baixar` Android redirect |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | Build | Admin Places + static map |
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Native app | Build | Google Sign-In + Supabase |
| `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID` | iOS app | Build | iOS Google client |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server | Feedback, QR logs, cron — **never** `NEXT_PUBLIC_` |
| `CRON_SECRET` | If cron on | Server | `/api/cron/*` |
| `UPSTASH_REDIS_REST_URL` / `_TOKEN` | Optional | Server | Distributed IA rate limit; in-memory fallback |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | Build | Observability |
| `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` | Optional | Server | FCM (preferred on Vercel) |
| Play / Apple IAP vars | Optional | Mixed | See `.env.example` |

\* Required for AI in production. CI may use placeholders so the build compiles.

`NEXT_PUBLIC_*` is inlined at **build** time — change on Vercel ⇒ **redeploy**. Unprefixed vars are runtime-only.

The build fails if `NEXT_PUBLIC_SUPABASE_*` are missing (`next.config.mjs`).

---

## Notes by group

**Supabase** — production ref `rsdjbqzjdyeaedyqwrvc`, region `us-west-2`. Anon key is public **with RLS**.

**Anthropic** — `/api/buscar`, `/api/roteiro`, `/api/avaliacoes/analisar`. Never expose to the browser.

**Store links** — one QR to `https://guiadebolso.app/baixar`; the page picks App Store vs Play. Empty URLs show “Em breve”.

**Google Maps** — Places autocomplete in admin; static map on place detail. Missing key degrades to a Maps link.

**Service role** — guest feedback, QR scan log, inactive-place purge. Only in Route Handlers.

**Firebase** — three formats via `lib/serviceAccountEnv.js`. Encode with `node scripts/encode-firebase-service-account.mjs`. Details: [push-notifications.md](../push-notifications.md).

**IAP** — `GOOGLE_PLAY_*`, `APPLE_IAP_*`, `NEXT_PUBLIC_*_PREMIUM_PRODUCT_ID` in `.env.example`.

Dashboard (not Next env): Google/Apple/Twilio providers, Auth redirect URLs, Storage buckets.

---

## Minimal local file

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

CI secrets (optional; workflow has placeholders): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `ANTHROPIC_API_KEY`.

Related: [deployment.md](../deployment.md), [api.md](../api.md), [getting-started.md](./getting-started.md).
