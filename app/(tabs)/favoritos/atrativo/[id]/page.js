import { permanentRedirect } from "next/navigation";
import { fetchCapacitorAtrativoIds } from "@/lib/capacitorStaticParams";
import { isCapacitorBuild } from "@/lib/capacitorBuild";
import { favoritoRoteiroPath } from "@/lib/roteirosPaths";

export const generateStaticParams = isCapacitorBuild()
  ? async () => fetchCapacitorAtrativoIds()
  : undefined;

/**
 * URL legada `/favoritos/atrativo/[id]` → `/favoritos/roteiro/[id]`.
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function LegacyFavoritoAtrativoRedirect({ params }) {
  const { id } = await params;
  permanentRedirect(favoritoRoteiroPath(id));
}
