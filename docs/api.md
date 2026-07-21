# API

Server routes live under `app/api/` as **Next.js Route Handlers**. All AI and premium-sensitive operations run here so API keys never reach the browser.

Base URL (production): `https://guiadebolso.app/api`  
Local: `http://localhost:3000/api`

> Índice geral: [docs/README.md](./README.md). Fluxos: [data-flows.md](./data-flows.md), [authentication.md](./authentication.md).

## Authentication

Most protected routes use Supabase session cookies via `@supabase/ssr`:

```js
import { getAuthUser } from "@/lib/premiumServer";
const user = await getAuthUser();
```

Unauthenticated requests to AI routes return `401` with `{ code: "LOGIN_REQUIRED", error, usage? }` where applicable. `POST /api/roteiro/salvar` returns `401` with `{ error }` only (no `code`).

## Endpoints

### `GET /api/health`

Deploy and uptime smoke check. No authentication. Covered by Playwright smoke (`e2e/smoke.spec.js`) and CI after each build.

**Success (200):**

```json
{
  "ok": true,
  "service": "guia-de-bolso",
  "timestamp": "2026-05-25T12:00:00.000Z"
}
```

Implementation: `app/api/health/route.js`.

---

### `GET /api/cron/lugares-purge`

Exclusão definitiva de lugares com `status = desativado` há **30+ dias** (calendário `America/Sao_Paulo`). Agendado na Vercel (`vercel.json`, 09:00 UTC).

**Auth:** `Authorization: Bearer <CRON_SECRET>` ou header `x-cron-secret` (mesmo valor de `CRON_SECRET`).

**Query:** `dryRun=1` — lista candidatos sem deletar.

**Requires:** `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`.

**Success (200):** `{ ok, hoje, dryRun, candidatos, excluidos, erros, idsExcluidos }`

Alertas no admin (sino): 7–2 dias antes e no último dia — `lib/adminAlertas.js`, `lib/lugarPurge.js`.

Implementation: `app/api/cron/lugares-purge/route.js`, `lib/purgeLugaresInativos.js`, migration `supabase/lugares_purge_inativos.sql`.

---

### `GET /api/cron/push-automations`

Prepara e envia campanhas automáticas de push: clima favorável, destaque
semanal, lembrete de roteiro salvo e eventos pendentes de novo local/parceiro.
Agendado diariamente às 12:00 UTC (9h em São Paulo).

**Auth:** `Authorization: Bearer <CRON_SECRET>` ou `x-cron-secret`.

**Requires:** `SUPABASE_SERVICE_ROLE_KEY`, credenciais Firebase e migration
`20260721190000_push_campaigns.sql`.

**Success:** `{ ok, prepared, campaigns, sent, failed, skipped, partial }`

O endpoint `POST /api/admin/push/process` usa o mesmo processador, com sessão
`admin`/`dev`, logo após alterações de conteúdo. Ele não aceita texto ou
destinatários manuais.

Implementation: `app/api/cron/push-automations/route.js`,
`app/api/admin/push/process/route.js`, `lib/pushCampaigns.js`.

---

### `GET /api/lugares`

Public read of active places via server-side anon client (`getAnonServerClient`). Responses include CDN-friendly cache headers (`lib/apiCacheHeaders.js`).

**Auth:** None  
**Query parameters:**

| Param | Description |
|-------|-------------|
| `mode=populares` | Trending places (RPC/favorites); `limit` 1–50 (default 8) |
| `mode=parceiros` | Active partners (`eh_parceiro = true`); `limit` 1–100 |
| `mode=curadoria` | Editorial flag (`conteudo_curadoria = true`); `limit` 1–100 |
| `ids` | Comma-separated place ids → `{ lugares: [...] }` |
| `categoria` | Filter by category name (with default list query) |
| `limit` | 1–100 for default active list (default 50) |

**Success:** `{ "lugares": [...] }`  
**Errors:** `503` if Supabase env missing on server; `500` on query failure

Implementation: `app/api/lugares/route.js`, queries in `lib/lugaresQuery.js` / `lib/lugaresPopulares.js`. Client wrapper: `lib/fetchLugaresApi.js`.

---

### `POST /api/buscar`

Natural-language place search powered by Claude.

**Auth:** Required  
**Premium:** Free tier — **10 searches/day** (resets at midnight, America/Sao_Paulo); Premium — unlimited

**Request body:**

```json
{
  "query": "restaurante romântico com vista",
  "filtroStatus": "todos"
}
```

`filtroStatus`: `todos` | `abertos` | `fechados` (see `lib/busca.js`)

