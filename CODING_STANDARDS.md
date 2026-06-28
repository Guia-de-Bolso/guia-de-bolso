# Coding Standards — Guia de Bolso

Padrões **obrigatórios** de implementação. Visão de arquitetura e fluxos: **[ENGINEERING_GUIDE.md](./ENGINEERING_GUIDE.md)**.

---

## 1. Linguagem e ferramentas

| Regra | Padrão |
|-------|--------|
| Linguagem | JavaScript (ES modules). **Sem TypeScript.** |
| Runtime | Node.js 20+ |
| Formatação | Seguir estilo existente do arquivo; 2 espaços de indentação |
| Lint | `npm run lint` — `eslint-config-next` + avisos em hooks legados (corrigir incrementalmente) |
| Comentários | Português ou inglês **consistente dentro do mesmo arquivo** |
| Copy de UI | **pt-BR** — tom direto, sem jargão técnico para o usuário |
| JSDoc | Funções exportadas em `lib/` e Route Handlers: `@param`, `@returns` quando não óbvio |

---

## 2. Convenções de nomenclatura

### Arquivos

| Tipo | Convenção | Exemplo |
|------|-----------|---------|
| Componente React | PascalCase | `PlaceCard.js`, `AdminShell.js` |
| Hook | camelCase com prefixo `use` | `useLugarDetalhe.js` |
| Módulo lib | camelCase | `premiumServer.js`, `lugaresQuery.js` |
| Teste | mesmo nome + `.test.js` | `horarios.test.js` |
| Tokens de estilo | `{domínio}Tokens.js` | `homeTokens.js` |
| Route Handler | `route.js` dentro da pasta da rota | `app/api/buscar/route.js` |
| SQL migration | snake_case descritivo | `lugares_admin_write.sql` |
| Config admin | camelCase | `adminNavConfig.js` |

### Código

| Elemento | Convenção | Exemplo |
|----------|-----------|---------|
| Componente | PascalCase | `function SmartSearch()` |
| Função / hook | camelCase | `getAuthUser`, `usePremiumUsage` |
| Constante de config | UPPER_SNAKE ou objeto frozen | `LIMITS`, `FILTRO_STATUS_BUSCA` |
| Constante de UI exportada | UPPER_SNAKE ou PascalCase export | `HOME_CHIP_CLASS` |
| Variável booleana | prefixo `is`, `has`, `show`, `eh` | `isFavorito`, `ehParceiro`, `showHorarios` |
| Handler de evento | prefixo `handle` | `handleFavoritar` |
| Estado React | substantivo claro | `loading`, `fetchError`, `usage` |
| Props | camelCase | `showReportHint`, `headerAction` |

### Banco e API (alinhado ao schema)

| Elemento | Convenção |
|----------|-----------|
| Tabelas | plural snake_case: `lugares`, `fotos_lugar`, `etapas_rota` |
| Colunas | snake_case: `imagem_url`, `premium_ativo`, `uso_ia_mes` |
| Status enum-like | snake_case em string: `em_analise`, `aprovada` |
| Códigos de erro API | UPPER_SNAKE: `LOGIN_REQUIRED`, `LIMIT_REACHED` |
| Chaves `localStorage` | prefixo `guia_` ou nome legado documentado: `guia_premium_usage_{userId}` |

### Rotas URL

- Públicas: português ou termo de produto — `/lugares/[id]`, `/categorias`, `/rotas`.
- Admin: `/admin/locais` (canônico); aliases legados (`/admin/lugares`) só reexportam.
- API: inglês técnico — `/api/buscar`, `/api/uso-premium`.

---

## 3. Estrutura de um módulo `lib/`

```javascript
/**
 * Descrição do módulo em uma linha.
 * @module lib/nomeModulo
 */

import { createClient } from "@/lib/supabase/server";

/** Descrição da constante. */
export const MIN_TAGS = 1;

/**
 * Descrição do comportamento.
 * @param {string} id
 * @returns {Promise<object|null>}
 */
export async function fetchAlgo(id) {
  // ...
}
```

- Imports externos primeiro, depois `@/lib/*`, depois relativos.
- Exportar só o que é usado fora; funções internas sem `export`.
- Side effects de rede apenas em funções `async` nomeadas, não no top-level do módulo.

---

## 4. Padrões de componentes

### Template mínimo (Client Component)

```javascript
"use client";

import { useState } from "react";

/**
 * Uma linha descrevendo o componente.
 * @param {object} props
 * @param {string} props.titulo
 */
export default function MeuComponente({ titulo }) {
  const [aberto, setAberto] = useState(false);

  return (
    <section className="..." aria-label={titulo}>
      {/* ... */}
    </section>
  );
}
```

### Regras

