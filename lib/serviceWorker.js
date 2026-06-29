import { buildFavoritosPrecachePaths } from "@/lib/serviceWorkerPaths";

/**
 * @returns {boolean}
 */
export function isServiceWorkerSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator;
}

/**
 * Registra o service worker (somente fora do `next dev`).
 * @returns {Promise<ServiceWorkerRegistration|undefined>}
 */
export async function registerServiceWorker() {
  if (!isServiceWorkerSupported()) return undefined;
  if (process.env.NODE_ENV === "development") return undefined;

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });

    registration.addEventListener("updatefound", () => {
      const worker = registration.installing;
      if (!worker) return;

      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          worker.postMessage({ type: "SKIP_WAITING" });
        }
      });
    });

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }

    await registration.update();
    return registration;
  } catch (error) {
    console.warn("[serviceWorker] register:", error);
    return undefined;
  }
}

/**
 * Pede ao SW que faça fetch e guarde as rotas de favoritos (shell HTML/RSC).
 * @param {string[]} paths - Caminhos relativos, ex. `/favoritos/lugar/uuid`
 * @returns {Promise<void>}
 */
export async function precacheFavoritosShell(paths) {
  if (!isServiceWorkerSupported() || !paths?.length) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    registration.active?.postMessage({
      type: "PRECACHE_URLS",
      urls: paths,
    });
  } catch (error) {
    console.warn("[serviceWorker] precache:", error);
  }
}

/**
 * Após sync de favoritos, atualiza shell offline no service worker.
 * @param {object[]} lugares
 * @param {object[]} atrativos
 * @returns {Promise<void>}
 */
export async function precacheFavoritosAfterSync(lugares, atrativos) {
  const paths = buildFavoritosPrecachePaths(lugares, atrativos);
  await precacheFavoritosShell(paths);
}
