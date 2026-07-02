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

      <div className="mx-auto max-w-md px-4 pb-32">
        <div className="home-context-atmosphere -mx-4">
          <div className="home-context-atmosphere__mesh" aria-hidden="true" />

          <div className="relative z-[1] px-4 pt-safe-top">
            <header className="pb-5" aria-hidden>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 animate-pulse space-y-2.5">
                  <div className="h-3 w-28 rounded bg-[#e8eeee]/90" />
                  <div className="h-8 w-52 max-w-full rounded-xl bg-[#e8eeee]" />
                  <div className="flex flex-wrap gap-2 pt-1">
                    <div className="h-8 w-32 rounded-full bg-[#e8eeee]/90" />
                    <div className="h-8 w-16 rounded-full bg-[#e8eeee]/80" />
                  </div>
                </div>
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-[#e8eeee]" />
              </div>
            </header>
          </div>

          <div className="relative z-[1] px-4 pb-4 pt-2">
            <div
              className="mb-6 h-[52px] animate-pulse rounded-[20px] bg-white/80 ring-1 ring-[#e8eeee] shadow-sm"
              aria-hidden
            />
          </div>
        </div>

        <div className="animate-pulse space-y-10" aria-hidden>
          <section>
            <div className="mb-3 space-y-2">
              <div className="h-3 w-36 rounded bg-[#e8eeee]/90" />
              <div className="h-6 w-44 rounded-lg bg-[#e8eeee]" />
            </div>
            <div className="relative min-h-[440px] overflow-hidden rounded-[32px] bg-[#e8eeee] ring-1 ring-[#e8eeee]">
              <div className="absolute inset-0 bg-gradient-to-br from-[#d8e8e2] to-[#eef2f0]" />
              <div className="absolute inset-x-0 bottom-0 space-y-3 p-6">
                <div className="h-7 w-2/3 rounded-xl bg-white/40" />
                <div className="h-4 w-full rounded-lg bg-white/30" />
                <div className="flex gap-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-9 w-20 rounded-full bg-white/25" />
                  ))}
                </div>
                <div className="h-12 rounded-2xl bg-[#1a4a3a]/20" />
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
