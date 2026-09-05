# Fluxo de dados

**[English](./en/data-flows.md)**

Como os dados trafegam entre **browser**, **Next.js (Vercel)** e **Supabase**. Diagramas detalhados também em [`architecture.md`](./architecture.md#data-flow).

---

## Princípio central

| Tipo de operação | Caminho preferido |
|------------------|-------------------|
| Leitura pública do catálogo | Browser → Supabase (RLS) **ou** `GET /api/lugares` (cache CDN) |
| Escrita do usuário (favorito, avaliação) | Browser → Supabase (RLS) |
| IA, cotas, service role pontual | Browser → `app/api/*` → Supabase / Anthropic |
| Admin CMS | Browser → Supabase (RLS admin) + Storage |
| Analytics | Browser → `logs` via `lib/logs.js` |

**Regra:** segredos (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) **nunca** no cliente.

---

## Mapa de fluxos

```mermaid
flowchart LR
  subgraph Cliente
    P[Pages / Components]
    LS[(localStorage)]
  end
  subgraph Vercel
    API[app/api/*]
    MW[middleware.js]
  end
  subgraph Supabase
    PG[(PostgreSQL)]
    ST[Storage]
    AUTH[Auth]
  end
  subgraph Externos
    AI[Anthropic]
    METEO[Open-Meteo]
  end

  P -->|leitura RLS| PG
  P -->|sessão| AUTH
  P -->|opcional cache| API
  API --> PG
  API --> AI
  P --> METEO
  P --> LS
  MW --> AUTH
  P -->|upload admin| ST
```

---

## 1. Leitura pública do catálogo

### Caminho A — Supabase direto (maioria das telas)

```mermaid
sequenceDiagram
  participant UI as Client Component
  participant SB as Supabase
  participant RLS as RLS

  UI->>SB: .from("lugares").eq("status","ativo")
  SB->>RLS: política SELECT
  RLS-->>UI: linhas permitidas
```

**Onde:** home (fetches em `app/page.js`), categorias, detalhe, favoritos.

**Otimizações:**

- Cards não fazem N+1 de avaliações — usam `rating_medio` / `media_avaliacoes` na linha do lugar.
- `/categorias`: uma query de contagem por categoria, agregação em JS.

### Caminho B — API com cache (`GET /api/lugares`)

```mermaid
sequenceDiagram
  participant UI as fetchLugaresApi
  participant API as GET /api/lugares
  participant SB as Supabase anon server

  UI->>API: ?mode=populares | destaques | ids=...
  API->>SB: queryLugares* / RPC populares
  API-->>UI: JSON + Cache-Control
```

**Query params:** `mode=populares`, `mode=parceiros`, `mode=curadoria`, `ids=1,2,3`, `limit`, `categoria`.

Headers: `lib/apiCacheHeaders.js` (CDN-friendly).

---

## 2. Busca por linguagem natural (IA)

```mermaid
sequenceDiagram
  participant UI as SmartSearch
  participant API as POST /api/buscar
  participant PS as premiumServer
  participant SB as Supabase
  participant RPC as increment_busca_ia
  participant AI as Claude

  UI->>API: { query, filtroStatus }
  API->>PS: getAuthUser + checkBuscaAccess (read)
  API->>SB: lugares ativos + joins
  API->>API: buscaRetrieval + resumo
  API->>PS: reserveBuscaIaUsage
  PS->>RPC: increment atômico
  API->>AI: ranking IDs
  alt Claude OK
    AI-->>API: JSON ids
    API-->>UI: { lugares, usage }
  else Claude erro
    API->>PS: releaseBuscaIaUsage
    PS->>RPC: decrement
    API-->>UI: 500 + usage estornado
  end
```

**Pré-filtro:** `lib/buscaRetrieval.js` reduz tokens antes do Claude.

**Pós-filtro:** `lib/busca.js` → aberto/fechado (`filtroStatus`).

**Cliente:** distância dinâmica com GPS (`lib/localizacao.js`).

---

## 3. Roteiro IA

```mermaid
sequenceDiagram
  participant UI as /rotas
  participant API as POST /api/roteiro
  participant PS as premiumServer
  participant AI as Claude

  UI->>API: dias, perfil, interesses
  API->>PS: checkRoteiroAccess (read) + reserveRoteiroIaUsage
  API->>AI: markdown estruturado
  alt Claude OK
    API-->>UI: conteudo + lugaresCatalog + usage
  else Claude erro
    API->>PS: releaseRoteiroIaUsage
  end
  UI->>UI: roteiroParse → timeline
  opt Salvar
    UI->>API: POST /api/roteiro/salvar
    API->>SB: insert roteiros
  end
```

Exclusão: `DELETE /api/roteiro/[id]` (dono da linha, RLS).

---

## 4. Escritas do usuário autenticado

| Entidade | Operação | Tabela | Estado inicial |
|----------|----------|--------|----------------|
| Favorito | insert/delete | `favoritos` | — |
| Avaliação | insert | `avaliacoes` | `pendente` |
| Roteiro salvo | insert | `roteiros` | — |
| Perfil | update | `perfis` | — |
| Feedback | insert | `feedback` | guest pode usar service role no servidor |

Após avaliação:

```text
insert avaliacoes → POST /api/avaliacoes/analisar → sugestao_ia para fila admin
```

Moderação humana em `/admin/avaliacoes` → `aprovada` / `rejeitada`.

---

## 5. Detalhe do lugar

```mermaid
flowchart TB
  A["/lugares/[id]"] --> B[useLugarDetalhe / queries]
  B --> C[lugares]
  B --> D[localizacoes]
  B --> E[lugares_tags → tags]
  B --> F[avaliacoes aprovadas]
  B --> G[fotos_lugar / jsonb fotos]
  C --> H[lugarDetalhe.js]
  D --> I[distância + mapa estático]
  H --> J[Render UI]
```

Visitas recentes: `lib/lugaresVisitados.js` → `localStorage` (busca).

Clima outdoor: `lib/clima.js` → Open-Meteo (sem API key).

---

## 6. Admin — CMS e Storage

```mermaid
flowchart LR
  Form[Admin form] --> SB[Supabase client]
  SB --> RLS{RLS admin/dev}
  RLS --> T[(lugares / rotas / destaques)]
  Form --> UP[storageUpload + imageCompress]
  UP --> BKT[lugares-fotos / rotas-fotos]
```

Relatórios PDF/WhatsApp: `lib/adminRelatorios.js`, `lib/qrPdf.js`.

QR público: `GET /q/[slug]` → log `escaneou_qr` (service role) → redirect detalhe.

---

## 7. Premium e uso IA

```mermaid
sequenceDiagram
  participant UI as usePremiumUsage
  participant LS as localStorage
  participant API as GET /api/uso-premium
  participant SB as perfis

  UI->>LS: hydrate mesmo dia
  UI->>API: refresh
  API->>SB: alignPerfilUsageToDay
  API-->>UI: usage (fonte da verdade)
```

Após `POST /api/buscar` ou roteiro: UI atualiza `usage` da resposta (`setUsage`).

---

## 8. Observabilidade de produto

| Evento | Destino |
|--------|---------|
| `login`, `logout`, `favorito`, `ir_agora`, `visualizou_lugar`, `acessou_app`, `escaneou_qr` | Tabela `logs` |
| Erros de UI | `lib/observability.js` → console (Sentry opcional) |
| Deploy smoke | `GET /api/health` |

Admin consulta: `/admin/logs`.

Retenção: `supabase/logs_retention.sql` (quando aplicado).

---

## 9. Dados que não passam pelo backend Next

| Dado | Origem |
|------|--------|
| Clima header/hero | Open-Meteo direto do browser |
| Navegação Maps/Waze/Apple | Deep links (`openRoute`) |
| Preferência app mapas | `localStorage` + opcional `perfis.maps_preferido` |
| Onboarding visto | `localStorage` |

---

## Anti-padrões (evitar)

- Buscar `ANTHROPIC_API_KEY` no Client Component.
- Incrementar `buscas_ia` com `update` direto no browser.
- Confiar só em `useAdminAuth` sem RLS nas escritas.
- Tratar `lugares.id` como UUID (produção usa **`bigint`**).

---

## Referências

- [`api.md`](./api.md)
- [`database.md`](./database.md)
- [`DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md)
