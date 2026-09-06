import { fetchApi } from "@/lib/fetchApi";

/**
 * @returns {Promise<{ atrativos: object[] }>}
 */
export async function fetchAtrativosPageFromApi() {
  const res = await fetchApi("/api/atrativos/catalogo");

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || "Não foi possível carregar os atrativos.");
  }

  return {
    atrativos: body.atrativos ?? [],
  };
}
