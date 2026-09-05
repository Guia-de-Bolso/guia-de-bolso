import { permanentRedirect } from "next/navigation";
import { ADMIN_ROTEIROS_PATH } from "@/lib/roteirosPaths";

export default function LegacyAdminAtrativosRedirect() {
  permanentRedirect(ADMIN_ROTEIROS_PATH);
}
