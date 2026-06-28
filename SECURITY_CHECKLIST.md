# Security Checklist — Guia de Bolso

**Última auditoria:** 2026-05-25  
**Escopo:** código em `/app`, `/lib`, `/components`, `/middleware.js`, `supabase/*.sql`, variáveis de ambiente documentadas.

## Resumo executivo

O projeto separa bem segredos de servidor (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) do cliente e usa RLS em várias tabelas, mas há falhas graves **no banco versionado** (leitura aberta de `logs`, `UPDATE` amplo em `perfis`, upload de fotos para qualquer usuário autenticado) e **proteção de admin só no browser**. APIs de IA exigem login e limites diários, porém sem rate limit por IP e com fallback que libera uso em erro. Priorize corrigir RLS/policies no Supabase e reforçar autorização server-side antes de escalar tráfego ou parceiros pagantes.

---

## Matriz de rotas API (`app/api/*`)

| Rota | Método | Sessão | Papel admin | Rate limit | Notas |
|------|--------|--------|-------------|------------|-------|
| `/api/buscar` | POST | Obrigatória (`checkBuscaAccess`) | — | Não | Claude; incrementa uso IA |
| `/api/roteiro` | POST | Obrigatória (`checkRoteiroAccess`) | — | Não | Claude; `max_tokens: 2400` |
| `/api/roteiro/salvar` | POST | Obrigatória | — | Não | Insert `roteiros` via RLS |
| `/api/roteiro/[id]` | DELETE | Obrigatória | — | Não | `.eq("user_id", user.id)` |
| `/api/avaliacoes/analisar` | POST | Obrigatória | — | Não | Só `avaliacao.user_id === user.id` |
| `/api/uso-premium` | GET | Opcional | — | Não | Leitura de contadores |
| `/api/lugares` | GET | Pública (anon server) | — | Não | Só lugares ativos / destaques |
| `/api/feedback` | POST | Opcional | — | Sim (memória, 5/h) | Guest usa service role |

**Outras rotas sensíveis:** `app/auth/callback` (OAuth), `app/q/[slug]` (redirect + log via service role).

---

## Tabela de prioridades (status operacional)

