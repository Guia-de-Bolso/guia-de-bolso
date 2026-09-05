import { permanentRedirect } from "next/navigation";
import { adminRoteiroEditarPath } from "@/lib/roteirosPaths";

/**
 * @param {{ params: Promise<{ id: string }> }} props
 */
export default async function LegacyAdminEditarAtrativoRedirect({ params }) {
  const { id } = await params;
  permanentRedirect(adminRoteiroEditarPath(id));
}
