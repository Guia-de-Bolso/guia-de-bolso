/**
 * Paradas marcadas como feitas durante a consulta do roteiro.
 * Persiste só na sessão do navegador — não vai para o servidor.
 * @module lib/roteiroProgresso
 */

const STORAGE_KEY = "gb_roteiro_progresso_v1";

/**
 * @param {number|string} diaNumero
 * @param {number|string} ordem
 * @returns {string}
 */
export function paradaProgressoKey(diaNumero, ordem) {
  return `${diaNumero}:${ordem}`;
}

/**
 * @param {string|number|null|undefined} roteiroId
 * @param {string} [conteudo]
 * @returns {string}
 */
export function roteiroProgressScope(roteiroId, conteudo = "") {
  if (roteiroId) return `id:${roteiroId}`;

  let hash = 0;
  const texto = String(conteudo || "");
  for (let i = 0; i < texto.length; i += 1) {
    hash = (hash * 33 + texto.charCodeAt(i)) >>> 0;
  }
  return `txt:${hash.toString(36)}`;
}

/**
 * @returns {Storage|null}
 */
function getSessionStorage() {
  if (typeof sessionStorage === "undefined") return null;
  return sessionStorage;
}

/**
 * @param {Storage|null|undefined} storage
 * @returns {Record<string, string[]>}
 */
function readMap(storage) {
  if (!storage) return {};
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

/**
 * @param {string} scope
 * @param {Storage|null} [storage]
 * @returns {Set<string>}
 */
export function loadParadasConcluidas(scope, storage = getSessionStorage()) {
  const lista = readMap(storage)[scope];
  if (!Array.isArray(lista)) return new Set();
  return new Set(lista.map(String));
}

/**
 * @param {string} scope
 * @param {string} key
 * @param {Storage|null} [storage]
 * @returns {Set<string>}
 */
export function toggleParadaConcluida(scope, key, storage = getSessionStorage()) {
  const mapa = readMap(storage);
  const atual = new Set(Array.isArray(mapa[scope]) ? mapa[scope].map(String) : []);

  if (atual.has(key)) atual.delete(key);
  else atual.add(key);

  mapa[scope] = [...atual];

  if (storage) {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(mapa));
    } catch {
      /* quota ou modo privado */
    }
  }

  return atual;
}
