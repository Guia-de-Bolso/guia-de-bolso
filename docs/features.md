# Features

User-facing product reference for **Guia de Bolso** (Imbituba, SC). Behavior is derived from the current codebase; implementation details live in [Architecture](./architecture.md) and [API](./api.md).

**Product question the app answers:** *“What should I do right now?”*

---

## Roles and access (summary)

| Role | Typical access |
|------|----------------|
| **Guest** | Browse places, categories, curated routes, place details; mini weather on outdoor detail; **no** AI search/roteiros; full `ClimaSheet` requires login |
| **Logged-in user** | Favorites, reviews, AI search (10/day), AI roteiros (2/day), saved roteiros, full outdoor weather sheet on place detail |
| **Premium** | Unlimited AI search & roteiros (weather on detail is login-gated, not premium-gated today) |
| **Admin** | Operational CMS at `/admin` (`canAccessAdmin`: `admin` or `dev`) — locais, atrativos, avaliações, relatórios |
| **Dev** | Same as admin **plus** sensitive areas (`canAccessDevAdmin`, `DEV_ONLY_ADMIN_PATHS` in `lib/adminRoles.js`): IA & custos, despesas, parceiros, contratos, feedback, usuários, logs, taxonomia |

**Public catalog (production):** `lib/publicCatalog.js` sets `PUBLIC_APP_PARTNERS_ONLY = false` — consumer lists and home feeds include **every** active place (curated nature spots, free-tier listings and partners alike); `status = 'ativo'` is the only visibility gate, so test drafts must stay in `em_analise`/`desativado`. Flip the flag back to `true` to restrict feeds to `eh_parceiro = true`.

---

## 1. First-run onboarding

**Description**  
Full-screen intro on first visit: **4 slides** with nature backgrounds (beach, lagoon, mountain, waterfall). Last slide explains **AI search & roteiros**, daily free limits, and Premium. Dismissal is stored in `localStorage.onboarding_visto`.

**User goal**  
Understand the product before exploring; choose login or guest browse.

**Main flows**
1. User opens `/` for the first time → `Onboarding` overlay if `onboarding_visto` is unset (4 slides).
2. **Pular** or **Entrar no guia** (guest) → `onComplete('login')` → parent `router.replace('/login?from=onboarding')`.
3. **Entrar no guia** / **Pular** when already logged in → `onComplete('home')` (avoids `/login` redirect loop).
4. **Explorar sem criar conta** → `onComplete('home')` only.
5. Background images served from `/public/onboarding/*.jpg` (local assets).

**Edge cases**
- Clearing `localStorage` shows onboarding again.
- Onboarding waits until auth check finishes (`onboardingChecked`) to avoid flashing home then overlay.
- Works for guests and logged-in users alike (CTAs still route to login on finish/skip).

---

## 2. Home — contextual header

**Description**  
Top bar with **Guia de Bolso** branding (`Logo`), region label (“Imbituba, SC”), **inline weather** (temperature + emoji from Open-Meteo), and avatar (login link or user photo).

**User goal**  
See where the guide applies and current regional weather at a glance.

**Main flows**
1. Home secondary load → `fetchClimaApis(IMBITUBA_COORDS)` → `temperaturaClima` / `climaEmoji` passed to `HomeContextHeader`.
2. Guest taps avatar area → `/login` or profile when logged in.

**Edge cases**
- Weather API failure → header shows `--°` or omits emoji; hero may still show `--°C` in the metrics grid.
- Geolocation is **not** required for the header (fixed regional coords for climate).
- `getFraseContextual()` remains in `lib/homeContext.js` for chips/presets but is **not** shown in the header card.

---

## 3. Smart search (AI)

**Description**  
Natural-language search: user types or picks a chip; Claude ranks active places using category, tags, subcategory, and open/closed status.

**User goal**  
Find places matching intent (“romantic dinner”, “open now”, “sunset spot”) without browsing categories.

**Main flows**
1. User focuses search → browse panel may open (recent + popular).
2. User submits query (Enter or send) → must be **logged in** → client checks quota → `POST /api/buscar`.
3. Results panel shows ranked cards with favorite toggle; usage counter updates.
4. Quick chips (e.g. “Abertos agora”) set query + optional status filter and run search immediately.
5. **Planos rápidos** cards trigger the same search pipeline with preset queries/filters.

**Edge cases**
- **Guest** → `LoginModal` with motivo `busca`.
- **Daily limit reached** (10/day) → `PremiumPaywallSheet` (`busca`) with countdown; search panel may close. Inline `DailyLimitCountdown` while search is open.
- Empty catalog after status filter → API message, zero results.
- Network/API error → inline error string; optimistic UI not applied to results.
- Server returns `LOGIN_REQUIRED` / `LIMIT_REACHED` even if client pre-check passed (session/expiry race).
- Usage counter: hydrates from `localStorage` on same calendar day, then syncs via `GET /api/uso-premium` (server is source of truth). Shows “Carregando uso de IA…” until cache or API is ready — never a false `0/3` flash.
- When daily limit reached with search open: inline `DailyLimitCountdown` + paywall; label shows `X/10 hoje`.

---

## 4. Search — browse mode (no query yet)

**Description**  
Overlay when the search field is focused: **recently viewed** places (device) and **popular** places (same `fetchLugaresPopulares` ranking as §8, limit **5** in browse).

**User goal**  
Resume exploration or pick a trending place without typing.

**Main flows**
1. Focus search → `searchMode = "browse"` → `SearchBrowsePanel` shows recent + popular.
2. Tap a row → navigate to `/lugares/[id]` (recent list updated on detail view).
3. Blur empty field → panel closes (with small delay to allow chip clicks).

**Edge cases**
- Recent list is **local only** (`lugares_visitados`, max 5) — not synced across devices.
- No favorites in DB → popular falls back to newest active places.
- Escape key closes full search overlay when in search mode.

---

## 5. Search — status filter (Todos / Abertos / Fechados)

**Description**  
Chip row to narrow AI search by real-time opening status (`lib/horarios.js`, Brazil timezone).

**User goal**  
Only see places that are open now (or intentionally closed).

