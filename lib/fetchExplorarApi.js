import { fetchApi } from "@/lib/fetchApi";

/**
 * @returns {Promise<import('@/lib/explorarCategoryCounts').buildExplorarCountsFromLugares|null>}
 */
export async function fetchExplorarFromApi() {
  const res = await fetchApi("/api/explorar");

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Não foi possível carregar o Explorar.");
  }

  if (!body.data) return null;
  return body.data;
}
