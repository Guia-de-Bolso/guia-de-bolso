# Conventions

Required patterns. Contribution process: [CONTRIBUTING.md](../../CONTRIBUTING.md). Portuguese original: [../conventions.md](../conventions.md). Line style: [CODING_STANDARDS.md](../../CODING_STANDARDS.md).

---

## Language

| Aspect | Rule |
|--------|------|
| Application code | **JavaScript** (no TypeScript) |
| Product copy | **pt-BR**, direct, mobile-first |
| Comments | PT or EN — **consistent inside a file** |
| Engineering docs | Portuguese originals in `docs/` + English in `docs/en/`; API/schema docs are English |

User-facing errors: [`lib/userMessages.js`](../../lib/userMessages.js).

---

## Next.js 16

Read `node_modules/next/dist/docs/` before changing App Router or cache behavior. `"use client"` only when hooks or browser APIs are required. Domain logic in `lib/`. Admin pages always go through `app/admin/layout.js`.

Imports use `@/` from the repo root (`lib/supabase`, `lib/supabase/server`).

---

## Placement

| What | Where |
|------|--------|
| URL route | `app/**/page.js` or `route.js` |
| UI | `components/{domain}/` |
| Rules / parse / limits | `lib/` |
| Repeated queries | `lib/data/*.js` |
| SQL / RLS | `supabase/*.sql` + [migrations.md](../migrations.md) |
| Unit tests | `lib/*.test.js` |

UI: Tailwind 4, `max-w-md`, tokens in `app/globals.css` (`#f0f4f3`, `#1a4a3a`). Global dark mode is **off**. Images: `RemotePhoto` for CDN thumbs/heroes; `next/image` on list cards. Sheets: `role="dialog"` + `aria-modal`.

---

## API handlers

Protected AI routes: validate body → `getAuthUser()` → `checkIaRateLimit` → read quota → **reserve** RPC immediately before Claude → **release** on failure → stable `code` on JSON errors. Never leak stack traces.

`lugares.id` is **`bigint`**. Public places: `status = 'ativo'`. Public reviews: `aprovada`. IA counters only via `increment_*_ia`.

---

## Git

Branches `feat/`, `fix/`, `docs/`. Imperative commits in PT or EN. Before PR: `npm run lint`, `npm test`, `npm run check:api-security`, `npm run build`. No secrets in the diff.

When you ship: update `docs/api.md`, `database.md` / SQL, `features.md`, `CHANGELOG.md`, `.env.example` as applicable.
