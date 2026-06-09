# Custos e receita — Guia de Bolso

Documento financeiro para planejamento de lançamento. **Não substitui contabilidade** — use como modelo editável junto com [`custos-planilha.csv`](./custos-planilha.csv).

**Data de referência dos preços:** maio/2026  
**Câmbio premissa:** US$ 1 = **R$ 5,90** (editável na planilha e em `/admin/despesas`)  
**Responsável:** Bruno Disliler — operação solo em transição

> **Operação:** custos fixos da stack podem ser cadastrados e acompanhados no painel admin em **`/admin/despesas`**. Custos variáveis de IA continuam em **`/admin/ia`** (`logs_ia`).

---

## 1. O que o produto cobra hoje (fonte de verdade)

| Linha | Quem paga | Valor no código / produto | Relevância |
|-------|-----------|---------------------------|------------|
| **B2B Parceiro (principal)** | Estabelecimento | **R$ 199/mês** — `lib/planoComercial.js`, `plano_comercial_unico.sql` | Carrossel Parceiros, prioridade na busca IA, badges |
| **B2C Guia Premium (secundário)** | Usuário final | **R$ 9,90/mês** — IA ilimitada (`lib/premium.js`) | Não paga o negócio sozinho; cobre heavy users parcialmente |
| **Free tier IA** | — | 5 buscas/dia + 2 roteiros/dia (America/Sao_Paulo) | Teto teórico de custo variável |

**Roadmap V2 (só cenário na planilha, não no código):** Gratuito R$ 0 · Estabelecido R$ 99 · Destaque R$ 149 · Parceiro R$ 229 (`CLAUDE.md`).

**Lançamento:** apps nas **duas lojas** (Google Play + Apple App Store) + web Vercel.  
**Catálogo:** **100 lugares** no lançamento → **~300** ~3 meses depois (impacto forte na **busca IA**).

---

## 2. Chamadas de IA no código

| Endpoint | Arquivo | `max_tokens` saída | Escala com catálogo |
|----------|---------|-------------------|---------------------|
| Busca | `app/api/buscar/route.js` | **256** | **Sim** — envia `JSON.stringify(lugaresResumo)` de **todos** os lugares `status=ativo` |
| Roteiro | `app/api/roteiro/route.js` | **1400** | **Fraca** — no máx. **24** lugares (`selecionarLugaresParaRoteiro` em `lib/roteiroLugares.js`) |
| Moderação avaliação | `app/api/avaliacoes/analisar/route.js` | **500** | Não — 1 avaliação por chamada |

**Modelo:** `claude-sonnet-4-5` (env `ANTHROPIC_MODEL`).

