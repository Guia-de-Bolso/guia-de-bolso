/**
 * Skeleton do card horizontal de lugar na listagem por categoria.
 */
export default function CategoriaLugarCardSkeleton() {
  return (
    <div className="flex animate-pulse gap-3.5 overflow-hidden rounded-[24px] bg-white p-3.5 ring-1 ring-[#e8eeee]">
      <div className="h-[108px] w-[108px] shrink-0 rounded-[20px] bg-[#e3e9e6]" />
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 py-1">
        <div className="h-4 w-3/4 rounded-lg bg-[#e3e9e6]" />
        <div className="h-3 w-1/3 rounded-lg bg-[#e3e9e6]" />
        <div className="h-3 w-full rounded-lg bg-[#e3e9e6]" />
        <div className="h-3 w-5/6 rounded-lg bg-[#e3e9e6]" />
        <div className="flex gap-2">
          <div className="h-6 w-16 rounded-full bg-[#e3e9e6]" />
          <div className="h-6 w-20 rounded-full bg-[#e3e9e6]" />
        </div>
      </div>
    </div>
  );
}
