import { Suspense } from "react";
import ContratosAdminPage from "@/components/admin/ContratosAdminPage";

/**
 * Admin — contratos comerciais (somente role admin).
 * @returns {import("react").JSX.Element}
 */
export default function AdminContratosRoute() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
          Carregando admin...
        </div>
      }
    >
      <ContratosAdminPage />
    </Suspense>
  );
}
