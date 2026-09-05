import AtrativosPageClient from "@/components/atrativos/AtrativosPageClient";
import { fetchAtrativosPageData } from "@/lib/atrativosPageData";
import { createPageServerClient } from "@/lib/supabase/pageServer";

/**
 * Routes listing with featured route, AI roteiro section, and saved roteiros.
 * @returns {Promise<import("react").ReactElement>}
 */
export default async function AtrativosPage() {
  const supabase = await createPageServerClient();
  const initialData = supabase
    ? await fetchAtrativosPageData(supabase)
    : { atrativos: [], roteiros: [] };

  return <AtrativosPageClient initialData={initialData} />;
}
