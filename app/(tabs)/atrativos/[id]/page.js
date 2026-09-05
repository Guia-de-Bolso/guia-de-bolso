import { permanentRedirect } from "next/navigation";
import { fetchCapacitorAtrativoIds } from "@/lib/capacitorStaticParams";
import { isCapacitorBuild } from "@/lib/capacitorBuild";
import { roteiroDetalhePath } from "@/lib/roteirosPaths";

export const generateStaticParams = isCapacitorBuild()
  ? async () => fetchCapacitorAtrativoIds()
  : undefined;

/**
 * URL legada `/atrativos/[id]` → `/roteiros/[id]`.
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function LegacyAtrativoDetalheRedirect({ params }) {
  const { id } = await params;
  permanentRedirect(roteiroDetalhePath(id));
}
