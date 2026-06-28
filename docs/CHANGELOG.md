# Changelog

All notable changes to **Guia de Bolso** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Security

- **P0 — contadores IA em `perfis`** — trigger estende proteção a `buscas_ia`, `roteiros_ia`, `uso_ia_mes`; só RPCs alteram contadores; removido fallback client-side em `lib/premiumServer.js`.
- **P0 — RLS versionado** — `favoritos_policies.sql`, `destaques_planos_policies.sql`, `perfis_admin_policies.sql`, `avaliacoes_admin_policies.sql`; manifest de auditoria em `docs/security-rls.md`.

### Performance

- **P1 — busca IA** — select enxuto `LUGAR_SELECT_BUSCA_CONTEXT`, top-60 inalterado, `descricao` truncada (120 chars), resultados via `queryLugaresByIds` + `orderLugaresByIds`.
- **P1 — rate limit IA** — Upstash Redis em `lib/iaRateLimit.js` (fallback in-memory); env `UPSTASH_REDIS_*`.
- **P1 — cache** — clima na home via `fetchClimaApisCached`; `fetchLugaresFromApi` respeita CDN de `/api/lugares`.
- **Docs** — `docs/CUSTOS.md` alinhado (top-60, roteiro `max_tokens: 2400`).

### Performance (P2-lite)

- **Debounce `acessou_app`** — no máximo 1 log por usuário/dia (SP) via `lib/acessouAppLog.js` + `localStorage`.
- **Índices fase 2** — aplicar `supabase/db_indexes_phase2.sql` no Supabase (manual; já versionado no repo).

### Added

- **Favoritos offline (fase 1)** — cache automático ao favoritar lugar ou atrativo (`lib/favoritosOffline.js`, `lib/favoritosOfflineFetch.js`, IndexedDB + Cache API); sync na abertura de `/favoritos`; rotas offline `/favoritos/lugar/[id]` e `/favoritos/atrativo/[id]`; banners e badge “Modo offline”; testes `favoritosOffline.test.js`, `networkStatus.test.js`; copy em onboarding, login, landing e `LoginModal`.
- **Automated QA pipeline** — ~40 unit test files in `lib/*.test.js` (`npm test`); Playwright smoke in `e2e/smoke.spec.js` (10 cases: health, home, login, explorar, atrativos, favoritos, perfil, admin redirect, bottom nav); GitHub Actions runs lint → unit tests → build → Playwright (Chromium) on PRs and pushes to `main`.

### Fixed

- **`LUGAR_SELECT_LIST`** — removed optional columns `rating_medio` / `media_avaliacoes` not present in the production DB (stops `[lugares] select enxuto falhou` fallback on every home load).
- **`next/image` qualities** — `images.qualities: [60, 75]` in `next.config.mjs` for list cards using `quality={60}`.
- **`adminDeleteUsuario.test.js`** — mock `logs.update()` for `deleteUserAccount` log anonymization.

### Added

