import DetalhePageSkeleton from "@/components/loading/DetalhePageSkeleton";

/**
 * Skeleton do detalhe do atrativo enquanto o segmento de rota carrega.
 * @returns {import("react").ReactElement}
 */
export default function AtrativoDetalheLoading() {
  return <DetalhePageSkeleton />;
}
