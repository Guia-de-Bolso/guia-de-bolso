# Guia de Bolso — Checklist de testes manuais

Checklist para QA manual (celular ~390px, tablet e desktop). Complementa [Features](./features.md).

## Checklist interativo (recomendado)

Use a ferramenta com **153 casos de teste**, passo a passo por dispositivo, resultado esperado, avisos e botões **Passou / Falhou / Resetar**:

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
| Login | `/login`, `LoginModal`, Perfil | — |
| Cadastro | Primeiro login (Google/SMS) + `/perfil/editar` | — |
| Busca IA | Home `SmartSearch`, `/?busca=1`, `/?q=` | Login + limite 5/dia (free) |
| Relatórios admin | `/admin/relatorios` | Admin/dev; lugar ativo + período |
| QR estabelecimento | Admin editar local → PDF; scan `/q/{slug}` | Natureza/Aventura sem QR |
| Ver lugar | Cards → `/lugares/[id]` | Nenhuma |
| Favoritar | Coração home/detalhe, `/favoritos` | Login |
| Avaliar | Detalhe → `AvaliacaoForm` | Login; comentário obrigatório; moderação admin |
| Roteiro IA | `/atrativos` → Criar roteiro | Login + limite 2/dia (free); excluir salvo via `DELETE /api/roteiro/[id]` |
| Atrativos curados | `/atrativos`, `/atrativos/[id]` | Nenhuma (só listagem) |
| Avatar | `/perfil/editar` → upload foto | Login; `POST /api/perfil/avatar` + `SUPABASE_SERVICE_ROLE_KEY` no servidor |
| Clima | Hero home; `LugarClimaWidget` no detalhe | Sheet completo = login |
| Perfil | `/perfil`, `/perfil/editar` | Stats só logado |
| Admin | `/admin` + nav | `role` admin ou dev |

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
| H | Favoritos | 5 |
| I | Rotas e roteiro IA | 13 |
| J | Perfil | 9 |
| K | Casos extremos | 8 |
| L | Admin | 27 |
| L-QR | QR codes (admin + scan) | 6 |
| N | Feedback e erros PT | 5 |
| M | Smoke pós-release | 6 |

---

## L-QR — QR codes (manual)

| ID | Caso | Passos | Esperado |
|----|------|--------|----------|
| L-QR-1 | Admin — restaurante | Editar local Gastronomia → seção QR | Preview, URL `/q/{slug}`, botão PDF |
| L-QR-2 | PDF | Baixar PDF | A6 com QR, nome, CTA, URL curta |
| L-QR-3 | Scan | Abrir `/q/{slug}` no browser (guest) | 302 → `/lugares/{id}?ref=qr`; banner QR uma vez/sessão |
| L-QR-4 | Relatório | `/admin/relatorios` após scan | KPI **Escaneamentos QR** incrementa |
| L-QR-5 | Natureza | Editar praia | Sem seção QR |
| L-QR-6 | Inativo | `status=desativado` → `/q/{slug}` | 404 |

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
