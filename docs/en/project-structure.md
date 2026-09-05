# Project structure

Where code lives. Placement rules: [conventions.md](./conventions.md). Portuguese original: [../project-structure.md](../project-structure.md).

```text
guia-de-bolso/
├── app/                    # Next.js 16 App Router + Route Handlers
├── components/             # UI by product domain
├── hooks/                  # Shared React hooks
├── lib/                    # Domain logic, Supabase, integrations
├── supabase/               # SQL (manual apply)
├── docs/                   # This handbook
├── public/                 # Static assets, onboarding, QA checklist
├── e2e/                    # Playwright
├── android/ / ios/         # Capacitor
├── .github/workflows/      # CI
├── middleware.js           # Supabase session refresh
├── next.config.mjs
├── vercel.json
└── .env.example
```

---

## `app/`

| Path | Role |
|------|------|
| `page.js` | Home |
| `login/` | Google + SMS + native buttons |
| `auth/callback` | OAuth code exchange |
| `lugares/[id]` | Place detail |
| `categorias`, `categoria/[slug]` | Explorar |
| `favoritos/**` | Favorites + offline shells |
| `atrativos/**` | Curated spots (`/rotas` → 301) |
| `perfil/` | Profile |
| `admin/**` | CMS — **server guard** in `layout.js` |
| `api/**` | AI, premium, catalog, health, cron, push |
| `q/[slug]` | QR redirect |
| `baixar/` | Store smart link |
| `privacidade/`, `termos/` | Legal |

HTTP contracts: [api.md](../api.md).

---

## `components/` and `lib/`

Domain folders: `home/`, `explorar/`, `lugar/`, `rotas/`, `perfil/`, `admin/`, `favoritos/`, `baixar/`, `legal/`.

`lib/` holds premium/IA, catalog queries, hours, home selection, admin helpers, offline favorites, observability. Tests: `lib/*.test.js` (`npm test`).

---

## Config

| File | Role |
|------|------|
| `middleware.js` | Cookie refresh |
| `next.config.mjs` | Remote images, env guard, `minimumCacheTTL` |
| `vercel.json` | Security headers + crons |
| `playwright.config.js` | E2E |

Smoke: `e2e/smoke.spec.js` (health, home, login, explorar, atrativos, favoritos, perfil, admin redirect, nav). Specs call `skipOnboarding()` so the overlay does not block.

Related: [architecture.md](../architecture.md), [data-flows.md](./data-flows.md).
