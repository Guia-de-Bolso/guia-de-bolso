import { fetchApi } from "@/lib/fetchApi";

/**
 * Busca atrativos curados via API (servidor usa anon key).
 * @param {object} [options]
 * @param {number} [options.limit]
 * @returns {Promise<object[]>}
 */
export async function fetchAtrativosFromApi(options = {}) {
  const params = new URLSearchParams();
  const { limit } = options;
  if (limit) params.set("limit", String(limit));

  const res = await fetchApi(`/api/atrativos?${params.toString()}`, {
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Não foi possível carregar os atrativos.");
  }

  return body.atrativos ?? [];
}