**Main flows**
1. User selects filter → state `filtroBuscaStatus` updates.
2. On search, filter sent to API → pre-filters catalog before Claude → post-filters results.

**Edge cases**
- “Abertos” with no matching places → empty results + API message.
- Public beaches without `horarios` may classify as closed/open per parser defaults.
- Filter applies to AI path only, not to static home sections.

---

## 6. Home — “O que fazer agora” (hero suggestion)

**Description**  
Large hero card with one **contextual place**: photo, badges (e.g. trending), a **2×2 metrics grid** (distance, experience duration, regional temperature, estimated drive time), favorite, and **EXPLORAR** CTA to detail.

**User goal**  
Get a single strong recommendation without searching.

**Main flows**
1. Phase 1 loads active routes via `GET /api/rotas` → `pickHeroRotaCiclo` picks **one** route per day (round-robin: no repeat until all eligible routes shown, then restarts). Pool: `ativa !== false` + valid cover (`getCapaFromRota`). TZ: America/Sao_Paulo via `dailySeed`.
2. Secondary home load fetches Open-Meteo for Imbituba → `temperaturaClima` passed into the hero.
3. Metrics: duration, distance, difficulty (+ temperature). CTA → `/atrativos/[id]`.

**Selection criteria**  
Stable order by route `id`; index = `daysSinceEpoch(dailySeed) % pool.length`. Not places/curadoria.

**Edge cases**
- No places / still loading → placeholder “Carregando sugestão…”.
- Supabase failure for active places → hero section replaced by gray `SectionUnavailable` (“Conteúdo indisponível no momento”), not a silent empty hero.
- Without GPS, distance may show static/legacy `distancia` text; drive-time block shows `—` when distance cannot be parsed to km.
- Hero does **not** show open/closed or “best time” chips (those appear on list cards only when hours are configured).

---

## 7. Home — Parceiros do Guia

**Description**  
Horizontal carousel of places with `lugares.eh_parceiro = true` (plano único R$ 299). Shown between the hero and “Em alta hoje”. **One partner per category** per week, chosen deterministically (`weeklySeed`, `lib/homeSelection.js`). Table `destaques` is legacy and not used by the app.

**User goal**  
Discover official partner businesses in the guide.

**Main flows**
1. Home loads active places → `pickParceirosPorCategoria` → `ParceirosCarrossel` with badge “Parceiro do Guia”.
2. Admin toggles `eh_parceiro` on each place in **Locais** (no separate Destaques screen).

**Edge cases**
- Category without a partner → omitted from carousel.
- Carousel hidden when no partners are flagged.

---

## 8. Home — “Em alta hoje”

**Description**  
Horizontal list of up to **6** active **partner** places (`filterLugaresPublicos` → `eh_parceiro = true` when `PUBLIC_APP_PARTNERS_ONLY`), order shuffled daily via `dailySeed` (`pickEmAltaCuradoria` in `lib/homeSelection.js`). **Not** the favorites-based `lugares_populares` ranking (that path is for the search overlay “Populares”).

**User goal**  
See a rotating slice of official partners highlighted by the guide.

**Main flows**
1. `GET /api/lugares` (partners-only pool) → `pickEmAltaCuradoria` → `EmAltaCard`.
2. Star rating renders only when the place row includes `rating_medio` or `media_avaliacoes` (no per-card Supabase query).

**Edge cases**
- Empty partner pool → `SectionUnavailable` for “🔥 Em alta hoje”.
- Open/closed chip renders only when `mostrar_horarios` is true and `horarios` is non-empty (same rule as `PlaceCard`).
- Cards link to place detail; not the same algorithm as the hero atrativo (`pickHeroAtrativoCiclo` / `resolveAtrativoDoDia`).
- `conteudo_curadoria` is a separate badge flag (`lib/lugarBadges.js`); it does **not** gate this section today.

---

## 9. Home — “Planos rápidos”

**Description**  
Preset experience cards (morning, romantic afternoon, rainy day, nightlife, quick trip) that launch an AI search with a fixed query and filter.

**User goal**  
One-tap inspiration for common trip moods.

**Main flows**
1. Tap plan card → sets filter + runs `executarBusca(plano.query, plano.filtro)`.
2. Same login/quota/paywall rules as smart search.

**Edge cases**
- Requires login and search quota like any AI search.
- Does not create a saved roteiro — only search results.

---

## 10. Home — “Perto de você”

**Description**  
Bottom section listing nearby active places, sorted by calculated distance.

**User goal**  
Discover what is close right now.

**Main flows**
1. Loaded in a **secondary** home `useEffect` (after hero + trending) via `fetchLugaresProximos` → `sortLugaresPorDistancia` with GPS.
2. Tap card → place detail; first visible `PlaceCard` may use image `priority`.

**Edge cases**
- Geolocation denied/unavailable → order may be arbitrary; distance label weak or missing.
- Open/closed badge on `PlaceCard` follows the same `mostrar_horarios` + non-empty `horarios` rule as “Em alta”.
- Section shows its own loading copy while secondary fetch runs; fetch failure → `SectionUnavailable` (“Perto de você”).
- Complements hero/trending rather than replacing them.

---

## 11. Bottom navigation

**Description**  
Floating glass nav: **Início**, **Explorar** (`/categorias`), **Rotas**, **Favoritos**, **Perfil**.

**User goal**  
Move between main app areas with one thumb.

**Main flows**
1. Tap item → route change; active state from `pathname`.
2. Container uses `aria-label="Navegação principal"`; each link has an `aria-label` with the tab name.

**Edge cases**
- Hidden on some full-bleed flows only if page omits component (most consumer pages include it).
- `/categoria/[slug]` is reached from Explorar, not a nav tab.
- Interactive targets sized for touch (e.g. `h-11 w-11` on search controls elsewhere).

---

## 12. Category exploration (Explorar)

**Description**  
Dedicated **Explorar** screen at `/categorias`: sticky header with live totals, AI search entry (`ExplorarBuscaBar`), mood shortcuts (`ExplorarAtalhos`), featured category carousel (`ExplorarDestaqueCard`), and full category grid (`ExplorarCategoriaCard`). Catalog metadata in `lib/categorias.js`.

