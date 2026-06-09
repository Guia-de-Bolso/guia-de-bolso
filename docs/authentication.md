# Fluxo de autenticação

Autenticação e autorização no **Guia de Bolso**. Implementação delegada ao **Supabase Auth**; a aplicação não emite JWT próprio.

Visão de sistema: [`architecture.md`](./architecture.md#authentication-flow).

---

## Modelo de sessão

| Aspecto | Detalhe |
|---------|---------|
| Transporte | Cookies HTTP gerenciados por `@supabase/ssr` |
| Cliente browser | `lib/supabase/client.js` → `createBrowserClient` |
| Server (Route Handlers, layouts) | `lib/supabase/server.js` → `createServerClient` |
| Refresh | `middleware.js` chama `auth.getUser()` em cada request elegível |
| Expiração | Cookie persistente compartilhado em `lib/supabase/cookieOptions.js` + refresh automático via middleware |

**Não há** Context global React de auth — cada página/hook chama `getUser()` ou `onAuthStateChange` conforme necessário. A home valida o usuário com `getUser()` no primeiro carregamento para renovar tokens vencidos antes de decidir que o visitante está deslogado.

---

## Provedores habilitados

| Provedor | UI | Configuração |
|----------|-----|--------------|
| **Google OAuth** | `AuthFlow` / `/login` | Supabase Dashboard → Authentication → Google |
| **SMS OTP** | `AuthFlow` | Supabase + **Twilio** (OTP 6 dígitos, `+55`) |

Apple Sign In e WhatsApp Auth estão no roadmap (dependências externas).

---

## Fluxo Google OAuth

```mermaid
sequenceDiagram
  participant U as Usuário
  participant UI as AuthFlow
  participant SB as Supabase Auth
  participant G as Google
  participant CB as GET /auth/callback
  participant App as App

  U->>UI: Continuar com Google
  UI->>SB: signInWithOAuth({ provider: google })
  SB->>G: Consentimento
  G-->>SB: authorization code
  SB-->>UI: Redirect /auth/callback?code=...
  UI->>CB: Browser segue redirect
  CB->>SB: exchangeCodeForSession(code)
  CB->>CB: registrarLog("login")
  CB-->>App: Redirect / ou ?next= seguro
```

**Arquivo:** `app/auth/callback/route.js`

- Usa `safeRedirectPath()` para `?next=` ([`lib/safeRedirectPath.js`](../lib/safeRedirectPath.js)) — evita open redirect.
- Registra evento em `logs` após sessão válida.

### URLs obrigatórias (Supabase)

| Ambiente | Site URL | Redirect URL |
|----------|----------|--------------|
| Local | `http://localhost:3000` | `http://localhost:3000/auth/callback` |
| Produção | `https://guiadebolso.app` | `.../auth/callback` |
| Preview Vercel | URL do preview | `https://<preview>/auth/callback` |

Detalhes: [`environment.md`](./environment.md), [`deployment.md`](./deployment.md#1-auth-url-configuration).

---

## Fluxo SMS OTP

```mermaid
sequenceDiagram
  participant U as Usuário
  participant UI as AuthFlow
  participant SB as Supabase Auth
  participant T as Twilio

  U->>UI: Telefone (11 dígitos BR)
  UI->>SB: signInWithOtp({ phone: +55... })
  SB->>T: Envia SMS
  T-->>U: Código 6 dígitos
  U->>UI: Informa código
  UI->>SB: verifyOtp({ phone, token })
  SB-->>UI: Sessão criada
  UI-->>U: router.push("/")
```

- Validação de formato no cliente (DDD + número).
- Reenvio com cooldown no UI (não substitui rate limit do Supabase).

---

## Perfil de aplicação (`perfis`)

Após `auth.users` criado:

| Campo | Uso |
|-------|-----|
| `id` | Igual a `auth.users.id` (UUID) |
| `nome`, `foto_url` | Perfil público |
| `role` | `usuario`, `admin`, `dev`, `estabelecimento` |
| `premium_ativo`, `premium_ate` | Guia Premium |
| `buscas_ia`, `roteiros_ia`, `uso_ia_mes` | Cotas IA (dia `YYYY-MM-DD` SP) |
| `maps_preferido` | App de navegação preferido |

Bootstrap: `lib/ensurePerfil.js` (primeiro acesso). Confirme triggers/policies no projeto Supabase.

---

## Autorização (após login)

Autenticação ≠ autorização. Camadas:

```mermaid
flowchart TB
  subgraph Camadas
    RLS[PostgreSQL RLS]
    API[Route Handlers /api/*]
    UI[LoginModal + guards UI]
    ADMIN[app/admin/layout.js]
  end
  User[Usuário] --> UI
  UI --> API
  API --> RLS
  ADMIN --> RLS
```

| Recurso | Regra |
|---------|--------|
| Ver lugares ativos | Público (RLS + `status = 'ativo'`) |
| Favoritos, avaliar | Login + RLS `auth.uid()` |
| Busca IA, roteiro IA | Login + cotas ([`api.md`](./api.md)) |
| Reviews públicas | Somente `status = 'aprovada'` |
| Admin CMS | `role` ∈ `admin`, `dev` (`lib/adminRoles.js` → `canAccessAdmin`) |

### Guard admin (servidor + cliente)

1. **Servidor:** `app/admin/layout.js` — sem sessão → `/login?next=/admin`; sem role admin → `/?admin=denied`.
2. **Cliente:** `AdminShell` + `useAdminAuth` — UX e redirect rápido.

**Nunca** confiar só no cliente para operações sensíveis — RLS nas tabelas de escrita.

### Premium (uso IA)

| Tier | Buscas IA/dia | Roteiros IA/dia |
|------|---------------|-----------------|
| Gratuito (logado) | 5 | 2 |
| Premium | Ilimitado | Ilimitado |

Reset: meia-noite **America/Sao_Paulo**. Incremento atômico: RPC `increment_busca_ia`, `increment_roteiro_ia`.

Cliente: `usePremiumUsage` + `GET /api/uso-premium` (servidor vence sobre `localStorage`).

Códigos API: `LOGIN_REQUIRED` (401), `LIMIT_REACHED` (403), `RATE_LIMITED` (429).

---

## Conteúdo restrito sem login

`LoginModal` (bottom sheet) em:

- Favoritar
- Enviar avaliação
- Busca IA e geração de roteiro IA

Rotas curadas (`/rotas`, detalhe de rota) permanecem **públicas** para leitura.

---

## Logout e exclusão de conta

- Logout: `supabase.auth.signOut()` na página de perfil (com confirmação).
- Exclusão de conta: fluxo na UI de perfil — ver implementação atual e policies Supabase antes de alterar.

Eventos analytics: `lib/logs.js` → tabela `logs`.

---

## Checklist de debug auth

| Sintoma | Verificar |
|---------|-----------|
| Loop no login | Redirect URLs no Supabase |
| Sessão some no refresh | `middleware.js` matcher; cookies bloqueados |
| Admin nega acesso | `perfis.role`, layout server |
| IA sempre 401 | Cookies em domínio preview vs produção |
| Cota não zera | Fuso `America/Sao_Paulo`, RPC e `uso_ia_mes` |

---

## Referências

- [`data-flows.md`](./data-flows.md) — writes autenticados
- [`security-rls.md`](./security-rls.md) — políticas RLS
- [`api.md`](./api.md) — endpoints que exigem sessão
