# Convenções do projeto

Padrões obrigatórios para código, SQL, copy e documentação no **Guia de Bolso**. Processo de contribuição: [`contributing.md`](./contributing.md).

---

## Linguagem e locale

| Aspecto | Convenção |
|---------|-----------|
| Código da aplicação | **JavaScript** (sem TypeScript) |
| Copy de produto | **pt-BR** (tom direto, mobile-first) |
| Comentários | Português ou inglês — **consistente dentro do arquivo** |
| Documentação técnica | Português nos guias de handoff (`docs/onboarding.md`, etc.); referências API/schema podem estar em inglês |

Mensagens de erro para usuário: preferir [`lib/userMessages.js`](../lib/userMessages.js) e `buildApiErrorBody` / `mapApiErrorResponse`.

---

## Next.js 16

- Consultar **`node_modules/next/dist/docs/`** antes de alterar App Router, Route Handlers ou convenções de cache — o projeto segue Next 16 (pode divergir de tutoriais antigos).
- `"use client"` **somente** quando necessário: hooks, browser APIs, listeners Supabase.
- Lógica de negócio em **`lib/`**, não em `page.js` com centenas de linhas.
- Páginas admin protegidas pelo **`app/admin/layout.js`** (server) além de `useAdminAuth`.

---

## Imports e aliases

```js
import { createClient } from "@/lib/supabase";           // browser
import { createClient } from "@/lib/supabase/server";   // server
import { supabase } from "@/lib/supabase";              // anon, APIs sem cookie
```

Alias `@/` aponta para a raiz do repositório.

---

## Estrutura de arquivos

| O quê | Onde | Evitar |
|-------|------|--------|
| Rota URL | `app/**/page.js`, `route.js` | Rotas em `components/` |
| UI | `components/{domínio}/` | Lógica de negócio pesada em JSX |
| Regras / parse / limites | `lib/` | Duplicar em várias pages |
| Queries Supabase repetidas | `lib/data/*.js` | Mesmo `.select()` 5× |
| Hook multi-tela | `hooks/` | Estado complexo só em um componente filho |
| SQL / RLS | `supabase/*.sql` | DDL só no Dashboard sem arquivo no repo |
| Testes unitários | `lib/*.test.js` | — |
| Docs | `docs/` | Duplicar guias na raiz |

Detalhe de pastas: [`project-structure.md`](./project-structure.md).

---

## Estilo e UI