**User goal**  
Browse by type (Nature, Food, Night, etc.) when not using AI search.

**Main flows**
1. `/categorias` → **one** query `select("categoria, imagem_url, fotos")` on active `lugares`, counts + cover thumbnails aggregated client-side → tap → `/categoria/[slug]`.
2. Category page loads active places + `subcategorias` for slug; loading shows six `PlaceCardSkeleton` placeholders.
3. “Todos” or a subcategory chip filters client-side list.
4. `PlaceCard` → detail; geolocation sorts by distance when available.
5. Mood shortcut or search bar can deep-link to home AI search with a preset query (same login/quota rules as smart search).

**Edge cases**
- Invalid/empty slug → empty list after load.
- Supabase error on category grid → `UserErrorAlert` (“Não foi possível carregar os lugares”) with report hint and link back to `/categorias`.
- Subcategory chips only if rows exist in `subcategorias` for that category name.
- No login required for browsing.

---

## 13. Place detail

**Description**  
Conversion-focused page for a single active place: photo carousel, persuasion copy, quick actions, tags, optional hours, optional **weather widget** (outdoor categories), optional address/map, about, reviews, fixed navigation CTA.

**User goal**  
Decide to go now, contact the business, or navigate.

**Main flows**
1. Open `/lugares/[id]` → parallel load place, photos (`fotos` jsonb + `fotos_lugar`), location, tags, reviews, favorite/review state.
2. **Layout:** default is **Airbnb-style** (`LugarDetalheAirbnb`) in all environments; set `NEXT_PUBLIC_LUGAR_DETALHE_V2=false` for legacy hero overlay rollback.
2. **Establishment** (restaurant, salon, etc.): full gallery, tags, quick actions (Call / Instagram / Menu / Site when URLs exist), long about text — **all active places**, not only Parceiro; open/closed badge on hero when hours apply.
3. **Public** (beach, trail, etc.): info chips via quick actions — no call/menu row.
4. **Outdoor** (`Natureza`, `Aventura` with lat/lng): `LugarClimaWidget` shows live summary; tap **Ver mais** → `ClimaSheet` if logged in, else `LoginModal` (`clima`).
5. **Address block** when `mostrar_endereco` and `localizacoes.endereco_completo` — static map (Google Maps Static API) or fallback link to Google Maps.
6. Tap fixed CTA → choose or use preferred maps app → external navigation + `ir_agora` log.
7. Favorite, share, submit review (logged in).

**Edge cases**
- Inactive or missing id → “Lugar não encontrado”.
- Supabase error loading place → full-page `UserErrorAlert` with “Tentar novamente” (`router.refresh()`) and report hint.
- No photos → placeholder/gradient from `getCapaFromLugar`; hero gallery uses **`RemotePhoto`** (`GalleryHeroAirbnb` on V2 detail) or legacy `LugarHero`, with descriptive `alt` (place name).
- Photo carousel uses `lib/horizontalCarousel.js` (`snap-mandatory`, `useControlledPhotoCarousel` — at most ±1 slide per gesture); used in `GalleryHeroAirbnb`, `LugarHero`.
- **SEO (P0):** canonical place URLs `/lugares/{slug}` (301 from UUID), `generateMetadata` on place/route detail, `app/sitemap.js`, `app/robots.js`, shared helpers in `lib/seo.js` and `lib/lugarPublicPath.js`.
- **SEO (P1):** JSON-LD (`lib/seoJsonLd.js`) on place, route, and category pages; server `h1` + intro (`LugarSeoStatic`, category SSR header); category list SSR via `CategoriaPageClient` + `queryLugaresAtivos`; visible UI titles use `h2` where `h1` is reserved for SEO shell.
- **SEO (P2):** home SSR (`fetchHomePageInitialData`, `HomeSeoStatic`, `buildHomeJsonLd`); Explorar SSR (`fetchExplorarPageData`); landing `/imbituba`; `noindex` em login/favoritos/perfil via layouts; sitemap atualizado.
- No hours configured or `mostrar_horarios=false` → no compact hours row.
- No address or `mostrar_endereco=false` → no location card.
- Climate widget hidden if API fails (no error banner; section omitted).
- Hours, maps picker, climate sheet, and review sheets use `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` tied to sheet titles.
- Reviews: only `aprovada` shown; user’s pending review shows “awaiting approval” UX via `jaAvaliou`.
- One review per user per place (second attempt blocked).
- `profiles` join failure → fallback query without author names.
- Share: `navigator.share` or clipboard copy; user canceling share is silent.
- **Place profile visibility** — gallery, tags, establishment quick actions, and long description are shown for **all** active places; only the Parceiro badge remains paywalled (`lib/lugarVisibilidade.js`).
- Maps: first visit may open app picker sheet; preference stored in `localStorage`.
- Visit recorded to recent list on successful load.

---

## 14. Favorites

**Description**  
Per-user saved **places** (`favoritos`) and **curated atrativos** (`rotas_favoritas`) synced in Supabase. **Fase 1 offline:** ao favoritar, o app grava automaticamente um pacote local (IndexedDB + até 4 fotos via Cache API) para leitura sem sinal. Copy do benefício em onboarding, login, landing e `LoginModal` (`FAVORITO_OFFLINE_BENEFIT_BODY` em `lib/favoritosOffline.js`).

**User goal**  
Build a personal shortlist for the trip — including trails and beaches usable offline after favoriting once online.

**Main flows**
1. Logged in → heart on cards/detail → `favoritos` or `rotas_favoritas` insert/delete + log + **cache offline** (`lib/favoritosOfflineFetch.js`).
2. `/favoritos` — online: `syncAllFavoritosOffline` refreshes cache; offline: `listOfflineFavoritos` from IndexedDB; banner “Disponível offline” / “Modo offline”.
3. Tap place → `/favoritos/lugar/[id]` (client-only, `offlinePreferred` in `useLugarDetalhe`); tap atrativo → `/favoritos/atrativo/[id]`.
4. Remove from list → Supabase delete + `purgeOfflineFavorito` + optimistic UI revert on error.
5. Toast on add: *“Salvo! Disponível offline quando não houver sinal.”*