| Prioridade | Item | Status | Notas |
|------------|------|--------|-------|
| P0 | Policy `logs` SELECT com `USING (true)` | Aberto | Qualquer cliente com anon key pode ler PII |
| P0 | `perfis` UPDATE próprio sem restrição de colunas | Mitigado | Trigger bloqueia `role`, `premium_*` e contadores IA; cotas só via RPC |
| P0 | Storage `lugares-fotos` / `rotas-fotos` INSERT para `authenticated` | Aberto | Qualquer login envia fotos |
| P0 | Policies de escrita `lugares` / `destaques` não versionadas | Mitigado | `lugares_admin_write.sql`, `destaques_planos_policies.sql` |
| P0 | RLS `favoritos` não versionado | Mitigado | `favoritos_policies.sql` |
| P0 | Admin UPDATE `perfis` de outro usuário | Mitigado | `perfis_admin_policies.sql` + trigger |
| P1 | Admin `/admin` só no cliente (`useAdminAuth`) | Parcial | `app/admin/layout.js` server guard; RLS + PostgREST do browser ainda crítico |
| P1 | Sem rate limit em `/api/buscar` e `/api/roteiro` | Mitigado | `lib/iaRateLimit.js` (Upstash + fallback memória); cotas premium |
| P1 | Fallback fail-open em `premiumServer` | Mitigado | `USAGE_CHECK_FAILED` fail-closed; `/api/uso-premium` não inventa cota em erro |
| P1 | Open redirect em `auth/callback?next=` | Mitigado | `lib/safeRedirectPath.js` + `?next=` no OAuth via login |
| P2 | `rota_dicas` / `rotas_tags` policy “Authenticated write” legada | Verificar | Substituir por `is_admin_user()` |
| P2 | Prompt injection na busca/roteiro | Mitigar | Sanitizar input; não confiar só no system prompt |
| P2 | Rate limit feedback em memória | Limitado | Redis/Vercel KV em produção |
| P2 | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` exposta | Aceitar com restrição | Referrer + APIs mínimas no GCP |
| P3 | Middleware só refresh de sessão | Info | Não protege `/admin` |
| OK | Service role não vai para o bundle | OK | `lib/supabase/service.js` server-only |
| OK | `ANTHROPIC_API_KEY` só em Route Handlers | OK | |
| OK | RPC `increment_*_ia` valida `auth.uid()` | OK | `supabase/increment_uso_ia.sql` |
| OK | DELETE roteiro filtra `user_id` | OK | API + RLS `roteiros_policies.sql` |
| OK | Markdown roteiro com `escapeHtml` | OK | `lib/roteiroMarkdown.js` |

---

## Achados detalhados

### 1. Leitura pública de todos os logs (RLS permissiva)

| Campo | Valor |
|-------|--------|
| **Risco** | Critical |
| **Impacto** | Exposição de e-mails, nomes, ações (`login`, `ir_agora`, `favoritou`), metadados de lugares e comportamento de usuários a quem tiver a anon key (incluída no JS público). |
| **Probabilidade** | Likely (chave anon é pública por design; PostgREST expõe tabela se policy permitir). |
| **Evidência** | `supabase/logs_policies.sql` — policy `"Admin lê logs"` com `FOR SELECT USING (true)` sem filtro de role. |
| **Solução** | Substituir por `USING (public.is_admin_or_dev())` (mesmo padrão de `perfis_rls_fix.sql`). Revogar SELECT para `anon`. Auditar vazamento já ocorrido nos logs do Supabase. |

---

### 2. Escalação de privilégio via UPDATE em `perfis` (próprio registro)

| Campo | Valor |
|-------|--------|
| **Risco** | Critical |
| **Impacto** | Usuário autenticado pode definir `role = 'admin'` ou `premium_ativo = true` e obter acesso ao painel admin ou IA ilimitada, conforme colunas graváveis. |
| **Probabilidade** | Likely se policy `perfis_update_own_usage` / `perfis_update_own` permitir UPDATE na linha inteira. |
| **Evidência** | `supabase/perfis_premium_policies.sql` — `WITH CHECK (auth.uid() = id)` sem lista branca de colunas. App atualiza `buscas_ia`, `maps_preferido`, etc. via cliente. |
| **Solução** | (1) Trigger `BEFORE UPDATE` em `perfis_privileged_guard.sql` congela `role`, `premium_ativo`, `premium_ate`, `buscas_ia`, `roteiros_ia`, `uso_ia_mes` exceto via RPC (`perfis_ia_usage_write_bypass`). (2) Policy separada `perfis_update_admin` com `is_admin_or_dev()` para `/admin/usuarios`. (3) Contadores IA só via RPC `increment_*_ia` / `align_perfil_usage_to_day` — sem UPDATE client em `premiumServer.js`. |

---

### 3. Upload de fotos de lugares/rotas por qualquer usuário autenticado

| Campo | Valor |
|-------|--------|
| **Risco** | Critical |
| **Impacto** | Conteúdo malicioso (imagem ofensiva, malware hospedado), custo de storage, troca visual de estabelecimentos se paths forem adivinháveis. |
| **Probabilidade** | Possible (requer conta; SMS/Google reduzem bots mas não eliminam). |
| **Evidência** | `supabase/fotos_migration.sql` — `FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lugares-fotos')` sem `is_admin_user()`. |
| **Solução** | Restringir INSERT/UPDATE/DELETE a `public.is_admin_user()` (ou `is_admin_or_dev()`). Manter SELECT público se buckets forem públicos. Validar MIME no servidor (magic bytes) em Route Handler de upload futuro. |

---

### 4. Policies de escrita em `lugares` / `destaques` ausentes no repositório

| Campo | Valor |
|-------|--------|
| **Risco** | Critical (se produção estiver sem RLS de escrita) / High (se só no Dashboard, drift) |
| **Impacto** | Sem policies de INSERT/UPDATE/DELETE versionadas: risco de tabela aberta no Dashboard ou bloqueio do admin; difícil auditar deploys. |
| **Probabilidade** | Possible |
| **Evidência** | `supabase/lugares_public_read.sql` só SELECT; `docs/database.md` lista escrita admin como “esperada” mas não em SQL. Admin grava via `LocalForm.js` / `LugaresGridPage.js`. |
| **Solução** | Adicionar `lugares_admin_write.sql` com INSERT/UPDATE/DELETE usando `is_admin_or_dev()`. Repetir para `destaques`, `localizacoes`, `lugares_tags`. Incluir no checklist de deploy. |

