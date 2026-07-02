import { getCategoriasVisiveis } from "@/lib/categorias";
import { getAnonServerClient } from "@/lib/supabaseAnonServer";
import { isCapacitorBuild } from "@/lib/capacitorBuild";
import { applyPublicLugarFilters } from "@/lib/publicCatalog";

/**
 * @template T
 * @param {() => Promise<T[]>} loader
 * @returns {Promise<T[]>}
 */
async function loadWhenCapacitorBuild(loader) {
  if (!isCapacitorBuild()) return [];
  return loader();
}

/**
 * @returns {Promise<Array<{ slug: string }>>}
 */
export async function fetchCapacitorLugarSlugs() {
  return loadWhenCapacitorBuild(async () => {
    const supabase = getAnonServerClient();
    if (!supabase) return [];

    const { data, error } = await applyPublicLugarFilters(
      supabase.from("lugares").select("slug")
    ).not("slug", "is", null);

    if (error) {
      console.warn("[capacitorStaticParams] lugares:", error.message);
      return [];
    }

    return (data ?? [])
      .map((row) => String(row.slug ?? "").trim())
      .filter(Boolean)
      .map((slug) => ({ slug }));
  });
}

/**
 * @returns {Promise<Array<{ id: string }>>}
 */
export async function fetchCapacitorLugarIds() {
  return loadWhenCapacitorBuild(async () => {
    const supabase = getAnonServerClient();
    if (!supabase) return [];

    const { data, error } = await applyPublicLugarFilters(
      supabase.from("lugares").select("id")
    );

    if (error) {
      console.warn("[capacitorStaticParams] lugar ids:", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({ id: String(row.id) }));
  });
}

/**
 * @returns {Promise<Array<{ id: string }>>}
 */
export async function fetchCapacitorAtrativoIds() {
  return loadWhenCapacitorBuild(async () => {
    const supabase = getAnonServerClient();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from("rotas")
      .select("id")
      .eq("ativa", true);

    if (error) {
      console.warn("[capacitorStaticParams] atrativos:", error.message);
      return [];
    }

    return (data ?? []).map((row) => ({ id: String(row.id) }));
  });
}

/**
 * @returns {Promise<Array<{ slug: string }>>}
 */
export async function fetchCapacitorCategoriaSlugs() {
  return loadWhenCapacitorBuild(async () =>
    getCategoriasVisiveis().map((item) => ({
      slug: item.nome,
    }))
  );
}