- **Tailwind CSS 4**, mobile-first (`max-w-md` centralizado no desktop).
- Paleta principal: fundo `#f0f4f3`, primário `#1a4a3a` — preferir tokens em `app/globals.css` para código novo.
- Dark mode global **desligado** até tema completo (overrides comentados em `globals.css`).
- Imagens: **`RemotePhoto`** para thumbs/heróis CDN; **`next/image`** com `sizes` + `quality={60}` em cards de lista; `minimumCacheTTL` em `next.config.mjs`.
- Upload avatar: **`POST /api/perfil/avatar`** + `lib/avatarStorage.js`; admin/entity: **`lib/imageCompress.js`** antes de Storage.
- Bottom sheets: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` com `useId()`.
- Erros de página: `role="alert"`.

---

## API (Route Handlers)

Fluxo padrão para rotas protegidas com IA:

1. `try/catch` no handler.
2. Validar body (`trim`, tipos, arrays).
3. `getAuthUser()` se sessão obrigatória.
4. `checkIaRateLimit(request, user?.id)` em rotas Claude.
5. `checkBuscaAccess` / `checkRoteiroAccess` com `{ increment: false }` para falha rápida; **`reserve*IaUsage`** (`increment: true`) imediatamente antes da Claude; **`release*IaUsage`** se a Claude falhar.
6. Resposta `NextResponse.json` com HTTP e `code` estáveis (`LOGIN_REQUIRED`, `LIMIT_REACHED`, `RATE_LIMITED`).
7. Nunca vazar stack trace ao cliente.

Documentação de contratos: [`api.md`](./api.md).

---

## Supabase e banco

- **RLS** em toda tabela nova exposta ao PostgREST.
- **`lugares.id` é `bigint`** — FKs e RPCs alinhados.
- Lugares públicos: `status = 'ativo'`.
- Avaliações públicas: `status = 'aprovada'`.
- Uso IA: incremento **somente** via RPC `increment_*_ia`.
- Não atualizar `role`, `premium_ativo` ou contadores IA do browser.
- Nova migration: arquivo `supabase/nome_descritivo.sql` + entrada em [`migrations.md`](./migrations.md#manifest).

---

## Segurança

| Regra | Detalhe |
|-------|---------|
| Segredos | Sem prefixo `NEXT_PUBLIC_` para Anthropic e service role |
| Redirect OAuth | `safeRedirectPath()` para `?next=` |
| Service role | Apenas handlers server isolados |
| Admin | RLS + layout server |
| Upload fotos | Policies admin em `storage_admin_fotos.sql` |

Checklist: [`../SECURITY_CHECKLIST.md`](../SECURITY_CHECKLIST.md).

---

## Git e PRs

- Branch: `feat/`, `fix/`, `docs/` + descrição curta.
- Commits: imperativo, pt ou en (`feat:`, `fix:`, `docs:`).
- Antes do PR: `npm run lint`, `npm test`, `npm run build`.
- PR: screenshots em viewport ~390px para mudanças de UI.
- Não commitar `.env.local` nem secrets.

---

## Testes

```bash
npm test              # lib/*.test.js (node --test)
npm run test:e2e      # Playwright smoke — e2e/smoke.spec.js (10 casos)
```

**E2E local (primeira vez):** `npx playwright install chromium`  
**CI:** lint → `npm test` → build → Playwright (ver [`deployment.md`](./deployment.md)).

Alterou `lib/horarios.js` → rodar `lib/horarios.test.js`.  
Alterou `safeRedirectPath`, `premium`, `buscaRetrieval` → rodar testes correspondentes.  
Checklist manual (Capacitor, premium, admin): [`TESTING-CHECKLIST.md`](./TESTING-CHECKLIST.md).

---

## Documentação ao entregar feature

| Mudança | Atualizar |
|---------|-----------|
| Endpoint novo | `docs/api.md` |
| Tabela / policy | `docs/database.md`, `supabase/*.sql`, `docs/migrations.md` |
| Comportamento produto | `docs/features.md`, `docs/CHANGELOG.md` |
| Decisão técnica relevante | `docs/architectural-decisions.md` |
| Variável nova | `.env.example`, `docs/environment.md` |

---

## Catálogo de módulos reutilizáveis

Antes de criar utilitário paralelo, verificar:

| Módulo | Uso |
|--------|-----|
| `premium.js` / `premiumServer.js` | Cotas e auth server |
| `userMessages.js` | Copy e erros API |
| `busca.js` / `buscaRetrieval.js` | Busca IA |
| `horarios.js` | Aberto/fechado |
| `localizacao.js` | Distância |
| `lugarDetalhe.js` | Tipo de lugar e CTAs |
| `destaques.js` | Parceiros vigentes |
| `homeContext.js` | Hero e chips home |
| `roteiroParse.js` | Timeline roteiro |
| `logs.js` | Analytics |
| `adminRoles.js` | `canAccessAdmin` |
| `safeRedirectPath.js` | Anti open-redirect |
| `apiCacheHeaders.js` | Cache GET lugares |
| `usePremiumUsage.js` | Estado premium no cliente |

Lista ampliada: [`../ENGINEERING_GUIDE.md`](../ENGINEERING_GUIDE.md) (atalho; conteúdo canônico permanece aqui e em `docs/`).

---

## Referências

- [`contributing.md`](./contributing.md)
- [`onboarding.md`](./onboarding.md)
- [`architectural-decisions.md`](./architectural-decisions.md)