1. **Um componente principal por arquivo** (`export default`). Exceção: ícones minúsculos no mesmo arquivo do pai admin.
2. **Props** — desestruturar na assinatura; evitar `props.algo` repetido.
3. **Classes Tailwind** — preferir tokens do domínio (`HOME_SURFACE_CLASS`) para repetidos; hex de marca `#1a4a3a`, fundo `#f0f4f3` quando não houver token.
4. **Layout** — `max-w-md` ou `max-w-[390px]` centralizado em páginas consumer.
5. **Listas** — `key` estável (`id` do lugar, não índice) salvo listas estáticas sem reorder.
6. **Modais** — `useId()` para `aria-labelledby`; fechar com overlay + botão explícito.
7. **Não** importar `premiumServer`, service role nem `ANTHROPIC_*` em componentes.

### Quando extrair

| Sinal | Ação |
|-------|------|
| Page > ~250 linhas de lógica | `hooks/use*.js` |
| Mesmo bloco JSX em 2 layouts | componente em `shared/` ou subpasta |
| 3+ classes repetidas | arquivo `*Tokens.js` |
| Query Supabase duplicada | `lib/data/*Queries.js` |

---

## 5. Padrões de API (Route Handlers)

### Template

```javascript
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/premiumServer";
import { buildApiErrorBody } from "@/lib/userMessages";
import { checkIaRateLimit } from "@/lib/iaRateLimit";

/**
 * Descrição do endpoint.
 * @param {import("next/server").NextRequest} request
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const campo = typeof body?.campo === "string" ? body.campo.trim() : "";

    if (!campo) {
      return NextResponse.json(
        buildApiErrorBody("VALIDATION", { error: "Campo obrigatório." }),
        { status: 400 }
      );
    }

    const { user } = await getAuthUser();
    const rate = checkIaRateLimit(request, user?.id);
    if (!rate.allowed) {
      return NextResponse.json(
        buildApiErrorBody("RATE_LIMIT"),
        {
          status: 429,
          headers: rate.retryAfterSec
            ? { "Retry-After": String(rate.retryAfterSec) }
            : undefined,
        }
      );
    }

    // checkBuscaAccess / checkRoteiroAccess quando aplicável

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/exemplo:", err);
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
```

### Checklist obrigatório

- [ ] Método HTTP exportado (`GET`, `POST`, `DELETE`, …) corresponde ao contrato em `docs/api.md`
- [ ] `try/catch` no handler
- [ ] Validação de input antes de chamadas pagas (Claude) ou RPC
- [ ] Respostas de erro com `{ error, code? }` — preferir `buildApiErrorBody`
- [ ] Status HTTP alinhado ao `code` (401/403/429/500)
- [ ] `console.error` com prefixo da rota; sem stack trace no JSON de resposta
- [ ] IA: `checkIaRateLimit` + `checkBuscaAccess` / `checkRoteiroAccess`
- [ ] Anthropic: incluir header `anthropic-beta: prompt-caching-2024-07-31` e usar `cache_control: { type: "ephemeral" }` nos blocos estáticos do prompt
- [ ] IA observability: medir latência e registrar sucesso/erro com `logIA` nas rotas que chamam Anthropic (`feature` padronizada: `busca`, `roteiro`, `moderacao`)
- [ ] Busca vazia: early return `{ lugares: [] }` **sem** consumir cota (padrão `/api/buscar`)

### GET público

- Filtrar sempre `status = 'ativo'` (ou equivalente documentado).
- Aplicar `lugaresApiCacheHeaders()` quando for catálogo cacheável.

---

## 6. Padrões de tratamento de erros

### Na UI (fetch)

```javascript
import { mapApiErrorResponse, getNetworkErrorMessage } from "@/lib/userMessages";

let res;
try {
  res = await fetch("/api/buscar", { method: "POST", /* ... */ });
} catch {
  setErro(getNetworkErrorMessage());
  return;
}

const data = await res.json().catch(() => ({}));
if (!res.ok) {
  const { message } = mapApiErrorResponse(data, res.status);
  setErro(message);
  if (data?.code === "LOGIN_REQUIRED") openLoginModal();
  return;
}
```

### Códigos que a UI deve tratar

| `code` | Ação típica |
|--------|-------------|
| `LOGIN_REQUIRED` | Abrir `LoginModal` |
| `LIMIT_REACHED` | `PremiumPaywallSheet` + `DailyLimitCountdown` |
| `RATE_LIMITED` | Mensagem de aguarde |
| `UNAUTHORIZED` | Redirecionar ou renovar sessão |

### Boundaries

- Erros de render: `app/error.js` chama `reportError(error, { boundary: "app/error" })`.
- Mensagem genérica ao usuário; detalhes técnicos só em `reportContext` do feedback.

### Anti-padrões

- `alert()` para erros de produção.
- Exibir `error.message` cru do Supabase ao usuário.
- `catch` vazio sem fallback de UI.
- Fail-open em premium (permitir IA quando RPC falha) — corrigir, não replicar.

---

## 7. Supabase no código

### Cliente correto

```javascript
// Browser (Client Component / hook)
import { createClient } from "@/lib/supabase";

// Server (Route Handler, Server Component, layout)
import { createClient } from "@/lib/supabase/server";

// Anon sem sessão (catálogo em API)
import { supabase } from "@/lib/supabase";
```

