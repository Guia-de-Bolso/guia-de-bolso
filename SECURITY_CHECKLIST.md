# Security Checklist — Guia de Bolso

**Última auditoria:** 2026-07-06  
**Escopo:** código em `/app`, `/lib`, `/components`, `/middleware.js`, `supabase/*.sql`, variáveis de ambiente documentadas.

## Resumo executivo

O projeto separa bem segredos de servidor (`ANTHROPIC_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) do cliente e usa RLS em várias tabelas. **Remediação P0 versionada** em `supabase/security_p0_complete.sql` (aplicar no SQL Editor de produção). Itens P1+ permanecem no roadmap abaixo.

**Aplicar P0 em produção:** Supabase → SQL Editor → colar e executar [`supabase/security_p0_complete.sql`](../supabase/security_p0_complete.sql). Pré-requisitos: `rotas_policies.sql`, `perfis_rls_fix.sql`, `perfis_premium_policies.sql`, `perfis_ia_usage_write.sql`, `increment_uso_ia.sql`, `lugares_public_read.sql`, `avaliacoes_moderacao.sql`, buckets `lugares-fotos` / `rotas-fotos`.

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
| `/api/health` | GET | Pública | — | Não | Smoke deploy; sem dados sensíveis |
| `/api/explorar` | GET | Pública | — | Não | Agregados de categorias para home |
| `/api/atrativos` | GET | Pública | — | Não | Lista atrativos curados |
| `/api/atrativos/catalogo` | GET | Pública | — | Não | Catálogo leve para clientes |
| `/api/waitlist` | POST | Pública | — | Sim (`waitlistRateLimit`) | Insert waitlist + e-mail Resend |
| `/api/planos-rapidos` | POST | Obrigatória | — | Não | Atalhos de plano comercial (admin flow) |
| `/api/perfil/avatar` | POST | Obrigatória | — | Não | Upload via service role; MIME/tamanho validados |
| `/api/conta` | DELETE | Obrigatória | — | Não | Exclusão de conta (App Store / Play) |
| `/api/auth/logout` | POST | Opcional | — | Não | Encerra sessão Supabase |
| `/api/premium/verify-apple` | POST | Obrigatória | — | Não | Valida receipt IAP Apple |
| `/api/premium/verify-play` | POST | Obrigatória | — | Não | Valida purchase Play Billing |
| `/api/push/register` | POST, DELETE | Obrigatória | — | Não | Registro/desativação de token FCM/APNs (service role upsert) |
| `/api/admin/push/send` | POST | Obrigatória | `admin` ou `dev` (`requireAdminApi`) | Não | Envio push via Firebase Admin; destinatários explícitos |
| `/api/admin/push/process` | POST | Obrigatória | `admin` ou `dev` (`requireAdminApi`) | Não | Processa eventos de conteúdo pendentes + `revalidatePath` home/landing |
| `/api/cron/push-automations` | GET | `CRON_SECRET` | — | Não | Clima, destaque semanal, roteiro e fila de conteúdo |
| `/api/cron/lugares-purge` | GET | `CRON_SECRET` | — | Não | Purge lugares desativados 30d+ |
| `/api/admin/usuarios/[id]` | DELETE | Obrigatória | `admin` (`requireAdminOnlyApi`) | Não | Exclusão de usuário (service role) |
| `/api/admin/contratos/[id]/documentos` | POST | Obrigatória | `dev` | Não | Upload documento contrato |
| `/api/admin/contratos/documentos/[docId]` | GET, DELETE | Obrigatória | `dev` | Não | Download/remoção de documento |

**Outras rotas sensíveis:** `app/auth/callback` (OAuth), `app/q/[slug]` (redirect + log via service role).

---

## Tabela de prioridades (status operacional)

| Prioridade | Item | Status | Notas |
|------------|------|--------|-------|
| P0 | Policy `logs` SELECT com `USING (true)` | **Corrigido (repo)** | `logs_policies.sql` → `is_admin_or_dev()`; aplicar `security_p0_complete.sql` |
| P0 | `perfis` UPDATE próprio sem restrição de colunas | **Corrigido (repo)** | Trigger `perfis_privileged_guard.sql` bloqueia `role`, `premium_*`, contadores IA |
| P0 | Storage `lugares-fotos` / `rotas-fotos` INSERT para `authenticated` | **Corrigido (repo)** | `storage_admin_fotos.sql` — só `is_admin_user()` |
| P0 | Policies de escrita `lugares` / `destaques` não versionadas | **Corrigido (repo)** | `lugares_admin_write.sql`, `destaques_planos_policies.sql`, `lugares_related_admin_write.sql` |
| P0 | RLS `favoritos` não versionado | **Corrigido (repo)** | `favoritos_policies.sql` |
| P0 | Admin UPDATE `perfis` de outro usuário | **Corrigido (repo)** | `perfis_admin_policies.sql` + trigger |
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
| **Evidência** | `supabase/logs_policies.sql` — policy `"Admin lê logs"` com `FOR SELECT TO authenticated USING (public.is_admin_or_dev())`. |
| **Solução** | Aplicar `security_p0_complete.sql` em produção. Auditar vazamento prévio no Dashboard → logs. |

---

### 2. Escalação de privilégio via UPDATE em `perfis` (próprio registro)

| Campo | Valor |
|-------|--------|
| **Risco** | Critical |
| **Impacto** | Usuário autenticado pode definir `role = 'admin'` ou `premium_ativo = true` e obter acesso ao painel admin ou IA ilimitada, conforme colunas graváveis. |
| **Probabilidade** | Likely se policy `perfis_update_own_usage` / `perfis_update_own` permitir UPDATE na linha inteira. |
| **Evidência** | `supabase/perfis_premium_policies.sql` + `perfis_privileged_guard.sql` — trigger congela colunas privilegiadas em self-update. |
| **Solução** | Aplicar `security_p0_complete.sql` (recria trigger). Contadores IA só via RPC `increment_*_ia`. |

---

### 3. Upload de fotos de lugares/rotas por qualquer usuário autenticado

| Campo | Valor |
|-------|--------|
| **Risco** | Critical |
| **Impacto** | Conteúdo malicioso (imagem ofensiva, malware hospedado), custo de storage, troca visual de estabelecimentos se paths forem adivinháveis. |
| **Probabilidade** | Possible (requer conta; SMS/Google reduzem bots mas não eliminam). |
| **Evidência** | `supabase/fotos_migration.sql` (só leitura pública) + `storage_admin_fotos.sql` (escrita admin). |
| **Solução** | Aplicar `security_p0_complete.sql`; validar no Dashboard que não restam policies `Auth upload *`. |

---

### 4. Policies de escrita em `lugares` / `destaques` ausentes no repositório

| Campo | Valor |
|-------|--------|
| **Risco** | Critical (se produção estiver sem RLS de escrita) / High (se só no Dashboard, drift) |
| **Impacto** | Sem policies de INSERT/UPDATE/DELETE versionadas: risco de tabela aberta no Dashboard ou bloqueio do admin; difícil auditar deploys. |
| **Probabilidade** | Possible |
| **Evidência** | `lugares_admin_write.sql`, `destaques_planos_policies.sql`, `lugares_related_admin_write.sql`, `taxonomia_admin_write.sql`. |
| **Solução** | Aplicar `security_p0_complete.sql`; comparar policies ativas com `docs/security-rls.md`. |

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
| **Impacto** | Conta legítima ou comprometida pode esgotar cota Anthropic; DDoS econômico mesmo com limite diário de 10 buscas (múltiplas contas). |
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

1. **Imediato (P0):** Aplicar `security_p0_complete.sql` no Supabase de produção; validar admin (CRUD lugar, taxonomia, fotos) e usuário comum (favoritos, sem leitura de logs).
2. **Semana 1 (P1):** Rate limit IP nas APIs IA; middleware admin; consolidar policies `rotas_tags`/`rota_dicas`.
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
