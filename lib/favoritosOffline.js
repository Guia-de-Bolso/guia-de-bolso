import { isBrowserOnline } from "./networkStatus.js";

export const FAVORITO_OFFLINE_SAVED_MESSAGE =
  "Salvo! Disponível offline quando não houver sinal.";

/** Copy curta para pills, highlights e cards. */
export const FAVORITO_OFFLINE_BENEFIT_SHORT =
  "Favoritos offline no celular";

/** Copy para subtítulos de onboarding, login e landing. */
export const FAVORITO_OFFLINE_BENEFIT_BODY =
  "Favorite praias e trilhas — ficam salvas automaticamente neste aparelho, mesmo sem sinal.";

export const FAVORITO_OFFLINE_TYPES = {
  LUGAR: "lugar",
  ATIVO: "atrativo",
};

const DB_NAME = "guia_favoritos_offline_v1";
const DB_VERSION = 1;
const STORE = "items";
const IMAGE_CACHE = "guia-favoritos-images-v1";
const MAX_IMAGES_PER_ITEM = 4;

/**
 * @param {string} userId
 * @param {"lugar"|"atrativo"} type
 * @param {string} id
 * @returns {string}
 */
export function buildOfflineFavoritoKey(userId, type, id) {
  return `${userId}:${type}:${id}`;
}

/**
 * @param {string} userId
 * @returns {string}
 */
export function buildOfflineMetaKey(userId) {
  return `${userId}:meta`;
}

/**
 * @returns {boolean}
 */
export function isFavoritosOfflineSupported() {
  return typeof indexedDB !== "undefined";
}

/**
 * @returns {Promise<IDBDatabase>}
 */
function openOfflineDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "key" });
        store.createIndex("userId", "userId", { unique: false });
        store.createIndex("userType", ["userId", "type"], { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

/**
 * @param {IDBDatabase} db
 * @param {string} mode
 * @param {(store: IDBObjectStore) => IDBRequest} run
 * @returns {Promise<unknown>}
 */
function runStore(db, mode, run) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    const request = run(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
    tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction failed"));
  });
}

/**
 * @param {string[]} urls
 * @returns {Promise<void>}
 */
export async function cacheFavoritoImageUrls(urls) {
  if (typeof caches === "undefined" || !isBrowserOnline()) return;

  const unique = [...new Set(urls.filter(Boolean))].slice(0, MAX_IMAGES_PER_ITEM);
  if (unique.length === 0) return;

  try {
    const cache = await caches.open(IMAGE_CACHE);
    await Promise.all(
      unique.map(async (url) => {
        try {
          const existing = await cache.match(url);
          if (existing) return;
          await cache.add(url);
        } catch {
          // CDN ou CORS podem falhar; conteúdo textual segue disponível.
        }
      })
    );
  } catch {
    // Cache API indisponível (Safari privado, etc.).
  }
}

/**
 * @param {string} userId
 * @param {"lugar"|"atrativo"} type
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<void>}
 */
export async function saveOfflineFavorito(userId, type, id, payload) {
  if (!isFavoritosOfflineSupported() || !userId || !id) return;

  const db = await openOfflineDb();
  const key = buildOfflineFavoritoKey(userId, type, String(id));
  const savedAt = new Date().toISOString();

  await runStore(db, "readwrite", (store) =>
    store.put({
      key,
      userId,
      type,
      id: String(id),
      savedAt,
      payload,
    })
  );

  db.close();
}

/**
 * @param {string} userId
 * @param {"lugar"|"atrativo"} type
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function removeOfflineFavorito(userId, type, id) {
  if (!isFavoritosOfflineSupported() || !userId || !id) return;

  const db = await openOfflineDb();
  const key = buildOfflineFavoritoKey(userId, type, String(id));
  await runStore(db, "readwrite", (store) => store.delete(key));
  db.close();
}

/**
 * @param {string} userId
 * @param {"lugar"|"atrativo"} type
 * @param {string} id
 * @returns {Promise<{ savedAt: string, payload: object }|null>}
 */
export async function getOfflineFavorito(userId, type, id) {
  if (!isFavoritosOfflineSupported() || !userId || !id) return null;

  const db = await openOfflineDb();
  const key = buildOfflineFavoritoKey(userId, type, String(id));
  const row = await runStore(db, "readonly", (store) => store.get(key));
  db.close();

  if (!row?.payload) return null;
  return { savedAt: row.savedAt, payload: row.payload };
}

/**
 * @param {string} userId
 * @returns {Promise<{ lugares: object[], atrativos: object[], lastSyncedAt: string|null }>}
 */
export async function listOfflineFavoritos(userId) {
  if (!isFavoritosOfflineSupported() || !userId) {
    return { lugares: [], atrativos: [], lastSyncedAt: null };
  }

  const db = await openOfflineDb();
  const index = db.transaction(STORE, "readonly").objectStore(STORE).index("userId");
  const rows = await new Promise((resolve, reject) => {
    const request = index.getAll(userId);
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
  });
  db.close();

  const lugares = [];
  const atrativos = [];
  let lastSyncedAt = null;

  for (const row of rows) {
    if (row.type === FAVORITO_OFFLINE_TYPES.LUGAR && row.payload?.lugar) {
      lugares.push(row.payload.lugar);
    }
    if (row.type === FAVORITO_OFFLINE_TYPES.ATIVO && row.payload?.rota) {
      atrativos.push(row.payload.rota);
    }
    if (row.key === buildOfflineMetaKey(userId) && row.payload?.lastSyncedAt) {
      lastSyncedAt = row.payload.lastSyncedAt;
    }
  }

  lugares.sort((a, b) => String(a.nome).localeCompare(String(b.nome), "pt-BR"));
  atrativos.sort((a, b) =>
    String(a.nome || a.titulo).localeCompare(String(b.nome || b.titulo), "pt-BR")
  );

  return { lugares, atrativos, lastSyncedAt };
}

/**
 * @param {string} userId
 * @param {string} isoDate
 * @returns {Promise<void>}
 */
export async function setOfflineFavoritosSyncedAt(userId, isoDate) {
  if (!isFavoritosOfflineSupported() || !userId) return;

  const db = await openOfflineDb();
  await runStore(db, "readwrite", (store) =>
    store.put({
      key: buildOfflineMetaKey(userId),
      userId,
      type: "meta",
      id: "meta",
      savedAt: isoDate,
      payload: { lastSyncedAt: isoDate },
    })
  );
  db.close();
}

/**
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function clearOfflineFavoritosForUser(userId) {
  if (!isFavoritosOfflineSupported() || !userId) return;

  const db = await openOfflineDb();
  const index = db.transaction(STORE, "readwrite").objectStore(STORE).index("userId");
  const rows = await new Promise((resolve, reject) => {
    const request = index.getAllKeys(userId);
    request.onsuccess = () => resolve(request.result ?? []);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
  });

  await Promise.all(
    rows.map(
      (key) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(STORE, "readwrite");
          const request = tx.objectStore(STORE).delete(key);
          request.onsuccess = () => resolve(undefined);
          request.onerror = () => reject(request.error);
        })
    )
  );

  db.close();
}

/**
 * Formata data de cache para exibição.
 * @param {string|null|undefined} iso
 * @returns {string|null}
 */
export function formatOfflineSavedAt(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
