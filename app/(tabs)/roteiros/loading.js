/**
 * Skeleton UI shown while the atrativos route segment is loading.
 * @returns {import("react").ReactElement}
 */
export default function AtrativosLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-5 py-6">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
            <div className="h-48 w-full animate-pulse rounded-xl bg-gray-200" />
            <div className="space-y-3 p-4">
              <div className="h-7 w-3/4 animate-pulse rounded-xl bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded-xl bg-gray-200" />
              <div className="flex gap-3 pt-1">
                <div className="h-4 w-20 animate-pulse rounded-xl bg-gray-200" />
                <div className="h-4 w-20 animate-pulse rounded-xl bg-gray-200" />
                <div className="h-4 w-20 animate-pulse rounded-xl bg-gray-200" />
              </div>
            </div>
          </div>

          {[1, 2, 3].map((item) => (
            <div key={item} className="flex gap-3 rounded-3xl bg-white p-3 shadow-sm">
              <div className="h-24 w-24 shrink-0 animate-pulse rounded-xl bg-gray-200" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 w-3/4 animate-pulse rounded-xl bg-gray-200" />
                <div className="h-4 w-full animate-pulse rounded-xl bg-gray-200" />
                <div className="h-4 w-2/3 animate-pulse rounded-xl bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
