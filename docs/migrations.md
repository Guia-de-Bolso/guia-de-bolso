# Migrations Supabase

Single source of truth for **apply order**, **best practices**, and **CLI workflow**. Schema reference: [database.md](./database.md). Architecture and roadmap: [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md).

---

## Modes of operation

### Current (SQL Editor)

Files in [`supabase/`](../supabase/) are pasted into the **Supabase SQL Editor** in the order below. Idempotent scripts (`IF NOT EXISTS`, `DROP POLICY IF EXISTS`) are safe to re-run when noted.

### Recommended (CLI)

1. Install [Supabase CLI](https://supabase.com/docs/guides/cli).
2. `supabase login` and `supabase link --project-ref rsdjbqzjdyeaedyqwrvc`
3. Copy new scripts to `supabase/migrations/` with timestamp prefix: `20260525120000_descricao.sql`
4. `supabase db push` on **staging** before production.

[`supabase/config.toml`](../supabase/config.toml) enables `[db.migrations]`.

### Staging

Use a separate Supabase project for Vercel Preview. Apply the full manifest there first, then run [security-rls.md](./security-rls.md) manual tests.

---

## Best practices

### One manifest, one order

Use the [Manifest](#manifest) below. Do not maintain parallel checklists in README or deployment docs — link here instead.

### File design

| Rule | Why |
|------|-----|
| **One concern per file** | Easier review and partial apply on legacy DBs |
| **DDL separate from seeds** | `taxonomia_lugares_cleanup.sql`, `plano_comercial_unico.sql` change data |
| **Idempotent DDL** | `CREATE INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` |
| **Policies: DROP then CREATE** | `DROP POLICY IF EXISTS "name" ON table` before `CREATE POLICY` |
| **Re-run tightening scripts** | `rotas_policies.sql` after `rota_dicas.sql` / `rotas_taxonomia.sql` |

### Policy ordering trap

Early route migrations may create **permissive** write policies (`USING (true)`). Always run **`rotas_policies.sql`** afterward so only admin/dev can write routes and children.

### Rollback

There is **no automatic down migration** in this repo. To revert:

- Write a compensating SQL file (e.g. `DROP INDEX`, `ALTER TABLE DROP COLUMN`), or
- Restore from Supabase backup / point-in-time recovery.

Document what was applied in the PR or deploy notes.

### Post-apply checklist

1. [security-rls.md](./security-rls.md) — manual RLS tests (non-admin cannot read `logs`, upload photos, escalate `role`).
2. Confirm `authenticated` can execute `increment_busca_ia`, `increment_roteiro_ia`, `decrement_busca_ia`, `decrement_roteiro_ia`, `align_perfil_usage_to_day`, `lugares_populares_ids`.
3. `EXPLAIN ANALYZE` on heavy paths: full active `lugares` select (busca), admin log filter, popular places RPC.
4. Compare Dashboard policies vs repo using [security-rls.md → Manifest](./security-rls.md#manifest-versionado-por-tabela) (`favoritos`, `destaques`, `planos`, `perfis` admin).

### Baseline export (recommended)

Periodically export production schema to `supabase/schema_baseline.sql` (read-only reference, not applied automatically). Helps when base `CREATE TABLE` is missing from the repo.

---

## Manifest {#manifest}

Run in order for a **new environment** that already has base tables from the Supabase Dashboard (`lugares`, `perfis`, `favoritos`, etc.). Skip steps already applied; never skip **`rotas_policies.sql`** after route child tables.

### A — Base and premium

| # | File | Purpose |
|---|------|---------|
| 0 | *(Dashboard)* | Core tables: `lugares`, `localizacoes`, `perfis`, `favoritos`, `tags`, `lugares_tags`, `subcategorias`, `avaliacoes`, `destaques`, `planos`, `logs`, … |
| 1 | `premium_usuario.sql` | `premium_*`, `buscas_ia`, `roteiros_ia`, `uso_ia_mes` on `perfis` |
| 1b | `perfis_ia_usage_write.sql` | Helper `perfis_ia_usage_write_bypass()` for RPC counter writes |
| 2 | `increment_uso_ia.sql` | RPC `increment_*_ia` + `decrement_*_ia` (reserva/estorno de cota) |
| 2b | `premium_uso_diario.sql` | Optional: comment on `uso_ia_mes` (daily key) |
| 2c | `premium_uso_dia_fix.sql` | Optional: one-time fix for legacy month keys |
| 3 | `perfis_email_admin.sql` | `perfis.email` + admin read |

### B — Helpers and perfis RLS

| # | File | Purpose |
|---|------|---------|
| 4 | `rotas_policies.sql` | Defines `is_admin_user()` (needed before some policies) |
| 5 | `perfis_rls_fix.sql` | `is_admin_or_dev()`, admin SELECT all perfis |
| 6 | `perfis_premium_policies.sql` | Own-row insert/select/update usage |
| 7 | `perfis_privileged_guard.sql` | Trigger: block self-escalation on `role`, premium, IA counters |
| 7b | `align_perfil_usage_to_day.sql` | RPC `align_perfil_usage_to_day` (realinhamento diário sem UPDATE client) |
| 7c | `perfis_admin_policies.sql` | Admin UPDATE any `perfis` (role em `/admin/usuarios`) |
| 8 | `perfis_role_check.sql` | CHECK roles; migrate `user` → `usuario` |

### C — Content, storage, taxonomy

| # | File | Purpose |
|---|------|---------|
| 9 | `tags_categorias.sql` | `tags.categorias` jsonb + seed |
| 9b | `tags_subcategorias.sql` | `tags.subcategorias` jsonb + reclassificação + novas tags por subcategoria |
| 9c | `tags_subcategorias_expansao.sql` | Mais tags por subcategoria (Lagoas, Dunas, Mirantes, Gastronomia, Noite, Cultura, etc.) |
| 9d | `tags_subcategorias_minimo10.sql` | Garante ≥10 tags por subcategoria (Serviços, Aventura, Compras) |
| 9e | **`tags_subcategorias_vinculos_definitivo.sql`** | **Correção final** de vínculos multi-subcategoria (rodar por último) |
| 9f | `tags_gastronomia_tipos_comida.sql` | Tags de especialidade (Pizza, Sushi, Hambúrguer, Massas, etc.) em **Gastronomia → Restaurantes** |
| 9g | `subcategoria_gastronomia_emporio_gourmet.sql` | Subcategoria **Gastronomia → Empório Gourmet** + vínculo de tags comuns |
| 9h | `tags_gastronomia_emporio_gourmet.sql` | Tags de emporium (Vinhos, Delicatessen, Degustação, etc.) em **Gastronomia → Empório Gourmet** |
| 15c | `lugares_purge_inativos.sql` | `lugares.desativado_em` + trigger; retenção 30 dias e alertas no admin |
| 10 | `fotos_migration.sql` | `lugares.fotos`, `rotas.fotos`; public storage read |
| 11 | `storage-policies.sql` | Avatar policies on `imagens` |
| 11b | `storage_avatar_legacy_bucket.sql` | Avatar policies on **Guia de Bolso - Imagens** (production bucket) |
| 12 | `logs_policies.sql` | FK `logs.user_id` → `perfis`; RLS |
| 13 | `lugares_visibilidade.sql` | `mostrar_endereco`, `mostrar_horarios` |
| 14 | `taxonomia_lugares_cleanup.sql` | Subcategorias + tag seeds + lugar migrations |
| 14b | `subcategoria_piscinas_naturais.sql` | **Superseded** by #14 — reference only |
| 15 | `lugares_qr_slug.sql` | `lugares.slug` unique + backfill |
| 15b | `lugares_parceiro_curadoria.sql` | `eh_parceiro`, `conteudo_curadoria`; migra vigentes de `destaques` |
| 15c | `lugares_parceiro_programa.sql` | Prazos 6 meses grátis, status parceiro, curadoria trimestral de avaliações |
| 15d | `lugares_historia_facebook.sql` | `historia_cultura`, `facebook_url` |
| 15e | `lugares_video.sql` | `video_url`, `tem_video` (1 vídeo por lugar; Storage em `lugares-fotos/…/videos/`) |

### D — Routes (curated)

| # | File | Purpose |
|---|------|---------|
| 16 | `rotas_taxonomia.sql` | `rotas_tags`, `tags.aplica_em_rotas`, `rota_pontos.lugar_id` |
| 17 | `rota_dicas.sql` | Table `rota_dicas` |
| 18 | **`rotas_policies.sql`** | **Tighten** RLS on `rotas`, `rota_pontos`, `rota_dicas`, `rotas_tags` |
| 19 | `rotas_localizacoes.sql` | 1:1 address/coords for routes |
| 20 | `rota_ponto_detalhes.sql` | Ordered lines per step |
| 21 | `rotas_favoritas.sql` | User route bookmarks |
| 21b | `rotas_rota_do_dia.sql` | `rota_do_dia_fixada_ate` — fixação opcional no admin (substitui `destaque` no app) |

### E — Reviews, plans, AI trips

| # | File | Purpose |
|---|------|---------|
| 22 | `avaliacoes_moderacao.sql` | Moderation columns + RLS |
| 22b | `avaliacoes_admin_policies.sql` | Admin SELECT/UPDATE/DELETE all `avaliacoes` (moderação) |
| 22c | `favoritos_policies.sql` | Own-row CRUD + admin SELECT (relatórios) |
| 22d | `destaques_planos_policies.sql` | `planos` read public / write admin; `destaques` admin only |
| 23 | `plano_comercial_unico.sql` | Single Parceiro plan seed |
| 24 | `roteiros_policies.sql` | RLS on AI `roteiros` |
| 25 | `feedback.sql` | Support table + RLS |

### F — Security P0 (lugares + storage write)

| # | File | Purpose |
|---|------|---------|
| 26 | `lugares_public_read.sql` | Public read active `lugares` |
| 27 | `lugares_related_public_read.sql` | `localizacoes`, `tags`, `lugares_tags` (read; admin vê inativos) |
| 28 | `lugares_admin_write.sql` | Admin CRUD `lugares` |
| 28b | `lugares_related_admin_write.sql` | Admin write `localizacoes`, `lugares_tags` |
| 28c | `taxonomia_admin_write.sql` | Admin write `tags`, `subcategorias` (+ RLS subcategorias) |
| 29 | `storage_admin_fotos.sql` | Admin-only upload to photo buckets |
| **29b** | **`security_p0_complete.sql`** | **Aplicação única de todo P0** (produção / SQL Editor) |

### G — Performance and RPC

| # | File | Purpose |
|---|------|---------|
| 30 | `db_indexes.sql` | Phase 1 indexes |
| 31 | `db_indexes_phase2.sql` | Phase 2 indexes (taxonomy, logs GIN, …) |
| 32 | `lugares_populares_rpc.sql` | RPC popular places |
| 33 | `lugares_populares_rpc_fix.sql` | Ensures `lugar_id bigint` return (re-run safe) |

### I — Admin financeiro e comercial

| # | File | Purpose |
|---|------|---------|
| 34 | `despesas_operacionais.sql` | `despesas_config`, `despesas_operacionais`, `despesas_lancamentos` + RLS admin/dev |
| 34b | `contratos_comerciais.sql` | Contratos comerciais de parceiros, documentos (PDF/DOCX), bucket privado `contratos-parceiros`, RLS **admin-only** (`is_admin_only()`) |

### H — Optional / ops

| # | File | Purpose |
|---|------|---------|
| — | `grant_admin_role.sql` | Manual bootstrap admin by email |
| — | `logs_retention.sql` | Ops comments only |
| — | `schema_baseline.sql` | *(future)* exported production schema |

### P0 security quick path (existing production)

If you only need to align security on a live DB, minimum order from [security-rls.md](./security-rls.md):

1. `rotas_policies.sql`
2. `perfis_rls_fix.sql` → `perfis_premium_policies.sql` → `perfis_ia_usage_write.sql` → `increment_uso_ia.sql` → `perfis_privileged_guard.sql` → `align_perfil_usage_to_day.sql` → `perfis_admin_policies.sql`
3. `favoritos_policies.sql` → `destaques_planos_policies.sql` → `avaliacoes_admin_policies.sql`
4. `lugares_public_read.sql` + `lugares_admin_write.sql` + `lugares_related_public_read.sql`
5. `logs_policies.sql`
6. `storage_admin_fotos.sql` (after buckets exist)
7. `db_indexes.sql` + `db_indexes_phase2.sql` + `lugares_populares_rpc_fix.sql`

---

## Related

- [DATABASE_ARCHITECTURE.md](./DATABASE_ARCHITECTURE.md) — roadmap phases 0–4
- [database.md](./database.md) — columns, RPC, query catalog
- [deployment.md](./deployment.md) — production Supabase setup