**Success response:**

```json
{
  "lugares": [/* full place objects with relations */],
  "usage": {
    "premium": false,
    "buscas": { "used": 1, "limit": 10 }
  }
}
```

**Error codes:**

| HTTP | `code` | Meaning |
|------|--------|---------|
| 200 | — | Empty or whitespace `query` → `{ "lugares": [] }` (no auth check, no AI call, no quota increment) |
| 401 | `LOGIN_REQUIRED` | Not signed in |
| 403 | `LIMIT_REACHED` | Daily search limit exceeded (resets at midnight SP) |
| 500 | — | AI or server error |

Optional success fields: `message` (e.g. filter empty), `filtroStatus` echo.

**Flow:**

1. `checkBuscaAccess(user?.id, { increment: false })` — falha rápida se limite/login.
2. Loads active `lugares` with `localizacoes`, `lugares_tags`.
3. Builds compact context with `abertoAgora` per place.
4. **`reserveBuscaIaUsage`** → `increment_busca_ia` (reserva atômica **antes** da Claude).
5. Claude returns JSON array of place IDs.
6. Post-filter by `filtroStatus`.
7. On Claude error: **`releaseBuscaIaUsage`** → `decrement_busca_ia` (refund for non-premium).
8. Success returns `usage` da reserva; IA observability via `lib/logIA.js`.

Filtro de horário sem lugares elegíveis retorna `{ lugares: [] }` **sem** reservar cota.

---

### `POST /api/roteiro`

Generates a multi-day AI itinerary (markdown).

**Auth:** Required  
**Premium:** Free — **2/day**; Premium — unlimited

**Request body (example):**

```json
{
  "dias": "3",
  "perfil": "casal",
  "interesses": ["praia", "gastronomia"]
}
```

All three fields are required. `dias` and `perfil` must be non-empty **strings** (the route uses `.trim()`). `interesses` must be a non-empty array.

**Success:** `{ "conteudo": "<markdown>", "titulo": "Roteiro 3 - casal", "lugaresCatalog": [{ "id", "nome" }, ...], "usage": { ... } }`  
**Errors:** Same pattern as `/api/buscar` (`LOGIN_REQUIRED`, `LIMIT_REACHED`)

Implementation: `app/api/roteiro/route.js` (strict markdown system prompt, `max_tokens: 2400`, default model `claude-sonnet-4-5` or `ANTHROPIC_MODEL`). Quota flow matches search: `checkRoteiroAccess` (read) → `reserveRoteiroIaUsage` before Claude → `releaseRoteiroIaUsage` on failure. Client parses markdown via `lib/roteiroParse.js` → `RoteiroItineraryView`. IA observability via `lib/logIA.js`.

---

### `DELETE /api/roteiro/[id]`

Deletes a saved itinerary owned by the authenticated user.

**Auth:** Required

**Success:** `{ "success": true }`  
**Errors:** `401` (not logged in), `404` (not found or RLS blocked — run `supabase/roteiros_policies.sql`), `500`

Implementation: `app/api/roteiro/[id]/route.js` (verifies deleted row via `.select("id").maybeSingle()`).

---

### `POST /api/roteiro/salvar`

Persists a generated itinerary to `roteiros` for the logged-in user.

**Auth:** Required

**Request body:**

```json
{
  "titulo": "Fim de semana em Imbituba",
  "dias": "2",
  "perfil": "casal",
  "interesses": ["praia", "gastronomia"],
  "conteudo": "..."
}
```

Required: `titulo`, `dias`, `perfil`, `conteudo` (trimmed strings). `interesses` optional array (defaults to `[]`).

**Success:** `{ "success": true, "roteiro": { "id", "titulo", "dias", "perfil", "interesses", "conteudo", "created_at" } }`

**Errors:**

| HTTP | Body | Meaning |
|------|------|---------|
| 401 | `{ "error": "Faça login para salvar o roteiro." }` | No session (no `code` field) |
| 400 | `{ "error": "Dados incompletos para salvar o roteiro." }` | Missing required trimmed fields |
| 500 | `{ "error": "..." }` | Insert or server failure |

---

### `POST /api/feedback`

Receives user feedback (logged in or guest). Guest inserts use `SUPABASE_SERVICE_ROLE_KEY` server-side.

**Auth:** Optional (if session, `user_id` is set)

**Request body:**

```json
{
  "tipo": "erro",
  "assunto": "Busca IA",
  "mensagem": "Descreva com pelo menos 10 caracteres...",
  "nome_contato": "Nome",
  "email_contato": "email@exemplo.com",
  "pagina_origem": "/",
  "contexto_tecnico": { "code": "CLAUDE_ERROR", "route": "/", "timestamp": "..." }
}
```

