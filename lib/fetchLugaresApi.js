import { fetchApi } from "@/lib/fetchApi";

/**
 * @param {object} [options]
 * @param {number} [options.limit]
 * @param {string} [options.categoria]
 * @param {string[]} [options.ids]
 * @param {'populares'|'parceiros'|'curadoria'} [options.mode]
 * @param {RequestCache} [options.cache]
 * @returns {Promise<object[]>}
 */
export async function fetchLugaresFromApi(options = {}) {
  const params = new URLSearchParams();
  const { limit, categoria, ids, mode, cache } = options;

  if (mode === "populares") {
    params.set("mode", "populares");
    if (limit) params.set("limit", String(limit));
  } else if (mode === "parceiros" || mode === "curadoria") {
    params.set("mode", mode);
    if (limit) params.set("limit", String(limit));
  } else {
    if (limit) params.set("limit", String(limit));
    if (categoria) params.set("categoria", categoria);
    if (ids?.length) params.set("ids", ids.map(String).join(","));
  }

  const res = await fetchApi(`/api/lugares?${params.toString()}`, cache ? { cache } : {});

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Não foi possível carregar os lugares.");
  }

  return body.lugares ?? [];
}
