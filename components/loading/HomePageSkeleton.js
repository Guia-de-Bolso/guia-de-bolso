import PlaceCardSkeleton from "@/components/home/PlaceCardSkeleton";
import RouteLoadingStatus from "@/components/loading/RouteLoadingStatus";

/**
 * Skeleton da home durante carregamento da rota.
 * @returns {import("react").ReactElement}
 */
export default function HomePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <RouteLoadingStatus />

      <div className="mx-auto max-w-md px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))]">
        <div className="home-context-atmosphere -mx-4">
          <div className="home-context-atmosphere__mesh" aria-hidden="true" />

          <div className="relative z-[1] px-4 pt-safe-top">
            <header className="pb-2" aria-hidden>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 animate-pulse space-y-2">
                  <div className="h-2.5 w-36 rounded bg-[#e8eeee]/90" />
                  <div className="h-3.5 w-40 max-w-full rounded bg-[#e8eeee]/80" />
                  <div className="h-7 w-56 max-w-full rounded-xl bg-[#e8eeee]" />
                </div>
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-[#e8eeee]" />
              </div>
            </header>
          </div>

          <div className="relative z-[1] px-4 pb-3 pt-1.5">
            <div
              className="mb-5 h-[88px] animate-pulse rounded-[20px] bg-white/80 shadow-sm ring-1 ring-[#e8eeee]"
              aria-hidden
            />
          </div>
        </div>

        <div className="animate-pulse space-y-8" aria-hidden>
          <section>
            <div className="relative min-h-[340px] overflow-hidden rounded-[28px] bg-[#e8eeee] ring-1 ring-[#e8eeee]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#d8e8e2] to-[#eef2f0]" />
              <div className="absolute inset-x-0 bottom-0 space-y-3 p-5">
                <div className="h-7 w-2/3 rounded-xl bg-white/40" />
                <div className="h-4 w-full rounded-lg bg-white/30" />
                <div className="h-3.5 w-36 rounded bg-white/25" />
                <div className="h-11 rounded-2xl bg-[#1a4a3a]/20" />
              </div>
            </div>
          </section>

          <section>
            <div className="mb-3 h-6 w-40 rounded-lg bg-[#e8eeee]" />
            <div className="-mx-1 flex gap-3 overflow-hidden px-1">
              {[1, 2].map((item) => (
                <div
                  key={item}
                  className="h-[220px] w-[78%] shrink-0 rounded-[28px] bg-[#e8eeee]"
                />
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <div className="h-6 w-36 rounded-lg bg-[#e8eeee]" />
            <PlaceCardSkeleton />
          </section>
        </div>
      </div>
    </div>
  );
}
