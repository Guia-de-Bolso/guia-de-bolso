# Decisões arquiteturais

**[English](./en/architectural-decisions.md)**

Registro das decisões técnicas principais do **Guia de Bolso** (formato ADR simplificado). Novas decisões devem ser acrescentadas no topo com data e status.

| Status | Significado |
|--------|-------------|
| **Aceito** | Em produção / prática atual |
| **Proposto** | Planejado, não implementado |
| **Substituído** | Não usar mais; histórico mantido |

---

## ADR-001 — Next.js 16 App Router sem backend separado

| | |
|---|---|
| **Status** | Aceito |
| **Contexto** | Time pequeno, deploy serverless, produto mobile-first |
| **Decisão** | UI + Route Handlers no mesmo repo Next.js na Vercel |
| **Consequências** | (+) Menos ops, cold start aceitável; (−) lógica pesada deve ficar em `lib/`, não em handlers gigantes |

---

## ADR-002 — JavaScript sem TypeScript

| | |
|---|---|
| **Status** | Aceito |
| **Contexto** | Velocidade de iteração e perfil do maintainer |
| **Decisão** | JS puro; testes com `node --test` |
| **Consequências** | (+) onboarding rápido; (−) menos segurança estática — compensar com testes em `lib/` críticos |

---

## ADR-003 — Supabase como BaaS (Postgres + Auth + Storage)

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | PostgreSQL com RLS, Auth (Google + SMS), Storage para mídia |
| **Consequências** | (+) RLS como fronteira de segurança; (−) migrations manuais no SQL Editor |

---

## ADR-004 — Leitura pública direta do browser com RLS

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | Catálogo `lugares` ativo lido via cliente Supabase no browser, sem BFF para cada query |
| **Exceção** | `GET /api/lugares` para respostas cacheáveis na CDN |
| **Consequências** | Policies devem estar corretas; anon key nunca substitui service role no cliente |

---

## ADR-005 — IA apenas em Route Handlers

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | `ANTHROPIC_API_KEY` só em `app/api/*` |
| **Consequências** | Busca e roteiro sempre passam por cotas server (`premiumServer`, RPC) |

---

## ADR-006 — Cotas IA com RPC SECURITY DEFINER

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | Reserva atômica via `increment_*_ia` antes da Claude; estorno via `decrement_*_ia` em falha; bucket diário `YYYY-MM-DD` (SP) |
| **Consequências** | Cliente não pode “zerar” contador com update direto; alinhar dia em `GET /api/uso-premium` |

---

## ADR-007 — Sem estado global React para auth/premium

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | Hooks locais (`usePremiumUsage`, `getUser` por página) |
| **Consequências** | (+) menos acoplamento; (−) cuidado para não triplicar fetch — extrair hooks |

---

## ADR-008 — Admin com guard server + RLS

| | |
|---|---|
| **Status** | Aceito (atualizado) |
| **Decisão** | `app/admin/layout.js` valida sessão e `canAccessAdmin`; complemento client `AdminShell` |
| **Consequências** | Rotas admin não dependem só de redirect client-side |

---

## ADR-009 — Migrations SQL versionadas, apply manual

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | Arquivos em `/supabase`, ordem em `docs/migrations.md` |
| **Consequências** | (+) auditável no Git; (−) exige disciplina em releases — sem `db push` automático documentado |

---

## ADR-010 — `lugares.id` como bigint

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | PK numérica em produção; FKs e RPCs usam bigint |
| **Consequências** | Docs antigos com UUID estão obsoletos — ver `database.md` |

---

## ADR-011 — Taxonomia híbrida (código + tabelas)

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | Categorias fixas em `lib/categorias.js`; `subcategorias` e `tags` no banco |
| **Consequências** | Nova categoria macro exige deploy; subcategoria/tag via `/admin/taxonomia` |

---

## ADR-012 — Hybrid image delivery (RemotePhoto + next/image)

| | |
|---|---|
| **Status** | Aceito (atualizado) |
| **Decisão** | URLs públicas no Supabase Storage; **`RemotePhoto`** (`<img>` direto) para miniaturas e heróis; **`next/image`** só em cards de lista com `sizes` + `quality={60}`; `minimumCacheTTL` 30 dias em `next.config.mjs`; compressão client antes do upload admin/avatar |
| **Consequências** | Novo domínio de imagem exige `remotePatterns`; uploads de avatar preferem `POST /api/perfil/avatar` + bucket legado **Guia de Bolso - Imagens** |

---

## ADR-013 — Clima via Open-Meteo (sem chave)

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | Fetch direto do browser em `lib/clima.js` |
| **Consequências** | Dependência de disponibilidade externa; sem custo de API key |

---

## ADR-014 — Rate limit IA (Upstash + fallback)

| | |
|---|---|
| **Status** | Aceito (atualizado) |
| **Decisão** | `lib/iaRateLimit.js` usa **Upstash Redis** quando `UPSTASH_REDIS_REST_*` existem; senão, limite em memória por instância serverless |
| **Consequências** | Produção com Redis cobre multi-instância; dev local funciona sem Upstash |

---

## ADR-015 — CI GitHub Actions + deploy Vercel

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | PR: lint + unit tests + build + Playwright smoke; merge `main` → deploy Vercel |
| **Consequências** | Secrets duplicados GitHub + Vercel para build passar |

---

## ADR-016 — Headers de segurança em vercel.json

| | |
|---|---|
| **Status** | Aceito |
| **Decisão** | `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| **Consequências** | Geolocation permitida apenas `(self)` para UX de distância |

---

## ADR-017 — Favoritos offline automáticos (fase 1)

| Campo | Valor |
|-------|--------|
| **Data** | 2026-06-27 |
| **Status** | Aceito (fase 1 entregue) |
| **Contexto** | Trilhas e praias podem ficar sem sinal; favoritar já expressa intenção do usuário. |
| **Decisão** | Ao favoritar lugar ou atrativo, cache local automático (IndexedDB + fotos essenciais). Lista e detalhe em rotas client-only `/favoritos/lugar/[id]` e `/favoritos/atrativo/[id]`. **Fase 2:** `public/sw.js` cacheia shell HTML/JS de `/favoritos*` + `/_next/static` visitado; `start_url` PWA → `/favoritos`. |
| **Consequências** | Escopo limitado a favoritos logados; IA/clima/reviews continuam online. Home e demais rotas sem SW. SW só registra em produção (`NODE_ENV !== development`). |

---

## Decisões propostas (roadmap)

| ID | Tema | Notas |
|----|------|-------|
| P-001 | Cobrança Asaas | Portal estabelecimento + `premium_ativo` automatizado |
| P-002 | PWA / offline | **Entregue (favoritos):** IndexedDB + SW `/favoritos*`. **Futuro:** catálogo regional ou bundle Capacitor local |
| P-003 | Schema baseline export | `supabase/schema_baseline.sql` do projeto produção |
| P-004 | Rate limit distribuído | **Parcial:** Upstash na IA (`ADR-014`). Feedback / outras rotas ainda podem evoluir |
| P-005 | Role `estabelecimento` | Painel self-service separado do admin municipal |

---

## Como propor nova decisão

1. Abra PR com seção neste arquivo (data, contexto, decisão, consequências).
2. Atualize docs afetadas (`architecture.md`, `database.md`, etc.).
3. Se impactar segurança, atualize [`SECURITY_CHECKLIST.md`](../SECURITY_CHECKLIST.md).

---

## Referências

- [`architecture.md`](./architecture.md)
- [`DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md)
- [`features.md`](./features.md) — capacidades de produto
