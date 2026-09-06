import PlaceCardSkeleton from "@/components/home/PlaceCardSkeleton";
import Logo from "@/components/Logo";

/**
 * Skeleton da aba Favoritos enquanto o RSC carrega.
 * @returns {import("react").ReactElement}
 */
export default function FavoritosLoading() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto box-border w-full min-w-0 max-w-md overflow-x-hidden px-4 pb-28 pt-safe-top">
        <header className="mb-6">
          <Logo size="sm" className="mb-3" />
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#1a2e28]">
            Favoritos
          </h1>
        </header>
        <div className="grid gap-4">
          {[0, 1, 2].map((item) => (
            <PlaceCardSkeleton key={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
