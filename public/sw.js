/* eslint-disable no-restricted-globals */
/**
 * Service worker — shell offline para /favoritos* (fase 2).
 * Dados dos favoritos: IndexedDB (lib/favoritosOffline.js).
 */

const SW_VERSION = "guia-favoritos-shell-v2";
const CACHE_STATIC = `${SW_VERSION}-static`;
const CACHE_PAGES = `${SW_VERSION}-pages`;
const OFFLINE_URL = "/offline.html";

const PRECACHE_ON_INSTALL = ["/favoritos", OFFLINE_URL];

/**
 * @param {URL} url
 * @returns {boolean}
 */
function isSameOrigin(url) {
  return url.origin === self.location.origin;
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
function isFavoritosPath(pathname) {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  return path === "/favoritos" || path.startsWith("/favoritos/");
}

/**
 * @param {string} pathname
 * @returns {boolean}
 */
function isAppHomePath(pathname) {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";
  return path === "/" || path === "/home";
}

/**
 * @param {URL} url
 * @returns {boolean}
 */
function isStaticAsset(url) {
  if (!isSameOrigin(url)) return false;
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/_next/image")) return true;
  return /\.(?:js|css|woff2?|png|jpe?g|svg|webp|ico)$/i.test(url.pathname);
}

/**
 * @param {URL} url
 * @returns {boolean}
 */
function shouldSkip(url) {
  if (!isSameOrigin(url)) return true;
  if (url.pathname.startsWith("/api/")) return true;
  if (url.pathname.startsWith("/auth/")) return true;
  return false;
}

/**
 * @param {string[]} paths
 * @returns {Promise<void>}
 */
async function precachePaths(paths) {
  const cache = await caches.open(CACHE_PAGES);

  await Promise.all(
    paths.map(async (path) => {
      try {
        const url = new URL(path, self.location.origin).href;
        const response = await fetch(url, { credentials: "include" });
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch {
        // Rede indisponível ou sessão ausente — ignora.
      }
    })
  );
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleHomeOffline(request) {
  const cache = await caches.open(CACHE_PAGES);
  const favoritosUrl = new URL("/favoritos", self.location.origin).href;

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const favoritosCached = await cache.match(favoritosUrl);
    if (favoritosCached) return favoritosCached;

    const cached = await cache.match(request);
    if (cached) return cached;

    const offline = await cache.match(new URL(OFFLINE_URL, self.location.origin).href);
    if (offline) return offline;

    return new Response("Sem conexão", {
      status: 503,
      statusText: "Offline",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function networkFirstPage(request) {
  const cache = await caches.open(CACHE_PAGES);

  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    const url = new URL(request.url);
    if (isFavoritosPath(url.pathname)) {
      const listCached = await cache.match(new URL("/favoritos", self.location.origin).href);
      if (listCached) return listCached;
    }

    const offline = await cache.match(new URL(OFFLINE_URL, self.location.origin).href);
    if (offline) return offline;

    return new Response("Sem conexão", {
      status: 503,
      statusText: "Offline",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/**
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function cacheFirstStatic(request) {
  const cached = await caches.match(request);
  if (cached) {
    fetch(request)
      .then((response) => {
        if (response.ok) {
          caches.open(CACHE_STATIC).then((cache) => cache.put(request, response));
        }
      })
      .catch(() => {});
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_STATIC);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 408, statusText: "Offline" });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      await precachePaths(PRECACHE_ON_INSTALL);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("guia-favoritos-shell-") && !key.startsWith(SW_VERSION))
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;

  if (data.type === "SKIP_WAITING") {
    self.skipWaiting();
    return;
  }

  if (data.type === "PRECACHE_URLS" && Array.isArray(data.urls)) {
    event.waitUntil(precachePaths(data.urls));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (shouldSkip(url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirstStatic(request));
    return;
  }

  if (isFavoritosPath(url.pathname)) {
    event.respondWith(networkFirstPage(request));
    return;
  }

  if (isAppHomePath(url.pathname)) {
    event.respondWith(handleHomeOffline(request));
    return;
  }

  // Demais navegações: rede direta (sem interceptar).
});
