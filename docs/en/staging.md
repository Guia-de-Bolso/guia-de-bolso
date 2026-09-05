# Staging

Portuguese original: [../staging.md](../staging.md).

## Separate Supabase

1. Create a second project (e.g. `guia-de-bolso-staging`).
2. Apply SQL from `supabase/` using [migrations.md](../migrations.md) and [security-rls.md](../security-rls.md).
3. Set **Vercel Preview** env to the staging project (`NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`).
4. Add the Preview URL to Supabase Auth redirects.
5. Set `NEXT_PUBLIC_SITE_URL` to the Preview origin so OAuth and QR/absolute links match.

Never give an open Preview deployment the **production** service role.

## Smoke

**CI:** `npm run test:e2e` after build.

**Manual:** `GET /api/health`, sign-in, home listing, one AI search with a test user.
