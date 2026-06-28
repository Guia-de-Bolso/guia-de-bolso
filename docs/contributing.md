# Contributing

Thank you for contributing to Guia de Bolso. This guide covers local setup, conventions, and how to propose changes.

> **Convenções detalhadas:** [conventions.md](./conventions.md) · **Onboarding:** [onboarding.md](./onboarding.md) · **Variáveis:** [environment.md](./environment.md)

## Getting started

### Prerequisites

- **Node.js** 20+
- **npm**
- **Git**
- Supabase project access (or a personal fork + Supabase project)
- Anthropic API key (for AI features)

### Setup

```bash
git clone https://github.com/BrunoDislilerDev/guia-de-bolso.git
cd guia-de-bolso
npm install
```

Create `.env.local` at the project root (copy from [`.env.example`](../.env.example)):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
# Optional — Google Places (admin) + Static Maps (place detail)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Run database migrations — see [Migrations manifest](./migrations.md#manifest).

Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000

### Verify your setup

```bash
npm run build   # must pass before PR
npm run lint    # ESLint
```

---

## Project conventions

**Canonical:** [conventions.md](./conventions.md) (structure, API, RLS, security, tests).  
**Line-level style:** [CODING_STANDARDS.md](../CODING_STANDARDS.md).  
**Index:** [ENGINEERING_GUIDE.md](../ENGINEERING_GUIDE.md) → `docs/`.

---

## Branching & commits

1. Create a branch from `main`:

   ```bash
   git checkout -b feat/minha-feature
   ```

2. Make focused changes (one feature or fix per PR when possible).

3. Commit messages — use clear, imperative Portuguese or English:

   ```
   feat: redesign da home com sugestões contextuais
   fix: contador de busca IA não incrementava
   docs: adiciona guia de deployment
   ```

4. Push and open a Pull Request on GitHub.

---

## Pull request checklist

- [ ] `npm run build` passes locally
- [ ] No secrets in diff
- [ ] UI tested on mobile viewport (~390px)
- [ ] Auth flows tested if touching login/favorites/search
- [ ] SQL migrations documented if added
- [ ] `README.md` or `docs/` updated for user-visible changes

---

## Areas that need care

| Area | Note |
|------|------|
| Premium counters | Requires SQL functions `increment_*_ia`; test 1→2→3→paywall |
| RLS | Test as anonymous, user, and admin |
| Place type detection | `isLugarPublico()` in `lib/lugarDetalhe.js` — beaches vs restaurants |
| Geolocation | Features degrade gracefully without GPS permission |
| Admin | Confirm `role` is `admin` or `dev`; test `/admin`, `/admin/logs`, `/admin/taxonomia` after taxonomy SQL |
| Reviews IA | `POST /api/avaliacoes/analisar` needs `ANTHROPIC_API_KEY`; run `avaliacoes_moderacao.sql` for `aspectos` / `sugestao_ia` |
| Opening hours | Multi-shift / overnight strings — run `node lib/horarios.test.js` after changes to `lib/horarios.js` |

---

## Tests e CI

```bash
npm test              # unitários lib/*.test.js (~1s)
npm run lint
npm run build
npm run test:e2e      # Playwright smoke (sobe dev localmente ou start no CI)
```

**Primeira vez (E2E):** `npx playwright install chromium`

GitHub Actions ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)) em PRs e pushes para `main`:

1. `npm run lint`
2. `npm test`
3. `npm run build` (placeholders de env se secrets não estiverem no GitHub)
4. `npx playwright install --with-deps chromium`
5. `npm run test:e2e` (10 smoke tests em `e2e/smoke.spec.js`)

Vercel faz o deploy; Actions valida qualidade. Secrets opcionais no GitHub — fallbacks permitem compilar sem Supabase real.

Checklist manual (153 casos): [`TESTING-CHECKLIST.md`](./TESTING-CHECKLIST.md).

---

## Code review expectations

- Prefer small, reviewable PRs
- Include screenshots or screen recordings for UI changes
- Explain breaking changes in the PR description
- Link related issues when applicable

---

## Reporting issues

Include:

- Steps to reproduce
- Expected vs actual behavior
- Browser/device
- Whether user was logged in / premium
- Console or network errors if relevant

---

## Documentation

Central index: **[docs/README.md](./README.md)**. When adding features, update as needed:

| Change | File |
|--------|------|
| Endpoint | `docs/api.md` |
| Schema / RLS | `docs/database.md`, `supabase/*.sql`, `docs/migrations.md` |
| Product behavior | `docs/features.md`, `docs/CHANGELOG.md` |
| Env var | `.env.example`, `docs/environment.md` |
| Native auth (Capacitor) | `docs/authentication.md`, `docs/deployment.md` |
| ADR | `docs/architectural-decisions.md` |
| Overview | `README.md` (brief), detail in `docs/` |
| Agents | `CLAUDE.md` (optional) |

---

## License & contact

This is a private/portfolio project by [Bruno Disliler](https://brunodisliler.com).  
For questions about contributing, open a GitHub issue or contact the maintainer.

## Related docs

- [Engineering guide](../ENGINEERING_GUIDE.md)
- [Coding standards](../CODING_STANDARDS.md)
- [Architecture](./architecture.md)
- [Deployment](./deployment.md)
- [Features](./features.md)
