import AtrativosPageClient from "@/components/atrativos/AtrativosPageClient";
import { fetchAtrativosPageData } from "@/lib/atrativosPageData";
import { createPublicPageServerClient } from "@/lib/supabase/pageServer";

export const revalidate = 60;

/**
 * Lista pública de trilhas curadas (`rotas`).
 * @returns {Promise<import("react").ReactElement>}
 */
export default async function AtrativosPage() {
  const supabase = await createPublicPageServerClient();
  const initialData = supabase
    ? await fetchAtrativosPageData(supabase)
    : { atrativos: [] };

  return <AtrativosPageClient initialData={initialData} />;
}
