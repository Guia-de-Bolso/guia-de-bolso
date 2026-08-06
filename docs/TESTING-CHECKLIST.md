# Guia de Bolso — Checklist de testes manuais

Checklist para QA manual (celular ~390px, tablet e desktop). Complementa [Features](./features.md) e os **testes automatizados** abaixo.

## Testes automatizados (CI e local)

Pirâmide de QA do projeto:

| Camada | Comando | Onde | CI |
|--------|---------|------|-----|
| Unitário | `npm test` | `lib/*.test.js` (~40 arquivos, `node --test`) | Sim, antes do build |
| E2E smoke | `npm run test:e2e` | `e2e/smoke.spec.js`, `e2e/auth-gates.spec.js` (17 casos, Playwright + Chromium) | Sim, após `npm run build` |
| Manual | checklist abaixo | Capacitor, IAP, premium, admin logado, visual | Não |

**Primeira vez local (E2E):** `npx playwright install chromium`

**CI:** [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — `lint` → `npm test` → `build` → `playwright install` → `test:e2e` (servidor `npm run start`).

### Casos cobertos pelo smoke E2E

| # | Caso | Esperado |
|---|------|----------|
| 1 | `GET /api/health` | `{ ok: true, service: "guia-de-bolso" }` |
| 2 | Home (onboarding pulado via `localStorage`) | Busca IA + bottom nav |
| 3 | `/login` | Hero + Google + “Continuar sem login” |
| 4 | `/categorias` | Heading Explorar + categoria Natureza |
| 5 | `/atrativos` | Header da página |
| 6 | `/favoritos` (guest) | Gate “Faça login para ver seus favoritos” |
| 7 | Favoritos → Fazer login | Modal com auth; subtítulo menciona offline |
| 8 | `/perfil` (guest) | Benefícios + Google |
| 9 | Bottom nav Início → Explorar | Navega para `/categorias` |

### Casos cobertos por `e2e/auth-gates.spec.js`

| # | Caso | Esperado |
|---|------|----------|
| 1 | `POST /api/buscar` (guest) | 401, `code: LOGIN_REQUIRED` |
| 2 | `POST /api/roteiro` (guest) | 401, `code: LOGIN_REQUIRED` |
| 3 | `POST /api/roteiro/salvar` (guest) | 401, `code: LOGIN_REQUIRED` |
| 4 | `DELETE /api/conta` (guest) | 401, `code: UNAUTHORIZED` |
| 5 | `GET /api/cron/lugares-purge` (sem secret) | 401, `error: Unauthorized` |
| 6 | Home → busca IA (guest) | Modal login com copy de busca IA |
| 7 | Home → chip “Lugares calmos” (guest) | Modal login para busca IA |
| 8 | `/admin` (guest) | Redirect `/login` com `next=/admin` |

Regras de código e quando adicionar testes: [`CODING_STANDARDS.md`](../CODING_STANDARDS.md) §10, [`conventions.md`](./conventions.md).

## Checklist interativo (recomendado)

Use a ferramenta com **155 casos de teste**, passo a passo por dispositivo, resultado esperado, avisos e botões **Passou / Falhou / Resetar**:

**[Abrir checklist interativo](/checklist-testes.html)**  
(produção: `https://guiadebolso.app/checklist-testes.html` · local: `http://localhost:3000/checklist-testes.html`)

- Contador global no topo (total, passou, falhou, pendente) e barra de progresso
- Estado salvo no navegador (`localStorage`, chave `guia_checklist_v1`)
- **Exportar resultado** gera tabela por área + lista de falhas + JSON (cole em Bloqueadores/Observações abaixo)
- Dados editáveis: `public/checklist-testes.data.json` (gerar com `node scripts/build-checklist-data.mjs`)

---

## Referência rápida — fluxos críticos

| Fluxo | Entrada principal | Restrição guest |
|-------|-------------------|-----------------|
| Login | `/login`, `LoginModal`, Perfil; Capacitor iOS also Apple + native Google | — |
| Cadastro | Primeiro login (Google/SMS/Apple iOS) + `/perfil/editar` | — |
| Busca IA | Home / Explorar `SmartSearchExperience`, `/?busca=1`, `/?q=`; mic = voz nativa (Capacitor) | Login + limite 10/dia (free) |
| Relatórios admin | `/admin/relatorios` | Admin/dev; estabelecimento ativo (exclui Natureza/Aventura) + período |
| QR estabelecimento | Admin editar local → PDF; scan `/q/{slug}` | Natureza/Aventura sem QR |
| Ver lugar | Cards → `/lugares/[id]` | Nenhuma |
| Favoritar | Coração home/detalhe, `/favoritos` | Login |
| Avaliar | Detalhe → `AvaliacaoForm` | Login; nome de exibição + comentário obrigatórios; moderação admin |
| Roteiro IA | `/atrativos` → Criar roteiro | Login + limite 2/dia (free); quota re-checked in sheet before API; excluir salvo via `DELETE /api/roteiro/[id]` |
| Modo guia (atrativo) | `/atrativos/[id]` → percurso | Nenhuma (progresso local no device) |
| Push | `/perfil` → Notificações push (app nativo) | Login + Capacitor |

### Capacitor native auth (manual)

| # | Action | Expected |
|---|--------|----------|
| N-03 | iOS app → `/login` → **Continuar com Apple** | Apple sheet → session; button **not** shown on web/Android |
| N-04 | iOS app → Google (device with Google account) | Native picker → session; no browser `/auth/callback` |
| N-05 | Android app → Google | Native flow with `NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` |
| N-06 | iOS Google fails to return | Verify `ios/GoogleAuth.xcconfig` reversed ID + Vercel `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID` |

| Atrativos curados | `/atrativos`, `/atrativos/[id]` | Nenhuma (só listagem) |
| Avatar | `/perfil/editar` → upload foto | Login; `POST /api/perfil/avatar` + `SUPABASE_SERVICE_ROLE_KEY` no servidor |
| Clima | Hero home; `LugarClimaWidget` no detalhe | Sheet completo = login |
| Perfil | `/perfil`, `/perfil/editar` | Stats só logado |
| Admin operacional | `/admin`, `/admin/locais`, `/admin/relatorios` | `role` **admin** ou **dev** |
| Admin sensível | `/admin/parceiros`, `/admin/contratos`, `/admin/logs`, `/admin/taxonomia` | **`role` dev** apenas |

---

## Seções do checklist (índice)

| Seção | Tema | Itens |
|-------|------|-------|
| A | Preparação | 5 |
| B | Onboarding e navegação | 3 |
| C | Login e cadastro | 12 |
| D | Home (`/`) | 24 |
| E | Explorar (`/categorias`) | 6 |
| F | Categoria (`/categoria/[slug]`) | 5 |
| G | Detalhe do lugar | 25 |
| H | Favoritos | 8 |
| I | Rotas e roteiro IA | 13 |
| J | Perfil | 9 |
| K | Casos extremos | 8 |
| L | Admin | 27 |
| L-QR | QR codes (admin + scan) | 8 |
| L-REV | Avaliações (nome de exibição) | 3 |
| L-ATR | Modo guia + voz | 3 |
| L-PAR | Parceiros CRM (dev) | 4 |
| L-CTR | Contratos comerciais (dev) | 4 |
| N | Feedback e erros PT | 5 |
| M | Smoke pós-release | 6 |

### H — Favoritos offline (manual)

| ID | Caso | Passos | Esperado |
|----|------|--------|----------|
| H-OFF-1 | Cache ao favoritar | Logado, favorite lugar + trilha online | Toast “Disponível offline”; banner em `/favoritos` |
| H-OFF-2 | Lista offline | DevTools → Offline → `/favoritos` | Lista e banner “Modo offline” |
| H-OFF-3 | Detalhe offline | Offline → toque item | `/favoritos/lugar/[id]` ou `/favoritos/atrativo/[id]` abre com badge |
| H-OFF-4 | Desfavoritar | Offline ou online, remova coração | Some da lista; cache limpo ao voltar online |

---

## L-QR — QR codes (manual)

| ID | Caso | Passos | Esperado |
|----|------|--------|----------|
| L-QR-1 | Admin — restaurante | Editar local Gastronomia → seção QR | Preview, URL `/q/{slug}`, botão PDF |
| L-QR-2 | PDF | Baixar PDF → escolher formato (mesa, adesivo, A5, …) | Layout premium com QR, badge parceiro se aplicável, CTA |
| L-QR-3 | Scan | Abrir `/q/{slug}` no browser (guest) | 302 → `/lugares/{id}?ref=qr`; banner QR uma vez/sessão |
| L-QR-4 | Relatório | `/admin/relatorios` após scan | KPI **Escaneamentos QR** incrementa |
| L-QR-5 | Natureza | Editar praia | Sem seção QR |
| L-QR-5b | Relatório filtro | `/admin/relatorios` → dropdown | Praias/trilhas (Natureza/Aventura) **não** listadas |
| L-QR-6 | Inativo | `status=desativado` → `/q/{slug}` | 404 |
| L-QR-7 | Role admin | Login `admin` (não dev) → `/admin/contratos` | Redirect ou acesso negado no shell |

## L-REV — Avaliações (manual)

| ID | Caso | Passos | Esperado |
|----|------|--------|----------|
| L-REV-1 | Nome editável | Logado → detalhe → Avaliar → alterar “Como quer aparecer?” | Nome salvo em `perfis` + snapshot `autor_nome` na avaliação |
| L-REV-2 | SMS / sem nome | Conta só telefone, perfil sem nome | Prefill `•••NNNN`; pode editar antes de enviar |
| L-REV-3 | Público | Após aprovação admin | Card mostra `autor_nome` (não depende de join em `perfis` de terceiros) |

## L-ATR — Modo guia (manual)

| ID | Caso | Passos | Esperado |
|----|------|--------|----------|
| L-ATR-1 | Abrir guia | `/atrativos/[id]` com pontos → iniciar modo guia | Full-screen; bottom nav oculta |
| L-ATR-2 | Progresso | Marcar ponto e avançar; fechar e reabrir | Progresso local restaurado |
| L-ATR-3 | Voz na busca | App nativo → mic na home/Explorar | Transcript preenche query (permissão de microfone) |

## L-PAR — Parceiros (manual, dev)

| ID | Caso | Passos | Esperado |
|----|------|--------|----------|
| L-PAR-1 | Lista | `/admin/parceiros` como **dev** | Só lugares `eh_parceiro`; filtros vencendo/curadoria |
| L-PAR-2 | Curadoria | Marcar curadoria feita | `proxima_curadoria_avaliacoes_em` +3 meses |
| L-PAR-3 | Deep link | Dashboard → card parceiros vencendo | Abre `/admin/parceiros?filtro=vencendo` |
| L-PAR-4 | Role admin | Login `admin` → `/admin/parceiros` | Nav oculto; URL bloqueada |

## L-CTR — Contratos (manual, dev)

| ID | Caso | Passos | Esperado |
|----|------|--------|----------|
| L-CTR-1 | Novo | `/admin/contratos` → Novo contrato | Dropdown só parceiros ativos |
| L-CTR-2 | Upload | Anexar PDF assinado | `POST /api/admin/contratos/[id]/documentos` → download assinado |
| L-CTR-3 | Ativar | Marcar contrato ativo | Desativa outros do mesmo `lugar_id`; sync parceiro |
| L-CTR-4 | Role admin | Login `admin` → upload doc | 403 na API |

## L-BAIXAR — Download do app (manual)

| ID | Cenário | Passos | Esperado |
|----|---------|--------|----------|
| L-BAIXAR-1 | Página | Abrir `/baixar` (guest) | Título, copy Imbituba, linha prefeitura, botões lojas; **sem** bloco “Para cartazes” |
| L-BAIXAR-2 | iOS | Safari iPhone com `NEXT_PUBLIC_APP_STORE_URL` | Redirect automático ou botão App Store ativo |
| L-BAIXAR-3 | Android | Chrome Android com `NEXT_PUBLIC_PLAY_STORE_URL` | Redirect automático ou botão Play ativo |
| L-BAIXAR-4 | Sem env | URLs das lojas vazias | Botões “Em breve”; página não quebra |
| L-BAIXAR-5 | QR material | Scan de QR → `/baixar` | Mesma experiência que L-BAIXAR-1/2/3 |

---

## N — Feedback e erros (manual)

| ID | Caso | Passos | Esperado |
|----|------|--------|----------|
| N-01 | Feedback logado | Perfil → Enviar sugestão → preencher e enviar | 201, mensagem de obrigado, item em admin |
| N-02 | Feedback visitante | Perfil sem login → mesmo fluxo com nome/e-mail opcionais | Envio OK se `SUPABASE_SERVICE_ROLE_KEY` configurada |
| N-03 | Erro busca + reportar | Forçar erro na busca IA (ex. desligar API key em dev) | Mensagem 100% PT + link reportar abre sheet com tipo `erro` |
| N-04 | Admin feedback | `/admin/feedback` → filtrar, alterar status, salvar notas | Persiste no Supabase |
| N-05 | RLS feedback | Usuário comum tenta `select` em `feedback` no client | Negado; admin vê todos |

Regenerar checklist HTML: `node scripts/build-checklist-data.mjs` (após incluir casos N no script, se desejado).

---

## Resultado (após exportar da página HTML)

| Área | OK | Falhas |
|------|-----|--------|
| Login/Cadastro | | |
| Home/Busca | | |
| Explorar/Categoria | | |
| Detalhe | | |
| Favoritos | | |
| Rotas/IA | | |
| Perfil | | |
| Feedback/erros | | |
| Admin | | |
| Extremos | | |

**Bloqueadores:**  
_(cole aqui o bloco “BLOQUEADORES” do export)_

**Observações:**  
_______________________________________________  

---

## Related docs

- [Features](./features.md) — comportamento esperado por capability
- [Architecture](./architecture.md) — rotas e componentes
- [API](./api.md) — limites IA e endpoints
- [Deployment](./deployment.md) — smoke tests em produção
- [Changelog](./CHANGELOG.md) — o que mudou por versão
