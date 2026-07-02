import ExplorarSkeleton from "@/components/explorar/ExplorarSkeleton";
import RouteLoadingStatus from "@/components/loading/RouteLoadingStatus";

/**
 * Skeleton da tela Explorar durante carregamento da rota.
 * @returns {import("react").ReactElement}
 */
export default function ExplorarPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <RouteLoadingStatus />

      <div className="mx-auto max-w-md px-4 pb-32">
        <div className="-mx-4 px-4 pt-safe-top pb-1" aria-hidden>
          <div className="mb-3 flex animate-pulse items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-[#e8eeee]" />
            <div className="h-3 w-24 rounded bg-[#e8eeee]/90" />
          </div>
          <div className="h-3 w-28 animate-pulse rounded bg-[#e8eeee]/80" />
          <div className="mt-2 h-8 w-36 animate-pulse rounded-xl bg-[#e8eeee]" />
          <div className="mt-2 h-4 w-48 animate-pulse rounded-lg bg-[#e8eeee]/80" />
        </div>

        <div
          className="explorar-header-shell -mx-4 mb-4 mt-1 h-[48px] animate-pulse rounded-[20px] bg-[#e8eeee] px-4"
          aria-hidden
        />

        <ExplorarSkeleton />
      </div>
    </div>
  );
}