---

### 5. Painel admin protegido apenas no cliente (Broken Access Control — OWASP A01)

| Campo | Valor |
|-------|--------|
| **Risco** | High |
| **Impacto** | Usuário com sessão e RLS fraca pode chamar PostgREST diretamente (curl/script) para moderar avaliações, alterar lugares ou ler feedback, sem passar por `useAdminAuth`. |
| **Probabilidade** | Likely após escalação de role (achado #2) ou policies admin ausentes. |
| **Evidência** | `components/admin/AdminShell.js` — `useAdminAuth()` só no `useEffect`; `middleware.js` não bloqueia `/admin`. Nenhuma API Route server valida `role` para CRUD. |
| **Solução** | `middleware.js`: para `/admin` e `/api/admin/*`, validar sessão + `perfis.role` via cookie SSR. Centralizar mutações sensíveis em Route Handlers com `getAuthUser()` + `canAccessAdmin(perfil.role)`. |

---

### 6. Ausência de rate limiting nas APIs de IA (abuso de custo)

| Campo | Valor |
|-------|--------|
| **Risco** | High |
| **Impacto** | Conta legítima ou comprometida pode esgotar cota Anthropic; DDoS econômico mesmo com limite diário de 5 buscas (múltiplas contas). |
| **Probabilidade** | Likely em campanha automatizada |
| **Evidência** | `app/api/buscar/route.js`, `app/api/roteiro/route.js` — sem throttle IP/usuário além de `checkBuscaAccess` / `checkRoteiroAccess`. |
| **Solução** | Vercel Firewall / Upstash Redis: ex. 10 req/min por IP nas rotas POST de IA; captcha após falhas; alertas de billing Anthropic. |

---

### 7. Fallback fail-open nos limites Premium (`premiumServer`)

**Status (código):** incremento e leitura negam com `USAGE_CHECK_FAILED` em falha; `GET /api/uso-premium` retorna `usage: null` em erro (não `createDefaultUsage()`).

| Campo | Valor |
|-------|--------|
| **Risco** | High |
| **Impacto** | Falha RLS/ rede ao incrementar contadores permite busca/roteiro além do limite gratuito. |
| **Probabilidade** | Possible em incidentes ou migração incompleta |
| **Evidência** | `lib/premiumServer.js` — blocos `catch { return { allowed: true, ... } }` em `incrementBuscaFallback` / `incrementRoteiroFallback`. |
| **Solução** | Em erro, retornar `allowed: false` com código `USAGE_SYNC_FAILED` e log estruturado; nunca incrementar uso no catch. |

---

### 8. Open Redirect no callback OAuth

| Campo | Valor |
|-------|--------|
| **Risco** | High |
| **Impacto** | Phishing: `?next=https://evil.com` após login Google; roubo de confiança da marca. |
| **Probabilidade** | Possible (exploração social) |
| **Evidência** | `app/auth/callback/route.js` — `NextResponse.redirect(\`${origin}${next}\`)` sem validar `next`. |
| **Solução** | Função `safeNextPath(next)`: aceitar só paths começando com `/`, sem `//`, default `/`. Ignorar URLs absolutas. |

---

### 9. Service Role em feedback de visitante e log de QR

| Campo | Valor |
|-------|--------|
| **Risco** | High (se vazamento) / Medium (uso correto) |
| **Impacto** | Chave `SUPABASE_SERVICE_ROLE_KEY` bypassa todo RLS; vazamento = comprometimento total do banco. |
| **Probabilidade** | Unlikely no código atual; Likely se commitada ou logada |
| **Evidência** | `app/api/feedback/route.js`, `app/q/[slug]/route.js`, `lib/supabase/service.js`. |
| **Solução** | Manter só em env Vercel; rotacionar chave periodicamente; preferir RPC `insert_feedback_guest()` `SECURITY DEFINER` com validação em vez de service role no app. Nunca logar corpo de erro com key. |

---

### 10. Policies legadas “Authenticated write” em taxonomia de rotas

| Campo | Valor |
|-------|--------|
| **Risco** | Medium |
| **Impacto** | Qualquer usuário logado altera `rota_dicas` / `rotas_tags` se migration antiga estiver ativa. |
| **Probabilidade** | Possible se ordem de SQL no Supabase aplicou `rota_dicas.sql` / `rotas_taxonomia.sql` sem `rotas_policies.sql` depois |
| **Evidência** | `supabase/rota_dicas.sql`, `supabase/rotas_taxonomia.sql` — `USING (true)` para authenticated. `rotas_policies.sql` corrige dicas mas verificar `rotas_tags`. |
| **Solução** | No SQL Editor, listar policies ativas; dropar writes abertos; garantir só `Admin write` com `is_admin_user()`. |

---

### 11. Avaliações: UPDATE amplo na própria linha (auto-moderação)

| Campo | Valor |
|-------|--------|
| **Risco** | Medium |
| **Impacto** | Cliente direto no Supabase pode setar `status = 'aprovado'` na própria avaliação, bypassando moderação humana. |
| **Probabilidade** | Possible |
| **Evidência** | `supabase/avaliacoes_moderacao.sql` — `avaliacoes_update_ia_own` sem limitar colunas; API `/api/avaliacoes/analisar` só rejeita spam via IA. |
| **Solução** | Trigger que impede `status` fora de `pendente`/`aguardando_edicao` para não-admin; policy admin separada para aprovar. |

---

### 12. Prompt injection e exfiltração via busca/roteiro (OWASP LLM)

| Campo | Valor |
|-------|--------|
| **Risco** | Medium |
| **Impacto** | Manipular ranking de lugares, instruções no markdown do roteiro, aumento de tokens/custo. |
| **Probabilidade** | Possible |
| **Evidência** | `queryUsuario` interpolado em `app/api/buscar/route.js` e `app/api/roteiro/route.js` com catálogo JSON completo. |
| **Solução** | Delimitar input (`<user_query>`), truncar tamanho, filtrar padrões de jailbreak; pós-validar IDs retornados contra allowlist; não incluir campos sensíveis no contexto. |

---

### 13. Validação de upload baseada em `file.type` (cliente)

| Campo | Valor |
|-------|--------|
| **Risco** | Medium |
| **Impacto** | Upload de polyglot/HTML disfarçado de imagem em bucket público. |
| **Probabilidade** | Unlikely |
| **Evidência** | `lib/storageUpload.js` — `isAcceptedImageFile` usa MIME declarado pelo browser. |
| **Solução** | Após `compressImageFile`, confiar no canvas re-encode; opcional validação de assinatura no servidor. |

---

### 14. Chave Google Maps pública (`NEXT_PUBLIC_*`)

| Campo | Valor |
|-------|--------|
| **Risco** | Medium |
| **Impacto** | Uso indevido da quota/billing se restrições GCP estiverem frouxas. |
| **Probabilidade** | Possible |
| **Evidência** | `lib/googleMaps.js`, `lib/lugarDetalhe.js`. |
| **Solução** | Restringir por HTTP referrer (domínios Vercel + localhost), limitar APIs (Places + Static apenas), quotas diárias. |

---

### 15. Rate limit de feedback só em memória do processo

| Campo | Valor |
|-------|--------|
| **Risco** | Medium |
| **Impacto** | Spam de feedback; limite reinicia a cada cold start na Vercel. |
| **Probabilidade** | Likely em ataque distribuído |
| **Evidência** | `lib/feedbackRateLimit.js` — `Map` local, 5/h. |
| **Solução** | Redis/KV com chave IP + user_id; honeypot no formulário. |

---

### 16. Middleware sem autorização de rotas

| Campo | Valor |
|-------|--------|
| **Risco** | Low |
| **Impacto** | Depende 100% de RLS + UI; sessão expirada ainda carrega HTML admin brevemente. |
| **Probabilidade** | Unlikely |
| **Evidência** | `middleware.js` — apenas `getUser()`. |
| **Solução** | Matcher `/admin/:path*` com redirect se não admin. |

---

### 17. Log de scan QR sem rate limit

| Campo | Valor |
|-------|--------|
| **Risco** | Low |
| **Impacto** | Inflar métricas `escaneou_qr` nos relatórios. |
| **Probabilidade** | Possible |
| **Evidência** | `app/q/[slug]/route.js` — insert via service role a cada GET. |
| **Solução** | Debounce por IP+slug (cookie ou KV); amostragem. |

---

### 18. `is_admin_user()` concedido a `anon`

| Campo | Valor |
|-------|--------|
| **Risco** | Low / Info |
| **Impacto** | Baixo (função só retorna boolean para `auth.uid()`); superfície desnecessária. |
| **Probabilidade** | Unlikely |
| **Evidência** | `supabase/rotas_policies.sql` — `GRANT EXECUTE ... TO anon`. |
| **Solução** | `GRANT` apenas `authenticated`. |

---

### 19. SMS OTP: limite só no cliente para reenvio

| Campo | Valor |
|-------|--------|
| **Risco** | Low |
| **Impacto** | Custo Twilio se atacante bypassar UI (`resendCount >= 3` só em React). |
| **Probabilidade** | Possible |
| **Evidência** | `components/AuthFlow.js`. |
| **Solução** | Rate limits no Supabase Auth / Twilio; CAPTCHA no login. |

---

### 20. Script SQL com e-mail real no repositório

| Campo | Valor |
|-------|--------|
| **Risco** | Info |
| **Impacto** | Exposição de e-mail pessoal; template de promoção admin copiado sem sanitizar. |
| **Probabilidade** | Unlikely exploração |
| **Evidência** | `supabase/grant_admin_role.sql`. |
| **Solução** | Usar placeholder `SEU_EMAIL@dominio.com`; documentar no README. |

---

### 21. Pontos positivos (manter)

| Item | Detalhe |
|------|---------|
| Segredos Anthropic | Apenas `process.env.ANTHROPIC_API_KEY` em Route Handlers |
| Anon key no cliente | Esperado; depende de RLS correto |
| Busca/roteiro IA | Exigem login + limites (`increment_*_ia` / fallback) |
| `/api/avaliacoes/analisar` | Verifica dono da avaliação |
| `/api/roteiro/[id]` DELETE | Filtra `user_id` |
| OAuth Google | `redirectTo` fixo para `/auth/callback` (sem open redirect no sign-in) |
| Avatar storage | Policy amarrada a `auth.uid()` na pasta (`storage-policies.sql`) |
| XSS roteiro | `escapeHtml` em `lib/roteiroMarkdown.js` |

---

## Roadmap de remediação (ordem sugerida)

1. **Imediato (P0):** Corrigir policy `logs` SELECT; triggers/policies em `perfis` para bloquear `role`/`premium_*` em self-update; storage fotos só admin; auditar policies ativas no Supabase Dashboard vs repo.
2. **Semana 1 (P1):** Rate limit IP nas APIs IA; remover fail-open em `premiumServer`; validar `next` no callback; versionar SQL de escrita `lugares`/`destaques`.
3. **Semana 2 (P2):** Middleware admin; consolidar policies `rotas_tags`/`rota_dicas`; triggers em `avaliacoes`; rate limit feedback em KV; restrições GCP Maps.
4. **Contínuo:** Revisar RLS antes de cada migration; rotação service role; alertas custo Anthropic; testes de regressão RLS (script com anon + user JWT).

---

## Checklist contínuo (dev / deploy)

- [ ] `.env.local` e Vercel: `SUPABASE_SERVICE_ROLE_KEY` e `ANTHROPIC_API_KEY` **sem** prefixo `NEXT_PUBLIC_`
- [ ] Nunca commitar `.env.local`; revisar diff por `sk-ant`, `service_role`, `sb_secret`
- [ ] Após mudança em `supabase/*.sql`, aplicar no SQL Editor e exportar policies ativas para o repo
- [ ] Novo bucket Storage: policies explícitas (não público write para `authenticated` genérico)
- [ ] Promover admin só via SQL manual (`grant_admin_role.sql` com placeholder) ou painel já protegido por RLS admin
- [ ] Preview deployments: mesmas env vars com projeto Supabase de staging quando possível
- [ ] Google Cloud: referrer restriction + APIs mínimas na chave Maps
- [ ] Anthropic: limite de gasto mensal e alerta por e-mail
- [ ] Pós-incidente: rotacionar anon + service role se suspeita de exfiltração via achado #1

---

## Referências no projeto

- Contexto: `CLAUDE.md`, `docs/database.md` (seção RLS)
- Env: `.env.example`, `docs/deployment.md`
- Auth: `app/auth/callback/route.js`, `components/AuthFlow.js`, `middleware.js`
- Admin: `components/admin/AdminShell.js`, `lib/adminRoles.js`