**Preço Anthropic Sonnet 4.5** (consulta maio/2026):  
- Input: **US$ 3 / MTok**  
- Output: **US$ 15 / MTok**  
- Fonte: [Anthropic Pricing](https://www.anthropic.com/pricing)

### 2.1 Estimativa de tokens por chamada

Método: tamanho médio do payload no código (`buildLugarBuscaResumo` + string `contexto` em `buscar/route.js`).

| Componente | ~100 lugares | ~300 lugares |
|------------|--------------|--------------|
| Entrada busca (system + user + catálogo JSON) | **~8.500 tokens** | **~24.500 tokens** |
| Saída busca (média observada) | **~80 tokens** | **~80 tokens** |
| Entrada roteiro (system + ≤24 lugares, `descricao` truncada 100 chars) | **~4.500 tokens** | **~4.500 tokens** |
| Saída roteiro (média, &lt; max 1400) | **~900 tokens** | **~900 tokens** |
| Entrada moderação | **~450 tokens** | **~450 tokens** |
| Saída moderação | **~120 tokens** | **~120 tokens** |

### 2.2 Custo unitário por chamada (premissa câmbio R$ 5,90)

| Chamada | 100 lugares | 300 lugares |
|---------|-------------|-------------|
| **1 busca** | US$ ~0,026 → **R$ 0,15** | US$ ~0,074 → **R$ 0,44** |
| **1 roteiro** | US$ ~0,027 → **R$ 0,16** | idem |
| **1 moderação** | US$ ~0,003 → **R$ 0,02** | idem |

> Recalcule na planilha se descrições de lugares ficarem muito longas (o campo `descricao` entra inteiro na busca).

---

## 3. Premissas de uso (MAU e cenários)

**MAU** = usuários ativos no mês (abriram o app).  
**Usuários IA** = `MAU × pct_logados × pct_usuarios_ia` (só logados usam busca/roteiro).

| Cenário | pct_logados | pct_usuarios_ia | Buscas / usuário IA / mês | Roteiros / usuário IA / mês | Moderações / usuário IA / mês |
|---------|-------------|-----------------|---------------------------|-----------------------------|-------------------------------|
| **Conservador** | 35% | 25% | 4 | 0,4 | 0,15 |
| **Médio (padrão)** | 40% | 45% | 12 | 1,5 | 0,35 |
| **Alta temporada** | 45% | 60% | 28 | 5 | 0,6 |
| **Teto teórico** | 50% | 100% | 90 | 60 | 1,0 |

*Teto = usuário batendo limite diário free quase todo dia (referência, não previsão).*

**Moderações totais/mês** ≈ `MAU × 8%` lugares avaliados × 1 chamada IA (premissa editável).

**WhatsApp OTP (pós-migração):** não usar SMS na projeção.  
- Premissa: **R$ 0,10 / login OTP** [ESTIMATIVA] (auth template Brasil ~R$ 0,09 + taxas; [Twilio WhatsApp pricing](https://www.twilio.com/pt-br/whatsapp/pricing), [Meta WhatsApp pricing](https://developers.facebook.com/docs/whatsapp/pricing/)).  
- Logins novos/mês ≈ `MAU × 12%`; **35%** desses via WhatsApp (resto Google OAuth).

---

## 4. Tabela A — Custo variável de IA por MAU (R$/mês)

Valores **médios** (cenário **Médio**). Colunas **100** vs **300** lugares.

| MAU | Usuários IA | Buscas/mês | Roteiros/mês | Mod./mês | IA (100 lug.) | IA (300 lug.) |
|-----|-------------|------------|--------------|----------|---------------|---------------|
| **10** | 2 | 22 | 3 | 1 | **R$ 4** | **R$ 11** |
| **100** | 18 | 216 | 27 | 8 | **R$ 37** | **R$ 105** |
| **200** | 36 | 432 | 54 | 16 | **R$ 74** | **R$ 210** |
| **500** | 90 | 1.080 | 135 | 40 | **R$ 185** | **R$ 525** |

### Mesma MAU — outros cenários (catálogo **100 lugares**)

| MAU | Conservador | Médio | Alta temporada | Teto teórico |
|-----|-------------|-------|----------------|--------------|
| 10 | R$ 1 | R$ 4 | R$ 9 | R$ 15 |
| 100 | R$ 10 | R$ 37 | R$ 86 | R$ 143 |
| 200 | R$ 20 | R$ 74 | R$ 172 | R$ 286 |
| 500 | R$ 50 | R$ 185 | R$ 430 | R$ 715 |

### Mesma MAU — outros cenários (catálogo **300 lugares**)

| MAU | Conservador | Médio | Alta temporada | Teto teórico |
|-----|-------------|-------|----------------|--------------|
| 10 | R$ 3 | R$ 11 | R$ 25 | R$ 42 |
| 100 | R$ 30 | R$ 105 | R$ 245 | R$ 408 |
| 200 | R$ 60 | R$ 210 | R$ 490 | R$ 816 |
| 500 | R$ 150 | R$ 525 | R$ 1.225 | R$ 2.040 |

*(Teto com 500 MAU e 300 lugares é cenário de stress — configurar alertas de billing antes.)*

---

## 5. Tabela B — Custos fixos mensais (stack)

Faixas em **R$/mês** para operação solo com lançamento nas lojas.

| Serviço | Mínimo | Recomendado | Escala | Notas |
|---------|--------|-------------|--------|-------|
| **Cursor Pro** | R$ 118 | R$ 118 | R$ 118 | ~US$ 20/mês — dev |
| **Domínio** (.com.br) | R$ 3 | R$ 3 | R$ 3 | ~R$ 40/ano |
| **E-mail profissional** | R$ 0 | R$ 45 | R$ 80 | Zoho Mail Lite ou Google Workspace 1 usuário [ESTIMATIVA] |
| **Vercel** | R$ 0 | R$ 118 | R$ 295+ | Hobby vs Pro ~US$ 20 — API routes + preview |
| **Supabase** | R$ 0 | R$ 148 | R$ 440+ | Free vs Pro ~US$ 25 — 100–300 lugares, fotos, logs |
| **Google Maps Platform** | R$ 0 | R$ 50 | R$ 200+ | Places (admin) + Static Maps; crédito US$ 200/mês [ESTIMATIVA uso moderado] |
| **Twilio WhatsApp** | R$ 2 | R$ 15 | R$ 80+ | Ver §3 — variável, listado aqui para visão total |
| **Apple Developer** | R$ 49 | R$ 49 | R$ 49 | US$ 99/ano ÷ 12 |
| **Google Play** | R$ 12 | R$ 12 | R$ 12 | US$ 25 taxa única ÷ 12 |
| **Anthropic API** | — | (tabela A) | (tabela A) | Variável |
| **GitHub** | R$ 0 | R$ 0 | R$ 0 | Repo público |

| **Total fixo (sem IA/WhatsApp)** | **~R$ 184** | **~R$ 543** | **~R$ 1.277+** | |

**Total operação** = fixo recomendado + IA (tabela A) + WhatsApp.

Exemplo **lançamento (Médio, MAU 100, 100 lugares):** R$ 543 + R$ 37 + R$ 15 ≈ **R$ 595/mês**.

---

## 6. Tabela C — Receita projetada (mensal)

### B2B — Parceiros (receita principal)

**V1 (código hoje):** ticket **R$ 199/mês** por parceiro ativo.

Premissas editáveis:

| Momento | Lugares no app | Estabelecimentos “comerciais” (~60% do catálogo) | % pagantes V1 | Parceiros | **MRR B2B** | **ARR** |
|---------|----------------|-----------------------------------------------------|---------------|-----------|-------------|---------|
| Lançamento | 100 | 60 | 8% | 5 | **R$ 995** | R$ 11.940 |
| Lançamento (otimista) | 100 | 60 | 15% | 9 | **R$ 1.791** | R$ 21.492 |
| Mês 3–6 | 300 | 180 | 10% | 18 | **R$ 3.582** | R$ 42.984 |
| Mês 6 (otimista) | 300 | 180 | 18% | 32 | **R$ 6.368** | R$ 76.416 |

**Cenário V2 multi-tier** (planilha — não implementado):

Exemplo mix em 18 parceiros: 40% Estabelecido (99) + 35% Destaque (149) + 25% Parceiro (229) → ticket médio **~R$ 152** → MRR **~R$ 2.736** (vs R$ 3.582 se todos a R$ 199).

### B2C — Premium R$ 9,90 (secundário)

| MAU | % assinantes Premium | Assinantes | **MRR B2C** |
|-----|----------------------|------------|-------------|
| 100 | 3% | 3 | **R$ 30** |
| 100 | 5% | 5 | **R$ 50** |
| 500 | 5% | 25 | **R$ 248** |

Premium **não cobre** IA de power users sozinho; ajuda margem e sinal de produto.

### Cobrança

**Asaas / portal estabelecimento:** não implementado — receita acima é **projeção manual** até billing automático.

---

## 7. Tabela D — Break-even e sensibilidade

### Só stack fixo (recomendado ~R$ 543/mês)

| Item | Parceiros a R$ 199 |
|------|-------------------|
| Empatar fixos | **3 parceiros** (R$ 597) |

### Stack + IA (Médio)

| MAU | Lugares | Custo total ~ | Parceiros R$ 199 para empatar |
|-----|---------|---------------|-------------------------------|
| 100 | 100 | R$ 595 | **3** (sobra pouco) / **4** confortável |
| 100 | 300 | R$ 663 | **4** |
| 500 | 100 | R$ 743 | **4** |
| 500 | 300 | R$ 1.083 | **6** |

### Margem bruta simplificada (lançamento, Médio)

| | R$/mês |
|---|--------|
| MRR B2B (5 parceiros) | 995 |
| MRR B2C (3 premium) | 30 |
| **Receita** | **1.025** |
| Custo operação | 595 |
| **Margem bruta** | **~R$ 430** (~42%) |

Com **9 parceiros** + custos iguais: receita R$ 1.821 − R$ 595 ≈ **R$ 1.226/mês**.

---

## 8. Riscos e alavancas

- **Catálogo 300 lugares** multiplica ~3× o input da busca → maior risco variável; mitigar: pré-filtro por categoria, resumo sem `descricao` completa, Haiku para ranking + Sonnet só no top 10.
- **Busca manda catálogo inteiro** (`app/api/buscar/route.js`) — confirmado; qualquer lugar novo aumenta custo linearmente.
- **Roteiro** limitado a 24 lugares — custo estável ao crescer catálogo.
- **WhatsApp vs Google OAuth** — se OTP WhatsApp dominar, custo auth sobe; Google continua R$ 0 marginal.
- **Lojas** — ~**R$ 61/mês** amortizado (Apple + Play) **mesmo com 10 MAU**.
- **Supabase/Vercel** — passar de Free com fotos, logs e tráfego de lojas; monitorar limites.
- **Maps** — Static + Places; estourar crédito US$ 200 [ESTIMATIVA].
- **Premium B2C** — não é driver; não cortar IA dos free sem estratégia B2B clara.
- **Billing B2B** — receita futura até Asaas/portal; cobrança manual no início.
- **Alerta Anthropic** — configurar teto de gasto e e-mail antes de alta temporada.

---

## 9. Como editar a planilha CSV

Arquivo: [`custos-planilha.csv`](./custos-planilha.csv)

1. Ajuste a linha `INPUT` (câmbio, custo por chamada, fixos, premissas %).
2. Cada linha `cenario` recalcula mentalmente ou no Excel:
   - `usuarios_ia = mau * pct_logados * pct_usuarios_ia`
   - `buscas = usuarios_ia * buscas_por_usuario_ia_mes`
   - `custo_ia_brl = buscas*custo_busca + roteiros*custo_roteiro + avaliacoes*custo_mod`
3. Colunas de receita: altere `parceiros_pagantes` e `assinantes_premium_b2c`.
4. `margem_brl = mrr_b2b_brl + mrr_b2c_brl - custo_total_brl`

---

## 10. Resumo executivo (5 bullets)

1. **Lançamento mais provável (100 lugares, MAU 100, cenário Médio, 5 parceiros):** custo operação **~R$ 595/mês**; receita **~R$ 1.025/mês**; margem bruta **~R$ 430**.
2. **Mês 6 (300 lugares, MAU 300–500, 18–32 parceiros):** custo **~R$ 700–1.100/mês**; MRR B2B **R$ 3.600–6.400** se conversão 10–18% dos comerciais.
3. **Break-even:** **3–4 parceiros a R$ 199** cobrem stack recomendado + IA em MAU 100; B2C Premium sozinho não empata o negócio.
4. **Maior risco variável:** busca IA com catálogo completo crescendo para 300 lugares + cenário teto de limites diários free.
5. **Próximos passos:** alerta de billing Anthropic; medir tokens reais nas primeiras 2 semanas; priorizar OAuth vs WhatsApp; planejar otimização de contexto da busca antes de 300 lugares; implementar cobrança B2B (Asaas) quando houver 5+ parceiros pagando manualmente.

---

## Referências

- [Anthropic Pricing](https://www.anthropic.com/pricing)
- [Supabase Pricing](https://supabase.com/pricing)
- [Vercel Pricing](https://vercel.com/pricing)
- [Twilio WhatsApp Pricing (BR)](https://www.twilio.com/pt-br/whatsapp/pricing)
- Código: `app/api/buscar/route.js`, `app/api/roteiro/route.js`, `app/api/avaliacoes/analisar/route.js`, `lib/planoComercial.js`, `lib/premium.js`
