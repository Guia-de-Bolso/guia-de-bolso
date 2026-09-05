# Contributing

Thank you for contributing to **Guia de Bolso**.

**Português:** [CONTRIBUTING.pt-BR.md](./CONTRIBUTING.pt-BR.md)

This repository is a production product. Changes are reviewed for security (RLS, secrets, admin), mobile UX (~390px), and documentation drift.

| Read first | Why |
|------------|-----|
| [Code of Conduct](./CODE_OF_CONDUCT.md) | How we collaborate |
| [Technical handbook (EN)](./docs/en/README.md) | Architecture and fork setup |
| [Conventions](./docs/conventions.md) | Where code lives |
| [Coding standards](./CODING_STANDARDS.md) | Line-level style |

Detailed process (PR checklist, sensitive areas, CI): [`docs/contributing.md`](./docs/contributing.md).

## Quick path

```bash
git clone https://github.com/BrunoDislilerDev/guia-de-bolso.git
cd guia-de-bolso
npm install
cp .env.example .env.local
npm run dev
```

Before a pull request:

```bash
npm run lint
npm test
npm run check:api-security
npm run build
```

1. Branch from `main`: `feat/…`, `fix/…`, or `docs/…`
2. Keep the PR focused
3. Update docs when behavior, schema, or env vars change
4. Do not commit `.env.local` or secrets

Issues: use the GitHub templates. Security: [`SECURITY.md`](./SECURITY.md).