**Success (201):** `{ "success": true, "message": "Recebemos seu feedback. Obrigado!", "id": "uuid" }`

**Errors (Portuguese `error` + `code`):**

| HTTP | `code` | Meaning |
|------|--------|---------|
| 400 | `VALIDATION` | Invalid tipo, short message, or invalid email |
| 429 | `RATE_LIMIT` | Max 5 submissions per hour per IP/user |
| 503 | `SERVER` | Guest insert without service role configured |
| 500 | `SERVER` | Insert failure |

**Rate limit:** in-memory per process (`lib/feedbackRateLimit.js`); comment in code notes production should use Redis/KV if scaled.

**Admin reads:** browser Supabase client on `/admin/feedback` (RLS admin).

---

### `GET /q/[slug]`

Public short link for establishment QR codes. Not under `/api`; implemented as App Router route handler.

**Auth:** None

**Behavior:**

1. Lookup `lugares` by `slug` where `status = 'ativo'` and category is QR-eligible (not Natureza/Aventura).
2. Insert `logs` row with `acao = 'escaneou_qr'` via **service role** (`createServiceClient`) — works for anonymous scans.
3. **302 redirect** to `/lugares/{id}?ref=qr`.

**Responses:**

| HTTP | Meaning |
|------|---------|
| 302 | Active eligible place found — redirect to detail |
| 404 | Unknown slug, inactive place, or ineligible category |

**Printed URL:** `{SITE}/q/{slug}` where `SITE` is `NEXT_PUBLIC_SITE_URL`, request origin, or `VERCEL_URL`.

**Admin:** slug generated on save in `LocalForm`; premium PDF download in `LugarQrSection` (`lib/qrPdf.js`, formats in `lib/qrPdf/formats.js`).

---

### `POST /api/admin/contratos/[id]/documentos`

Upload a commercial contract document (dev role only).

**Auth:** Session + `perfis.role = dev` (`requireAdminOnlyApi` — 401/403 otherwise)

**Body:** `multipart/form-data` — `file` (PDF, DOCX, JPEG, PNG, WebP; max 10 MB), `tipo` (`proposta`, `contrato_assinado`, `aditivo`, `comprovante`, `outro`)

**Success (201):** `{ "ok": true, "documento": { ... } }`

**Errors:** `400` `VALIDATION`; `404` `NOT_FOUND`; `500` `STORAGE`

**Storage:** private bucket `contratos-parceiros`; metadata in `contrato_documentos`.

---

### `GET /api/admin/contratos/documentos/[docId]`

Returns a 1-hour signed download URL for a stored contract document.

**Auth:** Dev only (`requireAdminOnlyApi`)

**Success (200):** `{ "ok": true, "url": "<signed>", "nome_arquivo": "..." }`

---

### `DELETE /api/admin/contratos/documentos/[docId]`

Removes document row and Storage object (dev only).

**Success (200):** `{ "ok": true }`

---

### `POST /api/avaliacoes/analisar`

Claude pre-moderation for a newly submitted review. Called from the client after `avaliacoes` insert; result is stored on `sugestao_ia` for the admin queue.

**Auth:** Required (must own the review row)

**Request body:**

```json
{
  "avaliacao_id": "uuid"
}
```

**Success response:**

```json
{
  "ok": true,
  "sugestao_ia": "aprovar: experiência genuína e detalhada"
}
```

**Error responses:**

| HTTP | Meaning |
|------|---------|
| 400 | Missing `avaliacao_id` |
| 401 | Not signed in |
| 403 | Review belongs to another user |
| 404 | Review not found |
| 500 | Claude or server error (submission already saved) |

**Flow:**

1. Load `avaliacoes` with `lugares(nome, categoria)`.
2. Build prompt from `nota`, `comentario`, `aspectos`.
3. Parse JSON `{ sugestao, motivo }` from Claude → persist `sugestao_ia`.

Uses `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` (default `claude-sonnet-4-5`).
Registra logs de moderação em `logs_ia` (feature `moderacao`) com latência, tokens e custo.

---

### `POST /api/perfil/avatar`

Authenticated profile photo upload. Uses **service role** server-side to write to Storage when client RLS is unavailable on the legacy bucket.

**Auth:** Supabase session cookie (401 `{ code: "UNAUTHORIZED" }` if missing).

**Body:** `multipart/form-data` with field `file` (JPEG, PNG, or WebP; max 5 MB).

**Requires:** `SUPABASE_SERVICE_ROLE_KEY` on the server (503 if missing).