- **SEO P0** — canonical place URLs `/lugares/{slug}` (301 from UUID), `generateMetadata` on place and route detail, dynamic `sitemap.xml` and `robots.txt` (`lib/seo.js`, `lib/lugarPublicPath.js`).
- **SEO P1** — JSON-LD (LocalBusiness/TouristAttraction, TouristTrip, CollectionPage), server-rendered `h1`/intro on place and category pages, SSR initial list on `/categoria/[slug]` (`lib/seoJsonLd.js`, `lib/lugarSeoData.js`).
- **SEO P2** — home/Explorar SSR initial data, `/imbituba` landing, WebSite JSON-LD, `noindex` on private routes (`lib/homePageData.js`, `lib/explorarPageData.js`, `lib/noIndexMetadata.js`).
- **Multi-shift & overnight opening hours** — `lugares.horarios` supports comma-separated daily intervals (`11:00-15:00,18:00-23:00`) and overnight closes (`18:30-00:00`, `22:00-04:00` when `fim <= inicio`); `lib/horarios.js` (`parseHorarioDia`, `getStatusFuncionamento`, carry-over across midnight); admin `HorarioEditor` (two shifts per day, copy between weekdays); unit tests `lib/horarios.test.js`.
- **Admin establishment reports** (`/admin/relatorios`) — filter by active place and period; KPI cards (views, IR AGORA, favorites, approved reviews) with % vs previous period; review list; copy WhatsApp summary; PDF export (`lib/adminRelatorios.js`, `lib/relatorioPdf.js`, `components/admin/RelatoriosEstabelecimentoPage.js`).
- **Place view logging** — `visualizou_lugar` on place detail for logged-in users (`app/lugares/[id]/page.js`, `lib/logs.js`); counted in establishment reports alongside legacy `acesso_app` with `detalhes.lugar_id`.
- **AI roteiro timeline UI** — `lib/roteiroParse.js` parses strict markdown into days/periods/stops; `RoteiroItineraryView` accordion timeline in `RoteiroBottomSheet` and `RoteiroViewModal` (`components/rotas/RoteiroSection.js`).
- **Client image compression** — `lib/imageCompress.js` for avatars and admin uploads via `lib/storageUpload.js`.
- **Establishment QR codes** — short URL `/q/{slug}` with redirect + `escaneou_qr` log; admin preview/PDF download (`LugarQrSection`, `lib/qrPdf.js`, `lib/lugarQr.js`, `lib/slug.js`); slug on `lugares`; eligible categories exclude Natureza/Aventura; scan KPI in `/admin/relatorios`.
- **Place detail redesign (Airbnb-style)** — `LugarDetalheAirbnb`, shared `hooks/useLugarDetalhe.js`, legacy preserved in `LugarDetalheLegacy`; opt-out via `NEXT_PUBLIC_LUGAR_DETALHE_V2=false` (V2 is default everywhere).

