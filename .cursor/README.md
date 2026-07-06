# Cursor — Guia de Bolso

Configuração de **rules** e **hooks** para o agente do Cursor neste repositório.

## Rules (`.cursor/rules/*.mdc`)

| Arquivo | Quando ativa | Função |
|---------|--------------|--------|
| `core-standards.mdc` | Sempre | JS, docs, segredos, testes |
| `api-routes.mdc` | `app/api/**` | Auth, rate limit, checklist de segurança |
| `supabase-rls.mdc` | `supabase/**` | RLS, policies, apply em produção |
| `admin-panel.mdc` | `app/admin/**` | Guard server + roles |
| `tests.mdc` | `lib/**` | Quando criar `*.test.js` |

As rules entram automaticamente quando você edita arquivos que batem com o glob, ou sempre no caso de `core-standards`.

## Hooks (`.cursor/hooks.json`)

| Evento | Script | Comportamento |
|--------|--------|---------------|
| `beforeShellExecution` | `block-risky-shell.mjs` | Bloqueia `git push --force`, `git reset --hard`, `git add .env*` |
| `beforeSubmitPrompt` | `block-secrets-prompt.mjs` | Bloqueia prompt com API keys / JWT / private key |
| `afterFileEdit` | `lint-edited-file.mjs` | `eslint --fix` no `.js` editado em app/lib/components |
| `postToolUse` (Write/StrReplace) | `api-edit-reminder.mjs` | Lembrete de atualizar `SECURITY_CHECKLIST.md` |

### Ativar / depurar hooks

1. Salve `hooks.json` — o Cursor recarrega ao salvar.
2. Se não disparar: **reinicie o Cursor**.
3. Veja logs em **Settings → Hooks** ou no output channel **Hooks**.

## Script local

```bash
node scripts/check-api-security-docs.mjs
```

Falha se alguma rota em `app/api/**/route.js` não aparecer em `SECURITY_CHECKLIST.md`.

## Fluxo recomendado antes de merge

1. `npm test` e `npm run lint`
2. No chat do Cursor: pedir **Bugbot** nas mudanças da branch
3. Se tocou `app/api`, `app/admin` ou `supabase/`: pedir **Security Review**
4. Abrir PR → pedir **babysit este PR** se CI falhar

## Próximo passo (manual — Cursor Automations)

No Cursor: **Automations → New** (ou peça ao agente com a skill *automate*):

- **Trigger:** Pull request opened/updated no repo `guia-de-bolso`
- **Ação:** Rodar review (Bugbot + Security em paths sensíveis) e comentar resumo

Isso não fica no git — configura na conta Cursor.
