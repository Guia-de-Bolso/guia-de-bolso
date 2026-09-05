# Contribuindo

Obrigado por contribuir com o **Guia de Bolso**.

**English:** [CONTRIBUTING.md](./CONTRIBUTING.md)

Este repositório é um produto em produção. PRs são revisados em segurança (RLS, segredos, admin), UX mobile (~390px) e documentação.

| Leia primeiro | Por quê |
|---------------|---------|
| [Código de conduta](./CODE_OF_CONDUCT.md) | Como colaboramos |
| [Documentação técnica](./docs/README.md) | Arquitetura e onboarding |
| [Convenções](./docs/conventions.md) | Onde o código vive |
| [Padrões de código](./CODING_STANDARDS.md) | Estilo linha a linha |

Processo completo (checklist de PR, áreas sensíveis, CI): [`docs/contributing.md`](./docs/contributing.md).

## Caminho rápido

```bash
git clone https://github.com/BrunoDislilerDev/guia-de-bolso.git
cd guia-de-bolso
npm install
cp .env.example .env.local
npm run dev
```

Antes do pull request:

```bash
npm run lint
npm test
npm run check:api-security
npm run build
```

1. Branch a partir de `main`: `feat/…`, `fix/…` ou `docs/…`
2. PR focado
3. Atualize a docs se mudar comportamento, schema ou env
4. Não commite `.env.local` nem secrets

Issues: use os templates do GitHub. Segurança: [`SECURITY.md`](./SECURITY.md).
