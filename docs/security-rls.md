# Segurança RLS — checklist produção

Compare cada política no **Supabase Dashboard → Authentication → Policies** com os arquivos em `supabase/`.

**Ordem completa de migrations:** [migrations.md → Manifest](./migrations.md#manifest). Arquitetura e roadmap: [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md).

---

## Manifest versionado (por tabela)

| Tabela / objeto | Arquivo SQL | Policies esperadas |
|-----------------|-------------|-------------------|
| `perfis` | `perfis_rls_fix.sql` | `perfis_select_own`, `perfis_select_admin` |
| `perfis` | `perfis_premium_policies.sql` | `perfis_insert_own`, `perfis_update_own_usage` |
| `perfis` | `perfis_admin_policies.sql` | `perfis_update_admin` |
| `perfis` | `perfis_privileged_guard.sql` | Trigger `perfis_guard_privileged_columns` (não é policy) |
| `favoritos` | `favoritos_policies.sql` | `favoritos_select_own_or_admin`, `favoritos_insert_own`, `favoritos_delete_own` |
| `planos` | `destaques_planos_policies.sql` | `planos_select_public`, `planos_*_admin` |
| `destaques` | `destaques_planos_policies.sql` | `destaques_*_admin` (admin only) |
| `avaliacoes` | `avaliacoes_moderacao.sql` | `avaliacoes_insert_own`, `avaliacoes_select_*`, `avaliacoes_update_ia_own` |
| `avaliacoes` | `avaliacoes_admin_policies.sql` | `avaliacoes_select_admin`, `avaliacoes_update_admin`, `avaliacoes_delete_admin` |
| `logs` | `logs_policies.sql` | `Admin lê logs`, `Authenticated insert logs`, `logs_delete_admin` |
| `lugares` | `lugares_public_read.sql`, `lugares_admin_write.sql` | Leitura ativos + CRUD admin |
| `localizacoes`, `tags`, `lugares_tags` | `lugares_related_public_read.sql` | Leitura pública (+ admin lê inativos) |
| `localizacoes`, `lugares_tags` | `lugares_related_admin_write.sql` | INSERT/UPDATE/DELETE admin |
| `tags`, `subcategorias` | `taxonomia_admin_write.sql` | Leitura pública tags/subcategorias; escrita admin |
| `rotas` + filhos | `rotas_policies.sql` | Leitura pública + escrita admin |
| `rotas_favoritas` | `rotas_favoritas.sql` | CRUD próprio `user_id` |
| `roteiros` | `roteiros_policies.sql` | CRUD próprio `user_id` |
| `feedback` | `feedback.sql` | Insert user + leitura admin |
| `storage.objects` | `storage_admin_fotos.sql`, `storage-policies.sql`, … | Fotos admin; avatars próprios |

**Helpers obrigatórios:** `is_admin_user()` (`rotas_policies.sql`), `is_admin_or_dev()` (`perfis_rls_fix.sql`).

---

## Ordem sugerida de aplicação (P0)

### Segurança perfis + IA

1. `rotas_policies.sql` — define `is_admin_user()`
2. `perfis_rls_fix.sql` — define `is_admin_or_dev()`
3. `perfis_premium_policies.sql`
4. `perfis_ia_usage_write.sql` → `increment_uso_ia.sql` (re-run) → `perfis_privileged_guard.sql` → `align_perfil_usage_to_day.sql`
5. `perfis_admin_policies.sql`

### Conteúdo e favoritos

6. `favoritos_policies.sql`
7. `destaques_planos_policies.sql`
8. `lugares_public_read.sql` + `lugares_admin_write.sql` + `lugares_related_public_read.sql` + `lugares_related_admin_write.sql` + `taxonomia_admin_write.sql`
9. `avaliacoes_moderacao.sql` → `avaliacoes_admin_policies.sql`
10. `logs_policies.sql`
11. `storage_admin_fotos.sql` (após buckets)
12. **`security_p0_complete.sql`** — aplica itens 1–11 de uma vez (recomendado em produção)
13. `db_indexes.sql` + `db_indexes_phase2.sql` + `lugares_populares_rpc.sql` + `lugares_populares_rpc_fix.sql`

---

## Auditoria produção vs repo

1. **Dashboard → cada tabela** listada acima: contar policies e comparar nomes com a coluna "Policies esperadas".
2. **Policies extras** no Dashboard que não existem no repo → exportar SQL, decidir se remove ou versiona.
3. **Policies faltando** no Dashboard → aplicar arquivo SQL correspondente.
4. **RLS desligado** em alguma tabela sensível → habilitar + policies do repo.
5. **Testes manuais** abaixo (SQL Editor autenticado como user comum e como admin).

### Export rápido (SQL Editor)

```sql
SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'perfis', 'favoritos', 'destaques', 'planos', 'avaliacoes', 'logs', 'lugares'
  )
ORDER BY tablename, policyname;
```

Compare o resultado com o manifest acima.

---

## Testes manuais pós-deploy

### Usuário comum (`role = usuario`)

- `UPDATE perfis SET role='admin' WHERE id = auth.uid()` → trigger reverte / falha.
- `UPDATE perfis SET buscas_ia=0, roteiros_ia=0 WHERE id = auth.uid()` → contadores **não** mudam.
- `UPDATE perfis SET role='admin' WHERE id <> auth.uid()` → negado (RLS).
- `SELECT * FROM logs` → vazio.
- `SELECT * FROM destaques` → vazio / negado.
- `SELECT * FROM favoritos WHERE user_id <> auth.uid()` → vazio.
- `INSERT INTO favoritos (user_id, lugar_id) VALUES (auth.uid(), <lugar_ativo>)` → ok.
- `DELETE FROM favoritos WHERE user_id = auth.uid() AND lugar_id = <id>` → ok.
- Upload em `lugares-fotos` → negado.

### Admin (`role IN ('admin','dev')`)

- `UPDATE perfis SET role='estabelecimento' WHERE id = <outro_usuario>` → ok.
- `SELECT * FROM logs` → permitido.
- `SELECT count(*) FROM favoritos WHERE lugar_id = <id>` → permitido (relatórios).
- `UPDATE avaliacoes SET status = 'aprovado' WHERE id = <pendente>` → ok.
- CRUD em `lugares`, upload fotos → permitido.

### Dev only (`role = dev`)

- `SELECT`/`INSERT`/`UPDATE`/`DELETE` em `contratos_comerciais` e `contrato_documentos` → permitido (`is_admin_only()`).
- Role `admin` → negado nessas tabelas e em `POST /api/admin/contratos/...`.

---

## Drift

Se produção divergir do repo, exporte policies do dashboard e alinhe com os SQL versionados antes de escalar tráfego. Registre o diff no PR ou notas de deploy.

**Não re-aplicar** `perfis_premium_service_role_fix.sql` por completo — o trigger legado sobrescreve `perfis_privileged_guard.sql`. Use só `activate_premium_subscription.sql` se necessário.
