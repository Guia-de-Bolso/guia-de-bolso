import DetalhePageSkeleton from "@/components/loading/DetalhePageSkeleton";

/**
 * Skeleton do detalhe de atrativo favorito (offline) enquanto o segmento carrega.
 * @returns {import("react").ReactElement}
 */
export default function FavoritoAtrativoLoading() {
  return <DetalhePageSkeleton />;
}
