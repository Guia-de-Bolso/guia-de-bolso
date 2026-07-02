import { Suspense } from "react";
import ParceirosAdminPage from "@/components/admin/ParceirosAdminPage";

/** Admin — gestão de parceiros (prazos, curadoria). */
export default function AdminParceirosPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
          Carregando admin...
        </div>
      }
    >
      <ParceirosAdminPage />
    </Suspense>
  );
}