**Success (200):** `{ "foto_url": "<public url>", "bucket": "Guia de Bolso - Imagens" | "imagens" }`

**Side effects:** Upserts `perfis.foto_url` for the authenticated user.

**Errors:** `400` validation (`code: "VALIDATION"`); `500` storage (`STORAGE`) or profile save (`PERFIL`).

Implementation: `app/api/perfil/avatar/route.js`, `lib/avatarStorage.js`; client: `app/perfil/editar/page.js`.

---

### `GET /api/uso-premium`

Returns current user's premium status and **daily** AI usage (with optional `resetsAt` / `msUntilReset` for countdown UI).

**Auth:** Session required via cookies (`getAuthUser()`).

**Responses:**

| Case | Body | HTTP |
|------|------|------|
| Signed in | `{ "loggedIn": true, "usage": { ... } }` | 200 |
| Anonymous | `{ "loggedIn": false, "usage": null }` | 200 |
| Server error | `{ "loggedIn": false, "usage": null, "error": "..." }` | 500 |

`usage` comes from `getPerfilUsage()` → `alignPerfilUsageToDay()` → `normalizeUsageFromPerfil()` (only `uso_ia_mes === YYYY-MM-DD` today, SP). **No** synthetic `0/3` on API errors; client syncs via `usePremiumUsage` and applies `usage` from `LIMIT_REACHED` responses.

**Response example:**

```json
{
  "loggedIn": true,
  "usage": {
    "premium": false,
    "day": "2026-05-19",
    "buscas": { "used": 2, "limit": 10, "remaining": 8 },
    "roteiros": { "used": 0, "limit": 2, "remaining": 2 },
    "resetsAt": "2026-05-20T03:00:00.000Z",
    "msUntilReset": 19800000
  }
}
```

**Client hook:** `lib/usePremiumUsage.js`

| Export | Meaning |
|--------|---------|
| `usage` | Current `PremiumUsage` (hydrated from cache, then server) |
| `loading` | Fetch in progress |
| `synced` | At least one sync attempt finished this session |
| `refresh()` | Re-fetch from this endpoint |
| `setUsage()` | Optimistic update + `localStorage` write (e.g. after `POST /api/buscar`) |

## Client ↔ server data access

Not all data goes through `/api`. The browser Supabase client reads public data directly (places, reviews, favorites) subject to RLS:

| Operation | Path |
|-----------|------|
| List places | `supabase.from("lugares")` |
| Favorites CRUD | `supabase.from("favoritos")` |
| Submit review | `supabase.from("avaliacoes").insert()` then `POST /api/avaliacoes/analisar` |
| Admin CRUD | Admin pages + RLS; **contracts API** dev-only (`requireAdminOnlyApi`). Most admin grids query Supabase from the browser. |

## Environment variables (API)

Full reference: [environment.md](./environment.md).

| Variable | Required by |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | All routes using Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Auth session, `/api/lugares` |
| `ANTHROPIC_API_KEY` | `/api/buscar`, `/api/roteiro`, `/api/avaliacoes/analisar` |
| `SUPABASE_SERVICE_ROLE_KEY` | `/api/feedback` (guest insert only; server-side) |
| `ANTHROPIC_MODEL` | Model id (default `claude-sonnet-4-5`) |

## Rate limits and cost control

- Free-tier limits are **per calendar day** (America/Sao_Paulo): 10 buscas, 2 roteiros; enforced in `lib/premiumServer.js` and RPC `increment_*_ia` before AI calls.
- Read path realigns stale or legacy `YYYY-MM` keys before normalize; RPC `increment_*_ia` matches exact `YYYY-MM-DD` only. Client must not trust `localStorage` over server when counts diverge.
- `LIMIT_REACHED` responses include `usage`; RPC JSON uses `resets_at`, client-normalized `usage` uses camelCase `resetsAt` / `msUntilReset`.
- Roteiro generation uses a filtered place list (`lib/roteiroLugares.js`) to reduce tokens.
- Search sends summarized place context (`lib/busca.js` → `buildLugarBuscaResumo`).
- Anthropic prompt caching ativo (`anthropic-beta: prompt-caching-2024-07-31`) nas rotas de IA com `cache_control: { type: "ephemeral" }` em blocos estáticos.
- Monitoramento de custo/latência por chamada via `lib/logIA.js` + tabela `logs_ia`; dashboard operacional em `/admin/ia`.

## Related docs

- [Architecture](./architecture.md)
- [Features](./features.md) — product limits
- [Database](./database.md) — `increment_*_ia` functions
