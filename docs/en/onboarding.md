# Technical onboarding

First days on **Guia de Bolso**. Forking with an empty Supabase project: [getting-started.md](./getting-started.md).

Portuguese original: [../onboarding.md](../onboarding.md).

---

## Day 0 — Access

| Item | Action |
|------|--------|
| Repo | Clone `https://github.com/BrunoDislilerDev/guia-de-bolso` |
| Node.js | **20+** and **&lt; 26** |
| Supabase | Invite to `rsdjbqzjdyeaedyqwrvc` **or** your own project |
| Anthropic | Key for local AI search / itineraries |
| Vercel | Optional — Preview/Production env |

```bash
git clone https://github.com/BrunoDislilerDev/guia-de-bolso.git
cd guia-de-bolso
npm install
cp .env.example .env.local
# See environment.md
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Day 1 — Reading

```text
README.md / README.pt-BR.md
docs/README.md or docs/en/README.md
docs/project-structure.md
docs/architecture.md
docs/authentication.md
docs/data-flows.md
docs/api.md
docs/database.md
docs/migrations.md
docs/conventions.md
docs/environment.md
```

Agent context (does not replace this handbook): [`CLAUDE.md`](../../CLAUDE.md), [`AGENTS.md`](../../AGENTS.md).

---

## Day 2 — Database and roles

1. Apply SQL in [migrations manifest](../migrations.md#manifest) order.
2. Sign in at `/login`.
3. Promote **only in development**:

```sql
UPDATE perfis SET role = 'admin' WHERE id = '<auth.users.id>';
```

Use `dev` if you need partners, contracts, logs, taxonomy.

4. Confirm: home shows `status = 'ativo'` places; `/admin` after login; anonymous SELECT of active `lugares` via RLS.

Security: [security-rls.md](../security-rls.md), [SECURITY_CHECKLIST.md](../../SECURITY_CHECKLIST.md).

---

## Day 3 — Critical flows

| Flow | Where | Check |
|------|--------|--------|
| Public catalog | `/`, `/categorias` | Active places, no login |
| AI search | Home search (signed in) | `POST /api/buscar`, **10/day** |
| Place detail | `/lugares/[id]` | Hours, maps, favorite |
| AI itinerary | `/roteiros` (`/atrativos` and `/rotas` 301) | `POST /api/roteiro`, **2/day** |
| Google auth | `/login` | `/auth/callback` |
| SMS auth | `/login` | Twilio OTP via Supabase |
| Admin CMS | `/admin/locais` | CRUD + Storage |
| Health | `GET /api/health` | `{ ok: true }` |

Manual QA: [TESTING-CHECKLIST.md](../TESTING-CHECKLIST.md), [`/checklist-testes.html`](../../public/checklist-testes.html).

---

## Daily commands

| Command | Use |
|---------|-----|
| `npm run dev` | Local server |
| `npm run build` | Required before PR |
| `npm run lint` | ESLint |
| `npm test` | `lib/*.test.js` |
| `npm run check:api-security` | Handlers vs `docs/api.md` |
| `npm run test:e2e` | Playwright smoke |

CI: `.github/workflows/ci.yml` — lint → security-docs check → test → build → Playwright.

---

## Where to start by task

| Task | Start in |
|------|----------|
| Consumer screen | `app/`, `components/{domain}/` |
| Business rule | `lib/` |
| Secrets / AI endpoint | `app/api/` |
| Policy or table | `supabase/*.sql` + `docs/migrations.md` |
| Premium / IA limits | `lib/premiumServer.js`, RPC `increment_*_ia` |
| pt-BR copy | `lib/userMessages.js` |
| Admin | `app/admin/`, `components/admin/`, `app/admin/layout.js` |

Preview URLs: [staging.md](./staging.md).

Maintainer: [brunodisliler.com](https://brunodisliler.com). Process: [CONTRIBUTING.md](../../CONTRIBUTING.md).
