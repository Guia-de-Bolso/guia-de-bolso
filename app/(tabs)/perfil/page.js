import PerfilPageClient from "@/components/perfil/PerfilPageClient";
import {
  CAPACITOR_GUEST_PERFIL_INITIAL,
  isCapacitorBuild,
} from "@/lib/capacitorBuild";
import { fetchPerfilPageInitialData } from "@/lib/perfilPageData";
import { createPageServerClient } from "@/lib/supabase/pageServer";

/**
 * Aba Perfil — dados iniciais no servidor (sessão, perfil e estatísticas).
 * @returns {Promise<import("react").ReactElement>}
 */
export default async function PerfilPage() {
  if (isCapacitorBuild()) {
    return <PerfilPageClient initialData={CAPACITOR_GUEST_PERFIL_INITIAL} />;
  }

  const supabase = await createPageServerClient();
  if (!supabase) {
    return <PerfilPageClient initialData={CAPACITOR_GUEST_PERFIL_INITIAL} />;
  }

  const initialData = await fetchPerfilPageInitialData(supabase);

  return <PerfilPageClient initialData={initialData} />;
}
