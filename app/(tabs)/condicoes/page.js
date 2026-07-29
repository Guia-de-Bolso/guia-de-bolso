import { notFound } from "next/navigation";
import CondicoesHub from "@/components/condicoes/CondicoesHub";
import { CONDICOES_HUB_ENABLED } from "@/lib/featureFlags";

export const metadata = {
  title: "Condições do mar em Imbituba",
  description:
    "Ondas, swell, vento, rajadas e maré estimada para surf, kite, windsurf, SUP e caiaque em Imbituba.",
};

/**
 * Hub público de condições para esportes aquáticos.
 * @returns {import("react").ReactElement}
 */
export default function CondicoesPage() {
  if (!CONDICOES_HUB_ENABLED) {
    notFound();
  }

  return <CondicoesHub />;
}