**Edge cases**
- Guest on `/favoritos` → CTA + `LoginModal` (subtitle mentions offline).
- Online fetch failure with prior sync → falls back to cached list (no hard error if cache exists).
- Online fetch failure with empty cache → `UserErrorAlert` with retry.
- Deactivated place drops from list (`status=ativo` filter on sync).
- Unfavoriting removes IndexedDB row; desfavoritar atrativo idem.
- **Not offline:** IA search, live weather, new reviews, admin — require network.
- **Capacitor** remote URL: online abre em `/` (Início); offline redireciona para `/favoritos` (`OfflineModeProvider` + `@capacitor/network`); bottom nav bloqueia outras abas com mensagem.
- **Mapas offline:** online, banner preventivo em favoritos/atrativos e lugares Natureza/Aventura (`OfflineMapsPrepareBanner`); offline, IR AGORA / Navegar no Maps abre `OfflineMapsSheet` com opção de abrir Google/Apple/Waze (se mapa baixado), copiar coordenadas e dicas de download (`lib/offlineMaps.js`, `lib/mapsCoordinates.js`).
- Favorite state on home resets when session ends.
- Place list rendered as semantic `<ul>` / `<li>`.

---

## 15. Reviews (ratings & comments)

**Description**  
Logged-in users submit 1–5 stars, optional **aspect chips** (category-aware via `lib/avaliacaoAspectos.js`), and a **required comment** (non-empty after trim). Claude pre-moderation runs via `POST /api/avaliacoes/analisar` and stores a hint on `sugestao_ia` for operators. Public list shows distribution, aspects, and recommendation summary after admin approval.

**User goal**  
Share experience and read social proof.

**Main flows**
1. Detail → “Avaliar” → `AvaliacaoForm` → insert `status: pendente` with `aspectos` jsonb → fire-and-forget AI analysis.
2. Approved reviews appear in `LugarAvaliacoesSection` with star histogram and aspect tags.
3. Admin approves/rejects with IA suggestion badge (see Admin CMS).

**Edge cases**
- Guest → `LoginModal` (`avaliar`).
- One review per user per place.
- Submit disabled until rating ≥ 1 and `comentario.trim()` is non-empty.
- Toast confirms submission; content hidden until approved.
- Aggregate rating on hero uses only approved reviews.
- AI analysis failure does not block submission; admin can still moderate manually.

---

## 16. Share place

**Description**  
Share current place URL via native share sheet or copy link.

**User goal**  
Send a place to friends or save for later.

**Main flows**
1. Hero share button → `navigator.share` or clipboard → toast “Link copiado!”.

**Edge cases**
- Non-HTTPS or unsupported share → clipboard path.
- User dismisses native share → no error shown.

---

## 17. Navigation (“Ir agora” / maps preference)

**Description**  
Open Google Maps, Apple Maps, or Waze with coordinates or address; optional default app.

**User goal**  
Start turn-by-turn navigation immediately.

**Main flows**
1. Place detail fixed CTA or location card → `openRoute`.
2. If no preference → bottom sheet to choose app → save `map_app_preferido`.
3. Profile → “App de navegação preferido” → same options.

**Edge cases**
- Missing coordinates → address-based URL query.
- Popup blockers may affect `window.open`.
- Preference is device-local (`localStorage`), not only `perfis.maps_preferido`.

---

## 18. Authentication

**Description**  
Sign-in via **Google OAuth** (web redirect or native on Capacitor), **Sign in with Apple** (Capacitor iOS only), or **SMS OTP** (Brazil +55, 11 digits). Used on `/login`, profile (guest), and `LoginModal` for gated actions.

**User goal**  
Access favorites, reviews, AI features, and saved roteiros.

**Main flows**
1. **Google (web)** → Supabase OAuth → `/auth/callback` → exchange code → log `login` → redirect home.
2. **Google (Capacitor Android/iOS)** → `@capgo/capacitor-social-login` → `signInWithIdToken` → `ensurePerfil` → log `login` → redirect (no `/auth/callback`).
3. **Apple (Capacitor iOS only)** → same native ID-token flow via `lib/nativeAppleAuth.js`; button hidden on web/Android.
4. **SMS** → enter phone → OTP → verify → success → redirect home.
5. **Login page** `/login` → redirects to `/` if already sessioned.
6. **Modal** context subtitles vary by motivo (`favoritar`, `busca`, `avaliar`, `rotas`, `premium`, etc.).

**Edge cases**
- OAuth error → redirect `/login?error=auth`.
- Native Google cancel → retry without nonce (`lib/nativeGoogleAuth.js`); Apple cancel → silent dismiss (`cancelled` flag).
- SMS: invalid length blocked client-side; resend cooldown 30s; max 3 resends then wait message.
- Wrong/expired OTP → clear code + error message.
- WhatsApp Auth: **not implemented** (planned).
- Account deletion signs out and logs request — **does not** call Supabase admin delete API (manual follow-up implied).