### Queries

- `.select()` explícito — evitar `*` em telas grandes quando já há lista de colunas conhecidas.
- `.eq("status", "ativo")` em listagens públicas.
- `.maybeSingle()` quando 0 ou 1 row; `.single()` só se garantido existir.
- Joins: `localizacoes(*)`, `lugares_tags(tags(*))` — padrão já usado em busca e detalhe.
- Tratar `{ data, error }` — em falha, log + estado de erro na UI (`fetchError`).

### Writes sensíveis

- Favoritos, avaliações: cliente com sessão + RLS.
- Incremento IA: **nunca** `update` manual em `buscas_ia` no client — usar fluxo `premiumServer` / RPC.

---

## 8. Convenções SQL (`supabase/`)

Cada arquivo novo deve começar com:

```sql
-- Objetivo: uma linha.
-- Depende de: rotas_policies.sql (is_admin_user), etc.
-- Aplicar em: Supabase SQL Editor (ordem em docs/migrations.md).
```

| Regra | Detalhe |
|-------|---------|
| Idempotência | Preferir `DROP POLICY IF EXISTS` + `CREATE POLICY` quando refazer policy |
| Funções helper | `SECURITY DEFINER` + `SET search_path = public` |
| Nomes de policy | Frase clara: `"Admin atualiza lugares"` |
| Índices | `supabase/db_indexes.sql` ou arquivo dedicado com comentário de query alvo |
| Drift | Se Dashboard divergir do repo, exportar e alinhar antes de escalar tráfego |

---

## 9. Segurança no código (checklist do desenvolvedor)

- [ ] Nenhum segredo em diff ou commit
- [ ] `NEXT_PUBLIC_*` só para chaves públicas (Supabase anon, Maps)
- [ ] `safeRedirectPath` em qualquer redirect com query param
- [ ] Service role só em server e com motivo documentado
- [ ] Input de usuário em prompts IA tratado como não confiável (trim, tamanho máximo)
- [ ] Nova tabela: RLS + policy no repo + entrada em `SECURITY_CHECKLIST.md` se sensível
- [ ] Admin: testar com usuário `usuario` — deve falhar no layout server e no RLS

---

## 10. Testes

| Tipo | Onde | Quando obrigatório |
|------|------|-------------------|
| Unitário | `lib/*.test.js` | Lógica pura (horários, premium, redirect, parse) |
| E2E smoke | `e2e/smoke.spec.js` | Fluxos críticos de deploy (CI após `build`, 10 casos Chromium) |
| Manual | `docs/TESTING-CHECKLIST.md` | UI, auth, premium 1→2→3→paywall, Capacitor |

**CI** (`.github/workflows/ci.yml`): `lint` → `npm test` → `build` → `playwright install` → `test:e2e`.

Executar:

```bash
node --test lib/horarios.test.js   # arquivo específico
npm test                           # todos lib/*.test.js
npm run test:e2e                   # smoke Playwright (sobe dev local ou start no CI)
npx playwright install chromium    # primeira vez local
```

Novos módulos com regras de negócio não triviais devem incluir `.test.js` no mesmo PR.  
Bugs corrigidos: preferir teste de regressão (unit ou smoke) no mesmo PR.

---

## 11. Commits e PRs

- Mensagens imperativas: `feat:`, `fix:`, `docs:`, `chore:` (PT ou EN).
- Um assunto principal por PR.
- `npm run build` e `npm run lint` antes de abrir PR.
- Screenshots em mudanças de UI (viewport ~390px).

Detalhes: [docs/contributing.md](./docs/contributing.md).

---

## 12. Anti-padrões (proibidos)

| Anti-padrão | Alternativa |
|-------------|-------------|
| Lógica de negócio longa em `page.js` | `lib/` + hook |
| Novo Context global para auth | Padrão Supabase + hook local |
| `fetch` Claude no browser | `app/api/*` |
| Policy `USING (true)` em tabela com PII | `is_admin_or_dev()` |
| UUID para `lugar_id` | `bigint` / `String(id)` consistente |
| Duplicar strings de erro na UI | `USER_MESSAGES` / `mapApiErrorResponse` |
| Ignorar `error` do Supabase | Estado de erro + log |
| Componente admin sem `AdminShell` | Wrapper padrão |
| CSS modules novos sem necessidade | Tailwind + tokens existentes |

---

## 13. Referência rápida de arquivos modelo

| Preciso de… | Copiar padrão de |
|-------------|------------------|
| API com IA + premium | `app/api/buscar/route.js` |
| OAuth callback seguro | `app/auth/callback/route.js` |
| Guard admin server | `app/admin/layout.js` |
| Hook de página complexa | `hooks/useLugarDetalhe.js` |
| Queries de detalhe | `lib/data/lugarDetalheQueries.js` |
| Mensagens e erros API | `lib/userMessages.js` |
| Erro com report | `components/UserErrorAlert.js` |
| Error boundary | `app/error.js` |

---

Atualize este documento quando um padrão novo se tornar obrigatório para todo o time.
