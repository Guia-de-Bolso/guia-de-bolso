# Authentication

Supabase Auth issues sessions. The app does **not** mint its own JWTs.

System view: [architecture.md](../architecture.md#authentication-flow). Portuguese original: [../authentication.md](../authentication.md).

---

## Session model

| Aspect | Detail |
|--------|--------|
| Transport | HTTP cookies via `@supabase/ssr` |
| Browser | `lib/supabase/client.js` |
| Server | `lib/supabase/server.js` |
| Refresh | **Only** `middleware.js` (`getUser`). Elsewhere `getSessionUser()`; browser `autoRefreshToken: false` |

No global React auth context.

---

## Providers

| Provider | UI | Platform |
|----------|-----|----------|
| Google OAuth | `AuthFlow` | Web → `/auth/callback` |
| Google native | `AuthFlow` | Capacitor Android / iOS (`signInWithIdToken`) |
| Apple native | `AuthFlow` | Capacitor **iOS only** |
| SMS OTP | `AuthFlow` | All (`+55`, 6 digits, Twilio) |

Key files: `components/AuthFlow.js`, `lib/nativeGoogleAuth.js`, `lib/nativeAppleAuth.js`, `lib/nativeSocialLoginInit.js`.

Redirect `?next=` is sanitized with [`lib/safeRedirectPath.js`](../../lib/safeRedirectPath.js).

| Environment | Site URL | Redirect |
|-------------|----------|----------|
| Local | `http://localhost:3000` | `…/auth/callback` |
| Production | `https://guiadebolso.app` | `…/auth/callback` |
| Vercel Preview | Preview URL | `https://<preview>/auth/callback` |

---

## Native (Capacitor)

| Platform | Google | Apple |
|----------|--------|-------|
| Web | OAuth redirect | Hidden |
| Android | Native (`webClientId`) | Hidden (policy) |
| iOS | Deep-link OAuth by default; native if `NEXT_PUBLIC_IOS_GOOGLE_NATIVE=true` | Native |

`NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID` = same Web client as Supabase Google. iOS also needs `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID` and reversed URL scheme in `ios/GoogleAuth.xcconfig`. After changing `NEXT_PUBLIC_*`, **redeploy** (WebView loads `https://app.guiadebolso.app`).

iOS Google return: reversed client ID as URL scheme; `AppDelegate` → `CapAppAuthURLHandler`. Test on a **physical** iPhone.

---

## Profiles (`perfis`)

`id` = `auth.users.id`. Roles: `usuario`, `admin`, `dev`, `estabelecimento`. Premium flags and IA counters live here. Bootstrap: `lib/ensurePerfil.js`.

| Resource | Rule |
|----------|------|
| Active places | Public RLS |
| Favorites, reviews | Login + `auth.uid()` |
| AI search / itinerary | Login + quotas |
| Public reviews | `status = 'aprovada'` |
| Admin CMS | `admin` or `dev` |
| Partners, contracts, logs, taxonomy | **`dev` only** |

Guards: `app/admin/layout.js` (server) + `AdminShell` + RLS. Never trust the client alone.

### Premium quotas

| Tier | AI searches / day | AI itineraries / day |
|------|-------------------|----------------------|
| Signed-in free | **10** | **2** |
| Premium | Unlimited | Unlimited |

Reset: midnight `America/Sao_Paulo`. Reserve with `increment_*_ia` before Claude; `decrement_*_ia` on failure.

API codes: `LOGIN_REQUIRED` (401), `LIMIT_REACHED` (403), `RATE_LIMITED` (429).

`LoginModal` for favorite, review, and AI when logged out. Curated atrativos remain readable.

Related: [data-flows.md](./data-flows.md), [security-rls.md](../security-rls.md), [api.md](../api.md).
