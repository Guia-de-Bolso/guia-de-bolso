# Technical handbook (English)

**[Português](../README.md)** · Product READMEs: [English](../../README.md) · [Português](../../README.pt-BR.md)

This folder is the English engineering handbook. API contracts, database, deployment, and product features live in English at `docs/*.md` and are linked below — they are not duplicated here.

Production: [guiadebolso.app](https://guiadebolso.app).

---

## Read this first

1. [Getting started](./getting-started.md) — clone, env, **fork with your own Supabase**
2. [Onboarding](./onboarding.md) — first three days on the team
3. [Architecture](../architecture.md) — system context and diagrams
4. [Project structure](./project-structure.md) — where to change code
5. [Conventions](./conventions.md) — how we write code here

---

## Handbook map

| Topic | English | Notes |
|-------|---------|--------|
| Fork / local setup | [getting-started.md](./getting-started.md) | Honest about schema bootstrap |
| First days | [onboarding.md](./onboarding.md) | |
| Environment variables | [environment.md](./environment.md) | Canonical list also in PT |
| Authentication | [authentication.md](./authentication.md) | Web + Capacitor |
| Data flows | [data-flows.md](./data-flows.md) | |
| Folders | [project-structure.md](./project-structure.md) | |
| Conventions | [conventions.md](./conventions.md) | |
| ADRs | [architectural-decisions.md](./architectural-decisions.md) | |
| Staging | [staging.md](./staging.md) | |
| **Architecture** | [../architecture.md](../architecture.md) | Already EN |
| **HTTP APIs** | [../api.md](../api.md) | Already EN |
| **Database** | [../database.md](../database.md) | Already EN |
| **DB architecture** | [../DATABASE_ARCHITECTURE.md](../DATABASE_ARCHITECTURE.md) | Already EN |
| **Migrations** | [../migrations.md](../migrations.md) | Already EN |
| **Deploy** | [../deployment.md](../deployment.md) | Already EN |
| **Features** | [../features.md](../features.md) | Already EN |
| **Changelog** | [../CHANGELOG.md](../CHANGELOG.md) | Already EN |
| **Contribute** | [../../CONTRIBUTING.md](../../CONTRIBUTING.md) | GitHub root |

---

## Quality bar

```bash
npm run lint
npm test
npm run check:api-security
npm run build
npm run test:e2e   # optional locally; required on CI
```

CI: [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml) — lint → API docs check → unit tests → build → Playwright.

---

## Security

Report issues privately: [SECURITY.md](../../SECURITY.md). RLS checklist: [security-rls.md](../security-rls.md).
