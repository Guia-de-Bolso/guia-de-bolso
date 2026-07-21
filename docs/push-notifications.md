# Push notifications (Capacitor + FCM)

Notificações push no app nativo iOS/Android via `@capacitor/push-notifications` e Firebase Cloud Messaging (FCM).

## Arquitetura

```mermaid
sequenceDiagram
  participant App as App nativo
  participant API as /api/push/register
  participant DB as push_tokens
  participant Admin as /api/admin/push/send
  participant FCM as Firebase Admin

  App->>App: requestPermissions + register
  App->>API: POST token + platform
  API->>DB: upsert (service role)
  Admin->>DB: tokens habilitados
  Admin->>FCM: sendEachForMulticast
  FCM-->>App: notificação
  App->>App: tap → deep link interno (data.url)
```

## Pré-requisitos (uma vez)

Confirme estes itens **antes** do teste no aparelho:

| # | Item | Como saber que está ok |
|---|------|------------------------|
| 1 | SQL `push_tokens` no Supabase | Tabela existe no SQL Editor |
| 2 | `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` na Vercel + **Redeploy** | Env salva em Production |
| 3 | Branch mergeada em `main` **ou** Preview com a feature | Toggle “Notificações push” aparece no Perfil |
| 4 | `android/app/google-services.json` local | Arquivo presente (não vai no git) |
| 5 | `ios/App/App/GoogleService-Info.plist` no target App | Aparece no Xcode no grupo App |
| 6 | Push no App ID `app.guiadebolso` (Apple) | Marcado em Identifiers |
| 7 | Chave APNs `.p8` no Firebase → Cloud Messaging | Só necessário para **iOS** |

