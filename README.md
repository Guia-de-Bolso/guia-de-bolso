<h1 align="center">
  <img src="docs/materiais/logo.png" alt="Guia de Bolso" width="72" /><br />
  Guia de Bolso
</h1>

<p align="center">
  <strong>AI-powered local discovery for Imbituba, Santa Catarina</strong><br />
  Mobile-first web + native apps that answer <em>what should I do right now?</em>
</p>

<p align="center">
  <a href="README.pt-BR.md"><strong>Português (Brasil)</strong></a>
  &nbsp;·&nbsp;
  <a href="https://guiadebolso.app"><strong>Live app</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/en/README.md"><strong>Technical handbook</strong></a>
  &nbsp;·&nbsp;
  <a href="docs/README.md"><strong>Documentação técnica</strong></a>
</p>

<p align="center">
  <a href="https://github.com/BrunoDislilerDev/guia-de-bolso/actions/workflows/ci.yml"><img src="https://github.com/BrunoDislilerDev/guia-de-bolso/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <img src="https://img.shields.io/badge/Next.js-16-000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
  <img src="https://img.shields.io/badge/AI-Claude-D97757?style=flat-square" alt="Claude" />
  <img src="https://img.shields.io/badge/Hosted-Vercel-000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel" />
</p>

---

## Table of contents

