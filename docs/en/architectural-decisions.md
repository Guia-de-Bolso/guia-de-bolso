# Architectural decisions

Lightweight ADRs. Newest decisions go at the top of the Portuguese file; this page mirrors **accepted** production decisions.

Portuguese original (source of truth for new ADRs): [../architectural-decisions.md](../architectural-decisions.md).

| Status | Meaning |
|--------|---------|
| Accepted | In production |
| Proposed | Not implemented |
| Superseded | Do not follow |

---

| ID | Decision | Why it matters |
|----|----------|----------------|
| 001 | Next.js 16 App Router, no separate API service | One repo, Vercel serverless |
| 002 | JavaScript, no TypeScript | Speed; compensate with `lib/*.test.js` |
| 003 | Supabase as BaaS | Postgres + Auth + Storage + RLS |
| 004 | Public reads from the browser with RLS | Exception: cached `GET /api/lugares` |
| 005 | AI only in Route Handlers | Key never in the client |
| 006 | IA quotas via `SECURITY DEFINER` RPC | Reserve before Claude, decrement on failure, daily key `America/Sao_Paulo` |
| 007 | No global React auth/premium context | Local hooks |
| 008 | Admin: server layout + RLS | `admin` vs `dev` split |
| 009 | SQL files in Git, apply by hand | Order in `migrations.md` |
| 010 | `lugares.id` is **bigint** | Docs that say UUID are wrong |
| 011 | Hybrid taxonomy | Categories in `lib/categorias.js`; subcategories/tags in DB |
| 012 | Hybrid images | `RemotePhoto` + `next/image` on lists |
| 013 | Weather via Open-Meteo | No API key |
| 014 | IA rate limit | **Upstash Redis** when env is set; in-memory fallback per instance |
| 015 | GitHub Actions CI + Vercel deploy | Lint, tests, build, Playwright |
| 016 | Security headers in `vercel.json` | Frame deny, nosniff, referrer, geolocation `(self)` |
| 017 | Offline favorites (phase 1) | IndexedDB + SW on `/favoritos*` in production builds |

---

## Proposed

| ID | Theme |
|----|--------|
| P-001 | Asaas + establishment portal |
| P-002 | Broader offline / PWA (favorites already shipped) |
| P-003 | Export `schema_baseline.sql` |
| P-004 | *(partial)* Distributed rate limit — Upstash is implemented; keep documenting KV alternatives |
| P-005 | `estabelecimento` self-serve role |

New ADR: PR against `docs/architectural-decisions.md` with date, context, decision, consequences. Touch [SECURITY_CHECKLIST.md](../../SECURITY_CHECKLIST.md) if security changes.

Related: [architecture.md](../architecture.md), [features.md](../features.md).
