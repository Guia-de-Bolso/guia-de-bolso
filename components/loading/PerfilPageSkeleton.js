import RouteLoadingStatus from "@/components/loading/RouteLoadingStatus";
import PerfilSkeleton from "@/components/perfil/PerfilSkeleton";

/**
 * Skeleton da aba Perfil durante carregamento da rota.
 * @returns {import("react").ReactElement}
 */
export default function PerfilPageSkeleton() {
  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <RouteLoadingStatus />

      <header className="px-4 pt-safe-top">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-[#1a2e28]">Perfil</h1>
          <p className="mt-1 text-sm text-[#5a6b66]">Sua conta e preferências na região</p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-32 pt-5">
        <PerfilSkeleton />
      </main>
    </div>
  );
}
