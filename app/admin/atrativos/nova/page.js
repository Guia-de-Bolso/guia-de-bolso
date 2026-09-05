import { permanentRedirect } from "next/navigation";
import { ADMIN_ROTEIROS_NOVA_PATH } from "@/lib/roteirosPaths";

export default function LegacyAdminNovoAtrativoRedirect() {
  permanentRedirect(ADMIN_ROTEIROS_NOVA_PATH);
}