**Native config:** see [`authentication.md`](./authentication.md#native-login-capacitor) (`ios/GoogleAuth.xcconfig`, Vercel client IDs).

---

## 19. Profile

**Description**  
`/perfil` uses modular `components/perfil/*`: guest benefits + inline `AuthFlow`, or logged-in hero (`PerfilHero`), live stats (`PerfilStats` — favorites, reviews, saved roteiros), quick links, Premium card, and grouped settings with bottom sheets.

**User goal**  
Manage identity, preferences, and session.

**Main flows**
1. Guest → benefit list + login + “Continuar sem login”.
2. Logged in → parallel Supabase counts for favorites, `avaliacoes`, and `roteiros`; edit profile link; nav app preference sheet; logout; delete.
3. Logout → confirm → `signOut` → log → home.

**Edge cases**
- **Notificações** row hidden until push notifications ship.
- Delete account: confirmation copy warns permanence; signs out and logs `deletou_conta` — does not call Supabase admin delete API (manual follow-up implied).

---

## 20. Edit profile

**Description**  
`/perfil/editar` — update display name and upload avatar via **`POST /api/perfil/avatar`** (server-side Storage upload).

**User goal**  
Personalize account appearance.

**Main flows**
1. Load `perfis` nome/foto → edit → save upsert on `perfis`.
2. Photo upload → client compression (`lib/imageCompress.js`, avatar max 512px) → `multipart/form-data` to `/api/perfil/avatar` → `lib/avatarStorage.js` writes `avatars/{user_id}/avatar.jpg` to **Guia de Bolso - Imagens** (legacy production bucket) or `imagens` if present → updates `perfis.foto_url` (and `auth.updateUser` metadata on save).
3. Entry point: hero **Editar perfil** on `/perfil` (not duplicated under Conta settings).

**Image compression (client)**  
`compressImageFile` in `lib/imageCompress.js` skips files under 200KB; otherwise resizes via canvas (JPEG ~0.82). Used for avatars (`/perfil/editar`) and admin entity photos via `lib/storageUpload.js` (`uploadEntityPhoto` / `uploadEntityPhotos`).

**Edge cases**
- Requires session; unauthenticated users not routed here from profile edit link.
- SMS-only accounts (`usesPhoneAuth`) do not see the read-only email field on this screen.
- Upload failure leaves partial state with error message.
- API returns `503` if `SUPABASE_SERVICE_ROLE_KEY` is missing on the server.

---

## 21. Curated atrativos (admin-published trails)

**Description**  
Editorial atrativos at **`/atrativos`** and **`/atrativos/[id]`** (`/rotas` redirects 301): cover, **tipo de experiência** (fixed categories in `lib/atrativos.js`), **tags**, difficulty, duration, distance, ordered **pontos** with optional link to a **lugar**. “Atrativo do dia” featured card; list supports filter chips by experience type (`AtrativosCatalogo`).

**User goal**  
Follow a predefined trail or city walk with guidance.

**Main flows**
1. `/atrativos` lists atrativos with app palette (`#f0f4f3` / `#1a4a3a`); compact rows use **`RemotePhoto`**; featured “Atrativo do dia” cover uses **`next/image`** (`quality={60}`); horizontal chips filter by category when multiple types exist.
2. Tap route → detail with category icon, tag chips, step list with **ordered description lines per point**, **ordered tips** at the bottom, and metrics.
3. Admin `RotaForm`: route type, tags, multiple descriptions per step (no place link), map start point, dicas.
4. No login required to **view** list/detail (public read).

**Edge cases**
- Empty DB → empty state (“Nenhuma rota cadastrada ainda”) with map illustration.
- Inactive routes (`ativa=false`) depend on RLS/query (admin manages).
- Distinct from AI **roteiros** on same page.
- Route cards use semantic list markup where applicable.

---

## 22. AI trip roteiro (personalized itinerary)

**Description**  
Multi-step form (days, traveler profile, interests) → Claude generates markdown itinerary → optional save to `roteiros`.

**User goal**  
Get a custom day-by-day plan for the region.

**Main flows**
1. `/atrativos` → “Roteiro personalizado com IA” → login check → quota check → `RoteiroBottomSheet`.
2. Submit → `onValidateBeforeGenerate` re-checks login/quota (`validarRoteiroPermitido` in `RoteiroSection.js`) → `POST /api/roteiro` → `lib/roteiroParse.js` builds day/period/stop timeline → `RoteiroItineraryView` (accordion); footer **Salvar** fixed on scroll.
3. “Salvar” → `POST /api/roteiro/salvar` → list on `/atrativos`.
4. Saved list → tap → `RoteiroViewModal` with the same timeline UI (`components/atrativos/RoteiroSection.js`).
5. Delete saved item → `DELETE /api/roteiro/[id]` (server verifies row removed; requires `supabase/roteiros_policies.sql` on Supabase).

**Edge cases**
- Parser drops empty period blocks; stops link to catalog names when `lugaresCatalog` from API matches.
- Guest → login modal.
- No saved roteiros yet → empty state in `RoteiroSection` (“Nenhum roteiro salvo ainda”).
- Daily limit 2/day → paywall (`roteiro`) with countdown; compact `DailyLimitCountdown` on `/atrativos` card when blocked (`Novos roteiros em HH:MM:SS`, light text on dark gradient).
- Usage counter: same hydrate → sync pattern as search (`usePremiumUsage`); label `X/2 roteiros gratuitos hoje`.
- Incomplete form blocked client-side.
- Save without login impossible (API 401).
- Escape disabled while loading/saving.
- Generation failure shows error in sheet.

---

## 23. Guia Premium (paywall)

**Description**  
Subscription at **R$ 9,90/mo** for **unlimited** AI search and roteiros (no daily cap). Free tier: **10 buscas + 2 roteiros per day**, resetting at **midnight** (`America/Sao_Paulo`). `PremiumPaywallSheet` explains the daily limit; `DailyLimitCountdown` shows time until reset (`HH:MM:SS`, updates every second).

**User goal**  
Understand the daily free quota, when it renews, or upgrade for unlimited use.

**Main flows**
1. Hit daily limit → paywall with feature copy (busca/roteiro) + countdown + plan benefits.
2. While blocked on home (search open) or `/atrativos` → countdown visible before/at paywall.
3. “Assinar” / CTA → may open login if needed (`premium` motivo) — **payment not integrated** (Asaas planned).

**Edge cases**
- `premium_ativo` + `premium_ate` enforced server-side and in RPC.
- Paywall is informational today — no in-app purchase flow.
- Premium users see unlimited counters in UI (`null` remaining).
- Countdown (`DailyLimitCountdown`): ticks every second via `getMsUntilDailyReset()`; may seed from `usage.msUntilReset` after API/RPC. Compact mode on `/atrativos` inherits parent text color (timer visible on dark card).
- Legacy `uso_ia_mes` (`YYYY-MM`) or a previous day’s key: UI shows **0/N** for the new day; server realigns counters on read/increment so limits are not blocked by stale rows. After quota is used, UI and API both show `used === limit`.

---

## 24. Geolocation & distance

**Description**  
Browser GPS used on home, category lists, and place detail to compute Haversine distance (`distancia_calculada`).

**User goal**  
Understand how far places are from current position.

**Main flows**
1. `getCurrentPosition` on mount (timeout 10s, cached 5 min).
2. `withDistanciaDinamica` / `getDistanciaLugar` format labels on cards and hero.

**Edge cases**
- Permission denied → static `distancia` field or no label.
- Places without `localizacoes` → weak distance/travel estimates.
- Public-place “travel time” chips use heuristics from distance text, not live traffic.

---

## 25. Opening hours & open/now status

**Description**  
Weekly `horarios` json on each place; real-time open/closed for establishments and AI filters. Supports **multiple shifts per day** (comma-separated) and **overnight closing** (e.g. `18:30-00:00`, `18:00-04:00` when close time ≤ open time = next calendar day).

**User goal**  
Know if a business is open before going — including lunch/dinner splits and bars open past midnight.

**Main flows**
1. Detail shows badge + compact summary (`getHorarioResumo` / `status.resumo`) → tap → full week sheet (`formatHorario` shows multi-shift and “dia seguinte” labels).
2. AI search and filters use same parser (`America/Sao_Paulo`, `lib/busca.js` → `abertoAgora`).
3. Admin `HorarioEditor`: per-day **Fechado** / **24h** / one or **two shifts**; copy Monday → Tue–Fri or custom day checkboxes; draft state while fixing validation errors.

**Status messages (examples)**
- Open in shift: “Aberto · fecha às 15:00” or “Fecha à meia-noite”.
- Pause between shifts: “Abre mais tarde às 18:00”.
- Overnight carry-over (e.g. `22:00-04:00`): open until 04:00 next morning; “Fecha às 04:00”.
- After last shift: “Fechado hoje”.

**Edge cases**
- Public nature spots may hide hours UI entirely (`isLugarEstabelecimento`).
- Values: `fechado`, `24h`, single interval, comma-separated intervals, overnight interval; malformed json → safe “closed”/unknown.
- At most **one overnight shift per day**; cannot combine overnight with a second diurnal shift that overlaps (admin shows inline error).
- `00:00` close = end at midnight (no carry-over into early morning); `04:00` close = carry-over until 04:00.
- Establishment CTA copy changes when closed (“Como chegar” vs “Ir agora”).

---

## 26. Loading states, errors & accessibility (cross-cutting)

**Description**  
Shared UX patterns from the UI/UX audit: resilient data loading, visible failures, skeleton placeholders, image optimization, and baseline accessibility.

**User goal**  
Understand when content failed vs. is empty; navigate with keyboard/screen readers; see fast above-the-fold images.

**Patterns**

| Pattern | Where | Behavior |
|---------|--------|----------|
| **SectionUnavailable** | Home (`app/page.js`) | Gray, non-alarming copy per failed section (“Conteúdo indisponível no momento”) |
| **UserErrorAlert** | Home search, place detail, category grid, favorites, roteiro sheet, avaliação | Red `role="alert"`; optional retry; report hint opens `FeedbackSheet` |
| **FeedbackSheet** | Global (`FeedbackProvider`) | Perfil → Ajuda e feedback; pré-preenche em reportes de erro |
| **Admin feedback** | `/admin/feedback` | Filter by status/tipo; update status and `admin_notas` |
| **PlaceCardSkeleton** | Favorites, category list, search results | Pulse placeholders matching card height |
| **`RemotePhoto`** | Thumbnails, heroes, search rows, category cards, compact atrativos, roteiro parada banners | Direct CDN `<img>` via `components/shared/RemotePhoto.js` — bypasses Vercel Image Optimization |
| **`next/image`** | `PlaceCard`, `EmAltaCard`, `LandingPlaceCard`, featured atrativo cover | Explicit `sizes`, `quality={60}`; `minimumCacheTTL` 30 days in `next.config.mjs` |
| **Design tokens** | `app/globals.css` | `--color-primary`, `--color-background`, etc.; system dark mode media query **disabled** until full theme ships |
| **Focus** | Global | `*:focus-visible` outline in brand green |
| **Dialogs** | Bottom sheets (detail, profile) | `role="dialog"`, `aria-modal`, labelled titles |

**Edge cases**
- Home loads in **two phases**: primary (`lugares` ativos + populares) then secondary (perto + clima); each phase uses `Promise.allSettled` so one failure does not block the other.
- Search network errors still use inline message in the results panel (unchanged).
- `OQueFazerAgora` hero still uses a plain `<img>` (not `RemotePhoto` or `next/image`).

---

## 27. Weather context

**Description**  
**Open-Meteo** (forecast + marine) via `lib/clima.js`.

| Surface | What users see |
|---------|----------------|
| **Home header** | Inline regional temperature + weather emoji (`HomeContextHeader`) |
| **Hero card** | Regional temperature in the 2×2 metrics grid (`temperaturaClima` from the same fetch) |
| **Place detail** | `LugarClimaWidget` for **Natureza** / **Aventura** with coordinates — mini summary for everyone; **`ClimaSheet`** (UV, waves chart, sea temp, moon) for **logged-in** users |
| **Not mounted** | `ClimaCard` beach picker on home (component exists; use detail widget instead) |

**User goal**  
Plan beach/outdoor time with local weather awareness at decision time (especially on place pages).

**Main flows**
1. Home secondary load → `fetchClimaApis(IMBITUBA_COORDS)` → header inline weather + hero temperature.
2. Outdoor place detail → `fetchClimaApisCached(lat, lng)` → widget; logged-in tap opens `ClimaSheet`.
3. Guest tap on widget → `LoginModal` with motivo `clima`.

**Edge cases**
- Climate fetch failure on home → header/hero show `--°` / `--°C`.
- Widget omitted on detail if marine/weather API fails (silent).
- `PremiumPaywallSheet` copy for `clima` exists but detail sheet is **login-gated**, not premium-gated in the current build.

---

## 28. Dedicated login page

**Description**  
Marketing-style `/login` with background photo and `AuthFlow` in a green panel.

**User goal**  
Sign in from a focused screen (bookmark, redirect, marketing link).

**Main flows**
1. Open `/login` → if session exists → redirect `/`.
2. Else show Google + SMS same as modal.

**Edge cases**
- Duplicate of auth capabilities in modal/profile; no unique provider.

---

## 29. Activity logging (user-visible impact: minimal)

**Description**  
Server/client inserts into `logs` for login, logout, favorites, `ir_agora`, **`visualizou_lugar`** (place detail), **`escaneou_qr`** (QR redirect `/q/[slug]`, server-side), app open (`acessou_app` / `acesso_app`), account deletion request (`deletou_conta`). Drives **`/admin`** summary, **`/admin/logs`**, and **`/admin/relatorios`** view/QR metrics, not end-user UI.

**User goal**  
(N/A — operational/analytics.)

**Main flows**
- Transparent to users except network latency on fire-and-forget inserts.

**Edge cases**
- Log insert failure is swallowed (`console.error` only).

---

## Admin CMS (operators only)

Not for tourists. Requires `perfis.role` ∈ `admin`, `dev` (`canAccessAdmin`). Several routes are **dev-only** (`canAccessAdminSection` / `devOnly` in `adminNavConfig.js`); role `admin` is redirected away from those paths.

| Area | Access | Description | User goal (operator) |
|------|--------|-------------|----------------------|
| Dashboard (`/admin`) | admin, dev | Hero + KPIs (pending reviews, active places, live partners, new users, IR AGORA in period); moderation queue; operational sidebar (partners expiring, curadoria overdue); activity timeline; week/month period | Monitor health and clear the moderation queue |
| Locais (`/admin/locais`) | admin, dev | CRUD, photos, video, hours (`HorarioEditor`), tags (max **5**), address autocomplete, `eh_parceiro` / `conteudo_curadoria`, partner program fields (`ParceiroProgramaFields`), QR section | Keep catalog accurate |
| Atrativos (`/admin/atrativos`) | admin, dev | Curated route CRUD; tags max **5**; `/admin/rotas` → 301 | Publish trails |
| Avaliações (`/admin/avaliacoes`) | admin, dev | Approve/reject/delete pending; deep links from alerts (`?tab=`) | Moderate UGC |
| Relatórios (`/admin/relatorios`) | admin, dev | Per-establishment KPIs (views, **QR scans**, IR AGORA, favorites, reviews), WhatsApp copy, PDF | Share performance with partners |
| Parceiros (`/admin/parceiros`) | **dev** | CRM for `eh_parceiro` places: 6-month free vs paid modality, end dates, quarterly review due dates, filters (`?filtro=vencendo`, `curadoria`, …); quick actions (`ParceirosAdminPage`, `lib/parceiroAdmin.js`) | Track launch program deadlines |
| Contratos (`/admin/contratos`) | **dev** | Commercial contracts per place: types (6 months free, paid, addendum), status pipeline, Asaas placeholders, signed-doc upload; syncs partner flags (`ContratosAdminPage`, `lib/contratoAdmin.js`) | Store proposals and signed PDFs |
| Usuários (`/admin/usuarios`) | **dev** | Roles, Premium IA status, engagement sheet; link to user logs | Access control |
| Logs (`/admin/logs`) | **dev** | Filter by action, period, user (`?user_id=`); bulk cleanup actions | Investigate behavior |
| IA & Custos (`/admin/ia`) | **dev** | `logs_ia` dashboard: cost, tokens, latency, projections | Control AI spend |
| Despesas (`/admin/despesas`) | **dev** | Operational expenses + payment ledger | Track fixed stack costs |
| Feedback (`/admin/feedback`) | **dev** | Support tickets from `POST /api/feedback` | Triage user reports |
| Taxonomia (`/admin/taxonomia`) | **dev** | CRUD `subcategorias` and `tags` | Maintain vocabulary without SQL |

**Edge cases**
- Client + server gates (`AdminShell`, `app/admin/layout.js`); dev-only API uses `requireAdminOnlyApi()` (403 for role `admin`).
- Admin nav: sidebar on desktop (`lg+`), drawer on tablet/phone; bell filters dev-only alerts by role.
- Primary CMS path is `/admin/locais` (`/admin/lugares` and `/admin/destaques` redirect 301 — bookmarks legados).
- Partner program columns require `supabase/lugares_parceiro_programa.sql`; contracts require `supabase/contratos_comerciais.sql`.
- Table `destaques` (Supabase) is legacy — commercial visibility is `lugares.eh_parceiro` + partner program fields.

---

## 30. Establishment QR codes

**Description**  
Short URL and printable QR for commercial places (all categories except Natureza and Aventura). Scan opens place detail; scans are logged separately from page views.

**User goal**  
Establishment displays QR at counter/table; tourist scans and lands on the official place profile.

**Main flows**
1. Admin edits place → **QR Code do estabelecimento** (`LugarQrSection`) → copy `/q/{slug}` or **Baixar PDF** — premium print layout (`lib/qrPdf/render.js`) with format picker: mesa/A6, adesivo 8×8 cm, display A5, A4 card, quadrado (`lib/qrPdf/formats.js`).
2. Tourist scans QR → `GET /q/{slug}` → log `escaneou_qr` → redirect `/lugares/{id}?ref=qr`.
3. Detail shows one-time session banner: “Você abriu o guia pelo QR de {nome}”.
4. Operator checks **Escaneamentos QR** in `/admin/relatorios` (period + % vs previous).

**Edge cases**
- Natureza/Aventura: no QR section in admin; slug cleared on save.
- Inactive place: `/q/{slug}` returns 404.
- Duplicate names: slug suffix `-2`, `-3`, …
- Guest scans work without login; service role required for log insert in production.
- Slug editable manually in admin (disables auto-sync from name).

---

## 31. App download landing (`/baixar`)

**Description**  
Public page for a **single smart link** used on posters, round stickers, and folder backs. Detects iOS/Android from User-Agent and redirects to App Store or Google Play when `NEXT_PUBLIC_APP_STORE_URL` / `NEXT_PUBLIC_PLAY_STORE_URL` are configured.

**User goal**  
Tourist or resident scans one QR in a public place → lands on a simple download screen → store opens automatically (or manual store buttons as fallback).

**Main flows**
1. Marketing material QR → `https://guiadebolso.app/baixar`.
2. `BaixarAppClient` detects platform → `window.location.replace` to the right store (400 ms delay).
3. If store URLs missing: buttons show “Em breve”; page still explains the app and links to `/` and `/sobre`.

**Copy on page (user-facing only)**  
Title, short description, prefeitura support line (`PREFETURA_SUPPORT_LINE`), store CTAs — **no** internal “for posters / QR” instructions (those live in `docs/materiais/README.md` and `docs/environment.md`).

**Edge cases**
- Desktop / unknown UA: no auto-redirect; both store buttons visible.
- Invalid env URL (`#`, empty): treated as not configured (`lib/appStoreLinks.js`).
- Route is on marketing host allowlist (`lib/marketingHost.js`); no app viewport shell.

---

## 32. IA observability e custos (admin)

**Description**  
Página operacional em `/admin/ia` para monitorar custo, tokens, latência e erros das chamadas Anthropic (`busca`, `roteiro`, `moderacao`), incluindo efeitos de prompt caching.

**User goal**  
Entender gasto atual, eficiência de cache e risco de escala antes de aumentar base de usuários.

**Main flows**
1. Operador escolhe período (hoje/7/30/90 dias), feature e moeda (USD/BRL).
2. Dashboard agrega `logs_ia` em cards: custo total, chamadas, tokens, custo/chamada, latência média, projeção mensal.
3. Gráfico diário mostra custo por feature; tabela detalhada lista chamadas com paginação.
4. Simulador estima custo com e sem cache para cenários de crescimento.
5. Alertas destacam anomalias (erro alto, latência alta, pico de custo).

**Edge cases**
- Sem dados no período: cards e gráfico mostram estado vazio sem quebrar layout.
- Falhas de leitura de `logs_ia` no cliente exibem fallback visual no admin.
- Erros de chamada IA continuam com logging (`sucesso=false`) para visibilidade operacional.

---

## 33. Partner program CRM (admin, dev only)

**Description**  
`/admin/parceiros` lists active partners with launch-program metadata on `lugares` (`parceiro_modalidade`, `parceiro_inicio_em`, `parceiro_fim_em`, `parceiro_status`, `proxima_curadoria_avaliacoes_em`). Dashboard and alert bell deep-link here for expiring free periods and overdue quarterly review of approved reviews.

**User goal (operator)**  
See which partners are in the 6-month free window, due for conversion, or overdue for curadoria — without opening each place form.

**Main flows**
1. Filter chips: all active, free launch, paid, expiring in 30 days, expired free, curadoria overdue.
2. Row actions: open place editor, mark curadoria done (`ultima_curadoria_avaliacoes_em` + next +3 months), extend free end date.
3. Requires migration `supabase/lugares_parceiro_programa.sql`.

**Edge cases**
- Missing columns → banner with SQL migration hint (`fetchParceiroProgramaColumnsReady`).
- Non-dev role → nav link hidden; direct URL blocked by `AdminShell`.

---

## 34. Commercial contracts (admin, dev only)

**Description**  
`/admin/contratos` manages `contratos_comerciais` rows (one active contract per place) and private documents in Storage bucket `contratos-parceiros`. Dropdown lists only **active partners** (`fetchLugaresParaContrato`). Document upload/download via `POST /api/admin/contratos/[id]/documentos` and signed URL `GET /api/admin/contratos/documentos/[docId]`.

**User goal (operator)**  
Track proposal numbers, signature dates, free-period end, Asaas IDs, and store signed PDFs/DOCX off email threads.

**Main flows**
1. **Novo contrato** → pick active partner place → tipo (`lancamento_6_meses_gratis`, `parceiro_pago`, `aditivo`) + status pipeline.
2. Upload document (max 10 MB: PDF, DOCX, JPEG/PNG/WebP) → metadata in `contrato_documentos`.
3. Activating a contract can sync partner program fields on `lugares` (`syncParceiroFromContrato`).
4. Requires migration `supabase/contratos_comerciais.sql` (RLS via `is_admin_only()` → role `dev` only).

**Edge cases**
- Role `admin` → 403 on API routes (`requireAdminOnlyApi`).
- Tables missing → setup banner (`fetchContratosTablesReady`).
- Print templates for visits: `docs/contratos/*.md` → `npm run contrato:docx` / `contrato:6meses:docx` (`scripts/generate-contrato-docx.mjs`).

---

## Planned / not in app (roadmap)

| Feature | Status |
|---------|--------|
| Sign in with Apple (web) | Not offered — iOS Capacitor only (`canUseNativeAppleSignIn`) |
| WhatsApp Auth | Waiting Meta approval |
| Asaas billing & establishment self-service portal | Documented in business model, not built |
| Legacy multi-plan destaques carousel | Replaced by **Parceiros** carousel (`ParceirosCarrossel`) for vigent highlights only |
| In-app notifications | Profile row placeholder only |
| `ClimaCard` on home | Component exists; weather on detail via `LugarClimaWidget` instead |

---

## Feature → route index

| Feature | Primary routes |
|---------|----------------|
| Home assistant | `/` |
| Smart search | `/` (overlay) |
| Categories | `/categorias`, `/categoria/[slug]` |
| Place detail | `/lugares/[id]` |
| QR short link | `/q/[slug]` → `/lugares/[id]?ref=qr` |
| App download (marketing QR) | `/baixar` → App Store / Play (env) |
| Favorites | `/favoritos` |
| Curated atrativos | `/atrativos`, `/atrativos/[id]` (`/rotas` → 301) |
| AI roteiro | `/atrativos` (sheet) |
| Profile | `/perfil`, `/perfil/editar` |
| Login | `/login`, modal, `/auth/callback` |
| Admin | `/admin`, `/admin/locais`, `/admin/parceiros` (dev), `/admin/contratos` (dev), `/admin/relatorios`, … |

---

## Related docs

- [Architecture](./architecture.md)
- [Database](./database.md)
- [API](./api.md)
- [Deployment](./deployment.md)
