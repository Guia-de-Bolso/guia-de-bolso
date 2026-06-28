# Variáveis de ambiente

Referência única para configuração local, Vercel e CI. Template versionado: [`.env.example`](../.env.example).

**Nunca** commitar `.env.local` ou chaves reais.

---

## Resumo rápido

| Variável | Obrigatória | Escopo | Onde configurar |
|----------|:-----------:|--------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Sim | Build + runtime | Vercel Production/Preview, `.env.local` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sim | Build + runtime | Idem — chave **anon/publishable**, não `service_role` |
| `ANTHROPIC_API_KEY` | Sim* | Runtime server | Vercel, `.env.local` |
| `ANTHROPIC_MODEL` | Recomendado | Runtime server | Default no código: `claude-sonnet-4-5` |
| `NEXT_PUBLIC_SITE_URL` | Opcional | Build | URL canônica (QR, links absolutos) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Opcional | Build | Admin Places + mapa estático no detalhe |
| `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` | App nativo | Build | Google Sign-In Android/iOS + Supabase |
| `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID` | App iOS | Build | Google Sign-In iOS (`lib/nativeSocialLoginInit.js`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Opcional | Runtime server | Guest feedback, logs QR, cron purge — **nunca** `NEXT_PUBLIC_` |
| `CRON_SECRET` | Opcional* | Runtime server | Protege `/api/cron/lugares-purge` (*obrigatório se cron Vercel ativo) |
| `UPSTASH_REDIS_REST_URL` | Opcional | Runtime server | Rate limit distribuído IA (`lib/iaRateLimit.js`); fallback in-memory se ausente |
| `UPSTASH_REDIS_REST_TOKEN` | Opcional | Runtime server | Par Upstash Redis REST |
| `NEXT_PUBLIC_SENTRY_DSN` | Opcional | Build | Observabilidade (`lib/observability.js`) |
| `NEXT_PUBLIC_OPENWEATHER_API_KEY` | Opcional | Build | Legado; clima principal usa Open-Meteo |

\* Obrigatória para features de IA em produção; build CI pode usar secret placeholder se só validar compilação.

---

## Escopos Next.js

| Prefixo | Quando é lido | Implicação |
|---------|---------------|------------|
| `NEXT_PUBLIC_*` | **Build time** no bundle do cliente | Alterar na Vercel exige **novo deploy** |
| Sem prefixo | **Runtime** em Route Handlers e Server Components | Redeploy após mudança na Vercel |

O projeto valida presença de `NEXT_PUBLIC_SUPABASE_*` no build (`next.config.mjs`) para evitar deploy sem backend.

---

## Detalhamento por variável

### `NEXT_PUBLIC_SUPABASE_URL`

- URL do projeto: `https://<project-ref>.supabase.co`
- Produção: ref `rsdjbqzjdyeaedyqwrvc`, região `us-west-2`

### `NEXT_PUBLIC_SUPABASE_ANON_KEY`

- Chave pública com **RLS ativo**
- Usada em: browser client, server client com cookies, `getAnonServerClient()` em `/api/lugares`

### `ANTHROPIC_API_KEY`

- Rotas: `/api/buscar`, `/api/roteiro`, `/api/avaliacoes/analisar`
- **Proibido** expor ao browser

### `ANTHROPIC_MODEL`

- Ex.: `claude-sonnet-4-5`, `claude-sonnet-4-20250514`
- Sobrescreve default em cada route se definida

### `NEXT_PUBLIC_SITE_URL`

- Base para URLs em PDF/QR quando request não traz `origin`
- Local: `http://localhost:3000`
- Produção: `https://guiadebolso.app`

### `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

- **Places API** — autocomplete no admin (`EnderecoAutocomplete`)
- **Maps Static API** — preview no detalhe (`getStaticMapUrl`)
- Sem chave: UI degrada para link Maps sem imagem estática

### `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID`

- **Web:** Supabase Google OAuth (same value in Supabase Dashboard → Authentication → Google).
- **Capacitor Android:** native Google Sign-In via `@capgo/capacitor-social-login` (`lib/nativeGoogleAuth.js`); use the **Web** Client ID, not the Android OAuth client ID.
- **Capacitor iOS:** passed as `iOSServerClientId` alongside `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID`.
- Requires Vercel **redeploy** after change (`NEXT_PUBLIC_*` is baked at build time; the app WebView loads `https://app.guiadebolso.app`).

### `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID`

- **Capacitor iOS only** — OAuth iOS client from Google Cloud (bundle `app.guiadebolso`).
- Must match the **reversed client ID** in `ios/GoogleAuth.xcconfig` → `Info.plist` URL scheme.
- Helper: `getGoogleIOSUrlScheme()` in `lib/nativeSocialLoginInit.js`.
- See [authentication.md](./authentication.md#iosgoogleauthxcconfig--google-url-scheme).

### `SUPABASE_SERVICE_ROLE_KEY`

- Bypassa RLS — uso mínimo:
  - `POST /api/feedback` para visitantes
  - `GET /q/[slug]` log `escaneou_qr`
  - `GET /api/cron/lugares-purge` exclusão de locais inativos (30 dias)
- Apenas em `app/api/**` ou Route Handlers isolados
- **Nunca** importar em `"use client"`

### `CRON_SECRET`

- Protege `GET /api/cron/lugares-purge` (Vercel Cron envia `Authorization: Bearer <CRON_SECRET>`)
- Obrigatório em **Production** se o cron estiver ativo (`vercel.json`)
- Gere valor aleatório longo; não usar `NEXT_PUBLIC_`

### `NEXT_PUBLIC_SENTRY_DSN`

- Quando preenchido, erros podem ser enviados via `reportError()` (evolução contínua)

---

## Arquivo local

```bash
cp .env.example .env.local
```

Exemplo mínimo funcional:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Vercel

**Settings → Environment Variables**

| Ambiente | Recomendação |
|----------|--------------|
| **Production** | Projeto Supabase de produção + Anthropic produção |
| **Preview** | Mesmo Supabase ou projeto staging isolado; adicionar URLs de callback no Supabase |
| **Development** | Opcional (CLI `vercel env pull`) |

Após alterar variáveis: **Redeploy** (Deployments → Redeploy).

### Sintoma: “Supabase não configurado no deploy”

- `NEXT_PUBLIC_*` ausentes no **build** da Vercel
- Corrigir env e redeploy

---

## GitHub Actions (CI)

Secrets em **Repository → Settings → Secrets**:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` (opcional)

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml).

---

## Supabase Dashboard (não são env do Next)

Configurar no painel Supabase, não no `.env.local`:

| Configuração | Onde |
|--------------|------|
| Google OAuth Client ID/Secret | Authentication → Providers |
| Twilio SMS | Authentication → Phone |
| Site URL + Redirect URLs | Authentication → URL Configuration |
| Storage buckets | Storage + SQL policies em `/supabase` |

Redirect produção: ver [`authentication.md`](./authentication.md).

---

## Segurança

| ❌ Nunca | ✅ Sempre |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE` | Service role só server, sem prefixo |
| Commitar `.env.local` | Usar `.env.example` como documentação |
| Mesma service role em preview público aberto | Projeto Supabase separado para PRs externos |

---

## Referências

- [`deployment.md`](./deployment.md)
- [`api.md`](./api.md#environment-variables-api)
- [`onboarding.md`](./onboarding.md)
