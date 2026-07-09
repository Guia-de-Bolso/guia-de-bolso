import DetalhePageSkeleton from "@/components/loading/DetalhePageSkeleton";

/**
 * Skeleton do detalhe de lugar favorito (offline) enquanto o segmento carrega.
 * @returns {import("react").ReactElement}
 */
export default function FavoritoLugarLoading() {
  return <DetalhePageSkeleton />;
}
