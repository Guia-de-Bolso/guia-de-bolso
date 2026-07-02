/**
 * Skeleton de carregamento do dashboard admin.
 * @returns {import("react").JSX.Element}
 */
export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6 md:space-y-8">
      <div className="min-h-[140px] rounded-3xl bg-white/80 ring-1 ring-black/5" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
        <div className="h-52 rounded-3xl bg-white/80 ring-1 ring-black/5 sm:col-span-2 lg:col-span-6" />
        <div className="h-44 rounded-3xl bg-white/80 ring-1 ring-black/5 lg:col-span-3" />
        <div className="h-44 rounded-3xl bg-white/80 ring-1 ring-black/5 lg:col-span-3" />
        <div className="h-44 rounded-3xl bg-white/80 ring-1 ring-black/5 lg:col-span-3" />
        <div className="h-44 rounded-3xl bg-white/80 ring-1 ring-black/5 lg:col-span-3" />
        <div className="h-44 rounded-3xl bg-white/80 ring-1 ring-black/5 lg:col-span-3" />
        <div className="h-44 rounded-3xl bg-white/80 ring-1 ring-black/5 lg:col-span-3" />
      </div>

      <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
        <div className="min-h-[320px] rounded-3xl bg-white/80 ring-1 ring-black/5 lg:col-span-3" />
        <div className="min-h-[320px] rounded-3xl bg-white/80 ring-1 ring-black/5 lg:col-span-2" />
      </div>

      <div className="min-h-[240px] rounded-3xl bg-white/80 ring-1 ring-black/5" />
    </div>
  );
}