- [Overview](#overview)
- [Product](#product)
- [Screenshots](#screenshots)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Documentation](#documentation)
- [Security](#security)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

**Guia de Bolso** is the official-style city guide for **Imbituba, SC**. It combines a curated catalog (beaches, restaurants, trails, services), live context (opening hours, distance, weather), moderated reviews, and **Anthropic Claude** for natural-language search and trip itineraries.

| | |
|---|---|
| **Production** | [guiadebolso.app](https://guiadebolso.app) |
| **Stores** | [App Store](https://apps.apple.com/br/app/guia-de-bolso-imbituba/id6784377524) · [Google Play](https://play.google.com/store/apps/details?id=app.guiadebolso) · smart link [`/baixar`](https://guiadebolso.app/baixar) |
| **UI language** | Portuguese (pt-BR) |
| **Target viewport** | Mobile-first (~390px), centered on desktop |

### Who it is for

| Audience | Need | How the product responds |
|----------|------|--------------------------|
| Visitors | Decide without planning | Home, AI search, curated atrativos, maps handoff |
| Residents | What is open nearby | Live hours, GPS distance, category filters |
| Local businesses | Presence in the city guide | Listings, partner carousel, QR, reports |
| Operators | Run the catalog | Role-gated `/admin` CMS |

---

## Product

### Consumer

- Contextual home (weather, AI search, hero atrativo, partners, trending, nearby)
- Explorar (`/categorias`) with the same smart search as home
- Place detail: gallery, hours (two shifts / overnight), quick actions, reviews, IR AGORA (Google / Apple / Waze)
- Curated **atrativos** with guide mode and trail progress
- Favorites with offline cache (IndexedDB + service worker on favorite routes)
- Auth: Google (web + native), SMS OTP, Sign in with Apple (iOS native)
- Voice search (native + Web Speech fallback)
- Push notifications on native apps (opt-in in profile)

### Guia Premium

| Capability | Signed-in (free) | Premium |
|------------|------------------|---------|
| AI place search | **10 / day** (resets midnight, Brasília) | Unlimited |
| AI itinerary | **2 / day** | Unlimited |

Store billing: Google Play + App Store IAP (`/api/premium/verify-*`). Asaas self-serve for establishments remains on the roadmap.

### Operations

`/admin` is gated by `perfis.role`:

- **admin** — locais, atrativos, review moderation, establishment reports
- **dev** — partners, contracts, users, logs, taxonomy, IA costs, expenses, push

---

## Screenshots

<table>
  <tr>
    <td align="center" width="25%">
      <img src="docs/screenshots/home.png" alt="Home" width="200" /><br />
      <sub><b>Home</b></sub>
    </td>
    <td align="center" width="25%">
      <img src="docs/screenshots/lugar-detalhe.png" alt="Place detail" width="200" /><br />
      <sub><b>Place detail</b></sub>
    </td>
    <td align="center" width="25%">
      <img src="docs/screenshots/explorar.png" alt="Explorar" width="200" /><br />
      <sub><b>Explorar</b></sub>
    </td>
    <td align="center" width="25%">
      <img src="docs/screenshots/atrativos.png" alt="Atrativos" width="200" /><br />
      <sub><b>Atrativos</b></sub>
    </td>
  </tr>
</table>

---

## Architecture

```text
Browser / Capacitor  →  Next.js 16 (Vercel)  →  Supabase (Postgres + Auth + Storage)
                                      ↘ Anthropic Claude (search & itineraries)
                                      ↘ Open-Meteo, FCM, Play / App Store IAP
```

| Layer | Stack |
|-------|--------|
| App | Next.js 16 App Router, React 19, Tailwind CSS 4, **JavaScript** (no TypeScript) |
| Data | Supabase PostgreSQL (`us-west-2`), RLS on every exposed table |
| Identity | Supabase Auth (Google, phone OTP, Apple on iOS) |
| Native | Capacitor 8 (`android/`, `ios/`), bundle `app.guiadebolso` |
| Quality | `node --test` on `lib/*.test.js`, Playwright smoke, GitHub Actions CI |

Secrets (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) never ship to the browser. AI quotas are reserved with `SECURITY DEFINER` RPCs before Claude is called.

Full diagrams: [`docs/architecture.md`](docs/architecture.md).

---

## Getting started

**Prerequisites:** Node.js **20+** (`engines`: `>=20 <26`), npm, Git. Your own Supabase project and Anthropic key if you are **forking** (production keys are not in the repo).

```bash
git clone https://github.com/BrunoDislilerDev/guia-de-bolso.git
cd guia-de-bolso
npm install
cp .env.example .env.local
# Fill NEXT_PUBLIC_SUPABASE_* and ANTHROPIC_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Command | Purpose |
|---------|---------|
| `npm run dev` | Local server |
| `npm run lint` | ESLint |
| `npm test` | Unit tests |
| `npm run check:api-security` | API docs vs handlers |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright smoke (`npx playwright install chromium` once) |

**Fork / new Supabase:** schema is documented in [`docs/database.md`](docs/database.md); apply SQL in [`docs/migrations.md`](docs/migrations.md#manifest). There is no one-click dump of production data — that is intentional. Step-by-step: [`docs/en/getting-started.md`](docs/en/getting-started.md) · [`docs/onboarding.md`](docs/onboarding.md).

Env reference: [`.env.example`](.env.example) · [`docs/environment.md`](docs/environment.md) · [`docs/en/environment.md`](docs/en/environment.md).

---

## Documentation

| Audience | Start here |
|----------|------------|
| New engineer (EN) | [`docs/en/README.md`](docs/en/README.md) |
| New engineer (PT) | [`docs/README.md`](docs/README.md) → [`docs/onboarding.md`](docs/onboarding.md) |
| Fork from zero | [`docs/en/getting-started.md`](docs/en/getting-started.md) |
| APIs | [`docs/api.md`](docs/api.md) |
| Database | [`docs/database.md`](docs/database.md) |
| Deploy | [`docs/deployment.md`](docs/deployment.md) |
| Product behavior | [`docs/features.md`](docs/features.md) |
| ADRs | [`docs/architectural-decisions.md`](docs/architectural-decisions.md) |

Coding rules: [`CODING_STANDARDS.md`](CODING_STANDARDS.md) · shortcut [`ENGINEERING_GUIDE.md`](ENGINEERING_GUIDE.md).

---

## Security

- RLS on catalog, profiles, favorites, reviews, logs, storage
- Admin UI + APIs gated by `admin` / `dev` roles (never client-only)
- Reviews public only after moderation
- Vulnerability reports: **contato@guiadebolso.app** — see [`SECURITY.md`](SECURITY.md)

Do not open public issues with exploit details.

---

## Roadmap

Shipped (do not treat as TODO): native push, voice search, establishment QR, offline favorites, Play/App Store Premium.

| Theme | Next |
|-------|------|
| Commerce | Establishment self-serve portal; Asaas billing |
| Platform | Broader offline / PWA; WhatsApp auth (Meta) |
| Product | Local events, check-in, city history layer, dark mode |

---

## Contributing

Please read [`CONTRIBUTING.md`](CONTRIBUTING.md) ([português](CONTRIBUTING.pt-BR.md)) and the [Code of Conduct](CODE_OF_CONDUCT.md).

1. Fork → feature branch (`feat/…`, `fix/…`, `docs/…`)
2. `npm run lint && npm test && npm run build`
3. Open a PR using the template (screenshots for UI)

---

## Author

**Bruno Disliler** — [brunodisliler.com](https://brunodisliler.com) · [@BrunoDislilerDev](https://github.com/BrunoDislilerDev)

---

## License

See [`LICENSE`](LICENSE). Source is available to study and to contribute; the **Guia de Bolso** brand and production data are not licensed for reuse.
