import { permanentRedirect } from "next/navigation";
import { ROTEIROS_PATH } from "@/lib/roteirosPaths";

/** URL legada — redireciona para `/roteiros` (Capacitor export não usa next.config redirects). */
export default function LegacyAtrativosRedirect() {
  permanentRedirect(ROTEIROS_PATH);
}
