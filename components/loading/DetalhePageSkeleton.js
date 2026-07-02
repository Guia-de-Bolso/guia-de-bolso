import RouteLoadingStatus from "@/components/loading/RouteLoadingStatus";

/**
 * Skeleton do detalhe (lugar ou atrativo) — galeria + card sobreposto.
 * @returns {import("react").ReactElement}
 */
export default function DetalhePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f0f4f3] pb-28 text-[#1a2e28]" aria-hidden>
      <RouteLoadingStatus />

      <div className="mx-auto max-w-md">
        <div className="relative min-h-[min(52vh,420px)] animate-pulse bg-gradient-to-br from-[#d8e8e2] to-[#eef2f0]">
          <div className="absolute left-4 top-[max(0.75rem,env(safe-area-inset-top))] flex gap-2">
            <div className="h-11 w-11 rounded-full bg-white/70 shadow-sm" />
            <div className="h-11 w-11 rounded-full bg-white/70 shadow-sm" />
            <div className="h-11 w-11 rounded-full bg-white/70 shadow-sm" />
          </div>
        </div>

        <main className="relative z-[1] -mt-8 rounded-t-[32px] bg-[#f0f4f3] px-7 pb-28 pt-8 shadow-[0_-8px_32px_rgba(26,46,40,0.06)]">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-24 rounded-lg bg-[#e8eeee]" />
            <div className="h-8 w-[80%] rounded-xl bg-[#e8eeee]" />
            <div className="h-4 w-full rounded-lg bg-[#e8eeee]/90" />
            <div className="flex flex-wrap gap-2 pt-1">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-9 w-24 rounded-full bg-[#e8eeee]" />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-24 rounded-2xl bg-[#e8eeee]/90" />
              ))}
            </div>
            <div className="h-36 rounded-2xl bg-[#e8eeee]/80" />
            <div className="h-28 rounded-2xl bg-[#e8eeee]/80" />
          </div>
        </main>
      </div>
    </div>
  );
}
