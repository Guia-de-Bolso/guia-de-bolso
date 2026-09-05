# Ambiente de staging

**[English](./en/staging.md)**

## Supabase Preview

1. Crie um segundo projeto no Supabase (ex.: `guia-de-bolso-staging`).
2. Aplique os mesmos SQL de `supabase/` (começando por `security-rls.md`).
3. Configure secrets na Vercel **Preview**:

| Variável | Valor |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto staging |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key staging |
| `SUPABASE_SERVICE_ROLE_KEY` | service role staging (server only) |
| `ANTHROPIC_API_KEY` | chave de dev/teste |

## URL do site

Defina `NEXT_PUBLIC_SITE_URL` na Vercel Preview (URL do deployment preview) para links absolutos e OAuth.

## Smoke

**Automatizado (CI):** `npm run test:e2e` após build — ver casos em [`TESTING-CHECKLIST.md`](./TESTING-CHECKLIST.md#testes-automatizados-ci-e-local).

**Manual (preview/staging):** `GET /api/health`, login, listagem home, uma busca IA com usuário de teste.
