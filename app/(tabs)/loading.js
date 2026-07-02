import HomePageSkeleton from "@/components/loading/HomePageSkeleton";

/**
 * Skeleton da home enquanto o segmento de rota carrega.
 * @returns {import("react").ReactElement}
 */
export default function HomeLoading() {
  return <HomePageSkeleton />;
}