Detalhes de Firebase/Vercel: seção [Variáveis de ambiente](#variáveis-de-ambiente) abaixo.

---

## Como testar depois (passo a passo)

Use **celular físico**. Simulador iOS não serve para push remoto.

### A. Sincronizar o nativo

Na raiz do repo, com a branch `feature/push-notifications` (ou `main` após o merge):

```bash
cd ~/Projects/guia-de-bolso
git pull
npx cap sync
```

Confirme os arquivos Firebase (se sumirem, copie de novo do Downloads):

```bash
# Android
ls android/app/google-services.json

# iOS
ls ios/App/App/GoogleService-Info.plist
```

### B. Android

1. Abra o Android Studio:
   ```bash
   npx cap open android
   ```
2. Conecte um celular Android (USB + depuração) **ou** use um emulador **com Play Services**.
3. Rode o app (▶ Run) no target `app`.
4. Faça **login** no app.
5. Vá em **Perfil → Notificações push** e ative o toggle.
6. Aceite a permissão do sistema (Android 13+).
7. No Supabase → Table Editor → `push_tokens`: deve aparecer uma linha com `platform = android` e `enabled = true`.
8. Envie um push de teste (seção [Envio de teste](#envio-de-teste) abaixo).
9. A notificação deve chegar; ao tocar, o app abre o path de `url` (ex.: `/`).

**Problemas comuns (Android)**

| Sintoma | O que checar |
|---------|--------------|
| Toggle não aparece | App web antigo — precisa do deploy com a feature |
| Permissão negada | Ajustes do celular → Apps → Guia de Bolso → Notificações |
| Sem linha em `push_tokens` | Login + rede; logs do `POST /api/push/register` |
| Token registra, push não chega | `google-services.json` + env Firebase na Vercel + redeploy |

### C. iOS

1. Abra o Xcode:
   ```bash
   open ios/App/App.xcodeproj
   ```
2. Selecione o target **App**, Team correto, Bundle ID `app.guiadebolso`.
3. Conecte um **iPhone físico** (não simulador) → Run (▶).
4. Faça **login** no app.
5. Vá em **Perfil → Notificações push** e ative o toggle.
6. Aceite o alerta “Permitir notificações”.
7. No Supabase → `push_tokens`: linha com `platform = ios` e `enabled = true`.
8. Envie um push de teste (seção abaixo).
9. Toque na notificação e confira o deep link.

**Problemas comuns (iOS)**

| Sintoma | O que checar |
|---------|--------------|
| Toggle não aparece | Deploy da feature no servidor que o WebView carrega |
| Sem token / registrationError | Push ligado no App ID + `GoogleService-Info.plist` no target |
| Token ok, push não chega | APNs `.p8` no Firebase Cloud Messaging + `FirebaseApp.configure()` no AppDelegate |
| Token parece hex curto (~64 chars) | Build antigo sem FCM — precisa rebuild com Firebase Messaging (token FCM é mais longo) |
| Funciona em Debug, falha em TestFlight | Trocar `aps-environment` para `production` no release |

> No Xcode, **“Push Notifications Console”** não é a capability — é só o console da Apple. O projeto já tem `aps-environment` em `App.entitlements`.

### D. Envio de teste

Conta com role **admin** ou **dev**. Substitua o UUID do usuário (o mesmo da linha em `push_tokens`):

```bash
curl -X POST https://app.guiadebolso.app/api/admin/push/send \
  -H "Content-Type: application/json" \
  -H "Cookie: <cookie da sessão admin no browser>" \
  -d '{
    "title": "Teste Guia de Bolso",
    "body": "Se você recebeu, push está ok",
    "url": "/",
    "userIds": ["<uuid-do-usuario>"]
  }'
```

Resposta esperada:

```json
{ "ok": true, "sent": 1, "failed": 0, "recipients": 1 }
```

Se `sent: 0` e mensagem de “nenhum dispositivo”, o token ainda não foi registrado ou `enabled = false`.

### E. Critérios de sucesso

- [ ] Toggle no Perfil (só nativo, usuário logado)
- [ ] Linha em `push_tokens` após ativar
- [ ] Notificação chega com o app em background
- [ ] Toque abre a rota `url` (path interno, ex. `/` ou `/lugares/...`)
- [ ] Logout desativa o token (`enabled = false` ou DELETE na API)

---

## Configuração detalhada

### 1. Banco (Supabase)

Executar no SQL Editor:

- [`supabase/push_tokens.sql`](../supabase/push_tokens.sql)

Ou migration: `supabase/migrations/20260713180000_push_tokens.sql`.

### 2. Firebase

1. Projeto no [Firebase Console](https://console.firebase.google.com/).
2. App **Android** `app.guiadebolso` → `android/app/google-services.json` (gitignored).
3. App **iOS** `app.guiadebolso` → `ios/App/App/GoogleService-Info.plist` (gitignored; já referenciado no Xcode).
4. **Cloud Messaging** → chave APNs `.p8` (iOS).
5. Service account com FCM → configurar na Vercel (seção seguinte).

### 3. iOS (projeto)

- `aps-environment` em `ios/App/App/App.entitlements` (`development` em Debug; `production` no release loja).
- `AppDelegate.swift` configura `FirebaseApp` e converte o token **APNs → FCM** (obrigatório para `firebase-admin`).
- Pacotes SPM no target App: `FirebaseCore` + `FirebaseMessaging`.
- App ID com Push Notifications no Apple Developer.
- `GoogleService-Info.plist` no target App.

### 4. Android (projeto)

- `POST_NOTIFICATIONS` no `AndroidManifest.xml`.
- `google-services.json` em `android/app/`.

## Variáveis de ambiente

A Vercel costuma **rejeitar** o JSON da service account com quebras de linha. Use uma das opções abaixo.

### Opção 1 — Base64 (recomendada)

```bash
node scripts/encode-firebase-service-account.mjs ~/Downloads/seu-projeto-firebase-adminsdk.json
```

Cole `FIREBASE_SERVICE_ACCOUNT_JSON_BASE64` na Vercel (Production) e faça **Redeploy**.

### Opção 2 — JSON em uma linha

O mesmo script imprime `FIREBASE_SERVICE_ACCOUNT_JSON` minificado.

### Opção 3 — Três variáveis

| Variável | Conteúdo |
|----------|----------|
| `FIREBASE_PROJECT_ID` | `project_id` |
| `FIREBASE_CLIENT_EMAIL` | `client_email` |
| `FIREBASE_PRIVATE_KEY` | `private_key` com `\n` literais |

```text
-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n
```

Local: mesma variável em `.env.local`. Ver [`.env.example`](../.env.example).

## Fluxo no app

1. Usuário logado → **Perfil → Notificações push**.
2. Permissão do SO → `PushNotifications.register()` → `POST /api/push/register`.
3. Preferência em `localStorage` (`gb_push_notifications_enabled`).
4. Logout → `DELETE /api/push/register`.
5. Tap → path interno em `data.url` (`safeRedirectPath`).

## Envio (admin)

`POST /api/admin/push/send` — role `admin` ou `dev`.

```json
{
  "title": "Destaque da semana",
  "body": "Confira o novo parceiro no guia",
  "url": "/lugares/uuid-do-lugar",
  "userIds": ["uuid-usuario-1", "uuid-usuario-2"]
}
```

**Sem broadcast global** na v1 — sempre informe `userIds`.

## Arquivos principais

| Arquivo | Função |
|---------|--------|
| `lib/pushNotifications.js` | Cliente Capacitor |
| `lib/pushTokens.js` | Persistência |
| `lib/pushMessaging.js` / `lib/serviceAccountEnv.js` | Firebase Admin + env Vercel |
| `app/api/push/register/route.js` | Registro |
| `app/api/admin/push/send/route.js` | Envio admin |
| `components/PushNotificationsProvider.js` | Sync login/logout |
| `components/perfil/PerfilPushToggleRow.js` | Toggle no perfil |
| `scripts/encode-firebase-service-account.mjs` | Gera env para Vercel |

## Checklist de release

- [ ] SQL `push_tokens` em produção
- [ ] Env Firebase na Vercel + redeploy
- [ ] Feature em `main` / produção (`app.guiadebolso.app`)
- [ ] `google-services.json` / `GoogleService-Info.plist` no build local
- [ ] APNs no Firebase (iOS)
- [ ] Teste Android + iOS (critérios acima)
- [ ] Antes da App Store: `aps-environment` = `production`
