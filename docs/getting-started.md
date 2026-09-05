# Começando — fork e ambiente local

**[English](./en/getting-started.md)** · Onboarding de equipe: [`onboarding.md`](./onboarding.md)

Para quem **clonou ou fez fork** e quer uma instância própria. Quem já tem acesso ao Supabase de produção só precisa do `.env.local`.

---

## O que este repositório é

Produto em **produção** (Imbituba): Next.js 16 na Vercel, Supabase, Claude, apps Capacitor.

O Git inclui código, SQL e este handbook. **Não** inclui:

- Valores de `.env` de produção
- Dump do catálogo (lugares, fotos, contratos, usuários)
- Um `schema_baseline.sql` que recria o Postgres do zero

Isso é proposital. Um fork deve usar **o seu** projeto e **os seus** dados.

---

## Pré-requisitos

Node.js **20+** e **&lt; 26**, npm, Git, projeto Supabase, chave Anthropic (busca/roteiro IA).

Opcionais: Google OAuth, Twilio, Maps, Upstash, Firebase, credenciais das lojas.

---

## 1. Clone

```bash
git clone https://github.com/BrunoDislilerDev/guia-de-bolso.git
cd guia-de-bolso
npm install
cp .env.example .env.local
```

Mínimo no `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-5
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Nunca coloque `service_role` em `NEXT_PUBLIC_*`. Lista completa: [`environment.md`](./environment.md).

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Sem linhas em `lugares` a home fica vazia — esperado.

---

## 2. Supabase

1. Crie um projeto.
2. URL + chave **anon/publishable** no `.env.local`.
3. Authentication → Site URL `http://localhost:3000` e redirect `http://localhost:3000/auth/callback`.
4. Ative Google e/ou telefone se quiser login.

### Schema

Tabelas-base nasceram no Dashboard. O repo versiona SQL **incremental** em [`supabase/`](../supabase/).

Ambiente novo:

1. Recrie tabelas-base com [`database.md`](./database.md) e [`DATABASE_ARCHITECTURE.md`](./DATABASE_ARCHITECTURE.md).
2. Aplique o [manifesto](./migrations.md#manifest). Depois de tabelas filhas de rotas, rode de novo `rotas_policies.sql`.
3. Pacote de segurança: `security_p0_complete.sql` + [`security-rls.md`](./security-rls.md).
4. Buckets de Storage + `storage*.sql`.

Não aponte o fork para o projeto de produção.

### Primeiro admin (só dev)

```sql
UPDATE perfis SET role = 'dev' WHERE id = '<auth.users.id>';
```

`dev` = painel completo. `admin` = CMS operacional. [`authentication.md`](./authentication.md).

---

## 3. Verificar

| Check | Esperado |
|-------|----------|
| `GET /api/health` | `{ "ok": true, ... }` |
| `npm test` / `npm run lint` | Passa |
| Home | Lugares com `status = 'ativo'` |
| `/login` | Callback OAuth ou SMS, se configurado |

```bash
npm run lint && npm test && npm run check:api-security && npm run build
```

Apps nativos são opcionais (`android/`, `ios/`). A marca e os dados de produção **não** estão na [LICENSE](../LICENSE) para reuso público.
