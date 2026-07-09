import CategoriaLugarCardSkeleton from "@/components/categoria/CategoriaLugarCardSkeleton";
import RouteLoadingStatus from "@/components/loading/RouteLoadingStatus";

/**
 * Skeleton da listagem por categoria enquanto o segmento carrega.
 * @returns {import("react").ReactElement}
 */
export default function CategoriaLoading() {
  return (
    <div className="min-h-screen bg-[#f0f4f3] pb-32 text-[#1a2e28]" aria-hidden>
      <RouteLoadingStatus />

      <div className="mx-auto max-w-md px-4">
        <div className="mb-6 animate-pulse space-y-3 pt-safe-top">
          <div className="h-10 w-10 rounded-xl bg-[#e8eeee]" />
          <div className="h-8 w-40 rounded-xl bg-[#e8eeee]" />
          <div className="h-4 w-56 rounded-lg bg-[#e8eeee]/90" />
        </div>

        <ul className="space-y-4">
          {[1, 2, 3].map((item) => (
            <li key={item}>
              <CategoriaLugarCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