- **Profile avatar upload API** — `POST /api/perfil/avatar` uploads via service role when Storage RLS is missing on the legacy bucket (`lib/avatarStorage.js`, `app/perfil/editar/page.js`); optional RLS in `supabase/storage_avatar_legacy_bucket.sql`.
- **RemotePhoto CDN delivery** — `components/shared/RemotePhoto.js` serves Supabase Storage URLs without Vercel Image Optimization for thumbnails, heroes, search rows, category cards, compact atrativo cards, and landing mockups.
- **Native Sign in with Apple (iOS)** — `lib/nativeAppleAuth.js`, `signInWithAppleAuth` in `lib/capacitorOAuth.js`; Apple button in `components/AuthFlow.js` when `canUseNativeAppleSignIn()` (`SocialLogin.login` + `signInWithIdToken`).
- **Native Google Sign-In (iOS)** — `NEXT_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `ios/GoogleAuth.xcconfig` (reversed URL scheme → `Info.plist`), `AppDelegate.swift` + `CapAppAuthURLHandler` (`ios/App/CapApp-SPM/`).
- **Capacitor social login init** — shared `lib/nativeSocialLoginInit.js` for Android (`webClientId`) and iOS (Google + Apple providers).

### Changed

- **AI quota — atomic reserve** — `reserveBuscaIaUsage` / `reserveRoteiroIaUsage` call RPC **before** Claude; `releaseBuscaIaUsage` / `releaseRoteiroIaUsage` on failure (`decrement_*_ia` in `supabase/increment_uso_ia.sql`; `app/api/buscar/route.js`, `app/api/roteiro/route.js`). Fixes TOCTOU race on parallel requests.
- **AI roteiro client gate** — `RoteiroBottomSheet` accepts `onValidateBeforeGenerate`; `RoteiroSection.js` re-validates login/quota before `POST /api/roteiro`.
- **Admin establishment reports** — KPI **Escaneamentos QR** (`escaneou_qr`) separate from page views; included in PDF and WhatsApp summary.
- **Place profile visibility** — full public profile (gallery, tags, quick actions, long about) for all active places; only Parceiro badge remains tied to paid highlight (`lib/lugarVisibilidade.js`, `PlaceCard.js`).
- **Vercel image delivery** — `minimumCacheTTL: 2592000` (30 days) in `next.config.mjs`; listing cards keep `next/image` with explicit `sizes` and `quality={60}` (`PlaceCard`, `EmAltaCard`, `LandingPlaceCard`, featured cover in `AtrativosCatalogo`); heroes and small thumbs use `RemotePhoto` (`GalleryHeroAirbnb`, `LugarHero`, `SearchListItem`, `CategoriaLugarCard`, etc.).
- **Review submit** — `AvaliacaoForm` requires a non-empty comment; submit stays disabled until rating + trimmed comment (`components/AvaliacaoForm.js`).
- **SMS profile edit** — `/perfil/editar` hides the read-only email field when `usesPhoneAuth(user)` (`lib/perfil.js`).
- **Admin tag limit** — places and curated routes allow **5 tags** (was 3) in `LocalForm` / `RotaForm` (`MAX_TAGS`, `MAX_TAGS_ROTA` in `lib/rotas.js`).
- **Onboarding assets** — backgrounds from `/public/onboarding/*.jpg` (compressed local JPGs); guest finish/skip routes to `/login?from=onboarding`, logged-in users to home (`components/Onboarding.js`, `app/page.js`, `lib/authImagery.js`).
- **Place & route photo carousels** — controlled swipe: `snap-mandatory` + `useControlledPhotoCarousel` (max ±1 slide per gesture) in `lib/horizontalCarousel.js`; `GalleryHeroAirbnb`, `LugarHero`.
- **Opening-hours UX** — status copy includes pause between shifts and overnight close (`status.resumo`); compact row on detail; optional `title`/subtitle on cards (`PlaceCard`, `EmAltaCard`, `LugarHero`, `getHorarioResumo` in `lib/lugarDetalhe.js`).
- **Home header** — `HomeContextHeader` shows brand + location with inline Open-Meteo temperature/emoji; contextual phrase card removed.
- **Hero selection** — `pickHeroLugar` (`lib/homeContext.js`) scores open status, vigent partner, trending IDs, time-of-day category, and distance; documented in `docs/features.md`.
- **AI roteiro API** — stricter markdown prompt, `max_tokens` 2400, response includes `lugaresCatalog` for UI linking (`app/api/roteiro/route.js`).
- **Favoritos / Explorar / Perfil** — UX polish (count badge, empty states, profile edit footer, duplicate “Editar perfil” removed from settings list).

### Fixed

- **Profile avatar upload in production** — server-side upload tries legacy bucket **Guia de Bolso - Imagens** then `imagens` (`lib/avatarStorage.js`); client no longer depends on direct Storage RLS for avatars.
- **Saved roteiro delete** — `DELETE /api/roteiro/[id]` server route verifies row removal; client uses API instead of direct Supabase delete; RLS policies in `supabase/roteiros_policies.sql` (`components/rotas/RoteiroSection.js`).
- **Admin hours editor** — turn 2 inputs editable while validating (local draft state); overnight second shift allowed with daytime first shift (`components/admin/HorarioEditor.js`, `validarIntervalos` in `lib/horarios.js`).

### Documentation

- Synced `/docs` with post-0.5.0 code: home ranking criteria, admin reports, roteiro parser, `visualizou_lugar`, free-tier search limit (5/day).
- Updated hours model, tag limit (5), onboarding navigation, carousel behavior, and `[Unreleased]` changelog entries.
- Synced image delivery (`RemotePhoto` vs `next/image`), avatar API (`POST /api/perfil/avatar`), review comment requirement, legacy avatar bucket SQL, and `/atrativos` routes (301 from `/rotas`).
- Native auth (Capacitor iOS/Android): `authentication.md`, `architecture.md`, `deployment.md`, `environment.md`, `features.md`, `TESTING-CHECKLIST.md`, `CLAUDE.md`.

## [0.5.0] - 2026-05-21

### Added

- **Reviews (structured + AI assist)** — aspect chips on submit (`AvaliacaoForm`, `lib/avaliacaoAspectos.js`); `POST /api/avaliacoes/analisar` stores Claude moderation hint on `sugestao_ia`; detail shows star distribution and aspect tags (`LugarAvaliacoesSection`); admin queue shows IA suggestion badges (`supabase/avaliacoes_moderacao.sql`).
- **Explorar redesign** (`/categorias`) — `components/explorar/*`, `lib/categorias.js`: search bar, mood shortcuts, featured category carousel, category grid with cover thumbnails.
- **Profile redesign** — `components/perfil/*`, `lib/perfil.js`: hero, live stats (favorites, reviews, roteiros), settings groups, bottom sheets; removed placeholder “Notificações” row.
- **Home — Parceiros** — `ParceirosCarrossel` for places with an active commercial highlight; `ehParceiro` on cards, search results, and AI context (`lib/destaques.js`, `lib/planoComercial.js`, `lib/lugarVisibilidade.js`).
- **Admin shell** — responsive sidebar + mobile drawer + top bar (`AdminSidebar`, `AdminNavDrawer`, `AdminTopBar`, `adminNavConfig.js`); alert bell (`AdminAlertsBell`, `lib/adminAlertas.js`).
- **`/admin/logs`** — filterable activity log (`lib/adminLogs.js`, `LogsGridPage`); dashboard shortcuts and `?user_id=` deep links from Usuários.
- **`/admin/taxonomia`** — CRUD for `subcategorias` and `tags` without SQL (`lib/adminTaxonomia.js`, `TaxonomiaPage`).
- **Admin dashboard redesign** — hero, asymmetric KPI grid, moderation queue, operational sidebar, activity timeline (`lib/adminDashboard.js`, `Dashboard*` components).
- **Admin usuários redesign** — engagement sheet and log deep links (`UsuariosGridPage`).
- **Route taxonomy & catalog** — fixed route types (`lib/rotas.js`); `rotas_tags` + `tags.aplica_em_rotas`; optional `rota_pontos.lugar_id`; `RotasCatalogo` filter chips; `rota_ponto_detalhes`, `rota_dicas`, `rotas_localizacoes` (`supabase/rotas_taxonomia.sql` and related scripts).
- **Place taxonomy cleanup** — canonical subcategorias + detail tags (`supabase/taxonomia_lugares_cleanup.sql`).
- **Static presentation** — `public/apresentacao.html` for stakeholder demos.
- **Commercial plan migration** — single Parceiro plan seed/normalize (`supabase/plano_comercial_unico.sql`).

### Changed

- **Destaques comerciais** — admin and consumer flows use one plan (**Parceiro**, R$ 299/mês); legacy multi-tier UI removed; AI search and roteiro catalog prioritize active partners.
- **Admin `RotaForm`** — route type, tags (max 3), optional place per step, map location via `EnderecoAutocomplete`.
- **`/rotas/[id]`** — category icon, tag chips, ordered descriptions and tips per step, “Ver no guia” when `lugar_id` is set.
- **Daily AI limits** — `isSameUsageDay()` matches exact `YYYY-MM-DD` only; `usePremiumUsage` refreshes at SP midnight and on tab focus after day change (`supabase/premium_uso_dia_fix.sql`).
- **Admin dashboard** — period selector in top bar; deep links to locais, avaliações, destaques, logs; Destaques nav icon (sparkles).
- **Admin taxonomia** — degrades gracefully if `tags.aplica_em_rotas` is missing until `rotas_taxonomia.sql` runs.

### Fixed

- **Admin dashboard KPI grid** — column spans summed to 12 (was 21); metric card grid classes on the `Link` wrapper, not inner `<article>`.
- **Duplicate activity block** on dashboard — sidebar points to full timeline section only.
- **`AdminTopBar`** — flex-wrap on narrow viewports so period controls do not overflow.
- **`AdminNavLinkItem`** — active route indicator JSX after shell refactor.

### Documentation

- Changelog **0.5.0**; full `/docs` pass (architecture, features, database, API, deployment, taxonomia, index).

## [0.4.0] - 2026-05-20

### Added

- **`LugarClimaWidget`** on place detail (`/lugares/[id]`) for **Natureza** and **Aventura** places with coordinates — mini summary (temp, waves, bath status, wind) for all visitors; **`ClimaSheet`** with full Open-Meteo/marine metrics for **logged-in** users (login modal for guests).
- **`fetchClimaApisCached`** and **`lugarExibeClima`** in `lib/clima.js` (10-minute in-memory cache per coordinates).
- **Hero metrics grid (2×2)** on `OQueFazerAgora` — Distância, Tempo da experiência, regional **Temperatura** (from home climate fetch), **De carro** (drive-time estimate from distance at 30 km/h, rounded to 5 min).
- **Place visibility flags** on `lugares`: `mostrar_endereco`, `mostrar_horarios` (admin toggles; migration `supabase/lugares_visibilidade.sql`).
- **`getStorageErrorMessage`** in `lib/storageUpload.js` for clearer admin photo upload errors.

### Changed

- **Open/closed badges** on `EmAltaCard` and `PlaceCard` only when `mostrar_horarios` is true and `horarios` is a non-empty object (`getStatusFuncionamento` with optional second argument).
- **Place detail** — hours block gated by `mostrar_horarios`; address/map block by `mostrar_endereco` and non-empty address; establishment quick actions omit links without URLs; removed **`LugarPorQueIrAgora`** section.
- **Static map preview** on place detail uses **Google Maps Static API** (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) with clickable fallback when the image fails (`LugarLocalizacaoCard`).
- **Admin `LocalForm`** — address saved only via `localizacoes` (no `lugares.endereco` in payload); visibility checkboxes; improved save vs. photo error handling.
- **Profile** — “Notificações” setting row hidden until implemented.

### Fixed

- **Admin `EnderecoAutocomplete`** — dropdown no longer reopens after a confirmed selection; single-click selection (`lockedQueryRef`, focus-gated list, `onMouseDown` preventDefault).
- **`getMelhorHorario`** — returns `null` when the place has no registered hours (hero no longer shows misleading “Abre …” copy for beaches).

### Documentation

- Updated `docs/features.md`, `docs/architecture.md`, `docs/database.md`, and `docs/deployment.md` for climate-on-detail, hero metrics, visibility columns, Google Static Maps, and admin address behavior.

## [0.3.0] - 2026-05-19

### Added

- **Decision-oriented home** — contextual header (`HomeContextHeader`), expanded `SmartSearch`, hero “O que fazer agora” (`OQueFazerAgora`), “Em alta hoje”, preset “Planos rápidos”, and “Perto de você”; driven by `lib/homeContext.js`.
- **Conversion-focused place detail** — modular `components/lugar/*` (immersive hero, quick actions by venue type, compact hours, fixed navigation CTA); establishment vs. public-place logic in `lib/lugarDetalhe.js`.
- **`next/image`** for place cards, trending cards, search rows, lugar hero, and route covers; `images.remotePatterns` in `next.config.mjs` (Supabase Storage + picsum).
- **`PlaceCardSkeleton`** loading placeholders on favorites, category grids, and search results.
- **Visible error handling** — red `ErrorBanner` (`role="alert"`) on place detail, category listings, and favorites; gray `SectionUnavailable` per failed home section.
- **Design tokens** in `app/globals.css` (`--color-primary`, `--color-background`, `--color-muted`, etc.) and global `*:focus-visible` outline.
- **Accessibility** — `BottomNav` and search controls with `aria-label`; bottom sheets with `role="dialog"`, `aria-modal`, and `aria-labelledby`; semantic `<ul>` / `<li>` on place lists.
- **Empty states** — curated routes list (“Nenhuma rota cadastrada ainda”) and saved AI roteiros (“Nenhum roteiro salvo ainda”).
- **Technical documentation** under `docs/` (architecture, database, API, features, deployment, contributing) and restructured root `README.md`.
- **JSDoc** across `app/`, `components/`, `lib/`, and `middleware.js` (no runtime behavior change).

### Changed

- **Home data loading** — two phases (`Promise.allSettled`): primary (active places + trending) then secondary (nearby + weather); failures isolated per section instead of failing the whole page.
- **`/categorias`** — single `select("categoria")` with client-side counts (replaces nine per-category count queries).
- **Place/route cards** — ratings read from optional `rating_medio` / `media_avaliacoes` on the row only (removed per-card `avaliacoes` queries).
- **`/rotas` and `/rotas/[id]`** — aligned with app palette (`#f0f4f3`, `#1a4a3a`), `rounded-2xl` cards, higher-contrast difficulty labels.
- **Primary actions** — unified green CTAs (`#1a4a3a`) on hero, roteiro section, and route detail.
- **System dark mode** — `prefers-color-scheme: dark` overrides disabled until a full theme ships.
- **Touch targets** — minimum ~44px on smart-search and lugar hero icon buttons.

### Fixed

- **Silent Supabase failures** on home sections, favorites, category pages, and place detail — users now see retry or section-unavailable copy instead of empty UI.
- **Admin route form** — `saveError` banner when save fails.
- **`EnderecoMapPicker`** — “Mapa indisponível no momento” when the map cannot load.

### Documentation

- Updated `docs/features.md`, `docs/architecture.md`, and `docs/database.md` for home loading, error patterns, `next/image`, design tokens, and optional rating fields on `lugares`.

## [0.2.0] - 2026-05-19

### Added

- **Daily AI usage limits** for the free tier: 3 AI searches and 2 AI itineraries per calendar day (`America/Sao_Paulo`), resetting at midnight; Premium remains unlimited (R$ 9,90/mo).
- `DailyLimitCountdown` component — live `HH:MM:SS` until reset; used on home search, `/rotas` roteiro card, and `PremiumPaywallSheet`.
- `isSameUsageDay()` in `lib/premium.js` — matches `perfis.uso_ia_mes` as `YYYY-MM-DD` or legacy `YYYY-MM` buckets.
- `supabase/premium_uso_diario.sql` — documents daily semantics for `uso_ia_mes`.
- Technical documentation under `docs/` (`architecture`, `database`, `api`, `features`, `deployment`, `contributing`, index `README`).
- JSDoc across `app/`, `components/`, `lib/`, and `middleware.js` (no runtime behavior change).

### Changed

- **Monthly → daily** quota model: `uso_ia_mes` stores day key `YYYY-MM-DD`; RPCs `increment_busca_ia` / `increment_roteiro_ia` updated (`supabase/increment_uso_ia.sql`).
- `usePremiumUsage` — hydrates same-day cache from `localStorage` (`guia_premium_usage_{userId}`), then syncs via `GET /api/uso-premium` (server is source of truth); exposes `loading` and `synced`.
- Home search usage label: `IA X/3 hoje · renova à meia-noite`; inline countdown when daily search limit is reached.
- `/rotas` roteiro section: daily usage label, compact countdown when blocked (`Novos roteiros em HH:MM:SS`).
- `PremiumPaywallSheet` — daily-limit copy and countdown for `busca` / `roteiro` features.
- Root `README.md` — restructured (overview, stack, deployment, docs index).

### Fixed

- Usage counter showing **0/3** after page reload despite prior use — removed synthetic default from API/hook; hydrate cache before fetch.
- **Invisible countdown** on the dark roteiro card — compact timer inherits parent text color instead of fixed dark green.
- `GET /api/uso-premium` no longer falls back to empty usage on read errors (client keeps valid cache).

### Documentation

- Updated `docs/features.md`, `docs/architecture.md`, `docs/database.md`, and `docs/api.md` for daily limits and client sync behavior.

## [0.1.0] - 2026-05-18

### Added

- Initial production release: home, place detail, categories, auth (Google + SMS), favorites, reviews, admin panel, AI search and roteiros (Guia Premium with monthly-style usage counters), routes, and Vercel deploy.

[0.5.0]: https://github.com/BrunoDislilerDev/guia-de-bolso/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/BrunoDislilerDev/guia-de-bolso/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/BrunoDislilerDev/guia-de-bolso/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/BrunoDislilerDev/guia-de-bolso/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/BrunoDislilerDev/guia-de-bolso/releases/tag/v0.1.0
