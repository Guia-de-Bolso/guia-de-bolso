"use client";

import Link from "next/link";
import AdminShell, { useAdminAuth } from "@/components/admin/AdminShell";
import AtrativoForm from "@/components/admin/AtrativoForm";
import IconBack from "@/components/IconBack";

/**
 * Admin page to create a new route via `AtrativoForm`.
 * @returns {import("react").ReactElement}
 */
export default function NovoAtrativoPage() {
  const { loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando admin...
      </div>
    );
  }

  return (
    <AdminShell title="Novo atrativo">
      <Link
        href="/admin/atrativos"
        className="mb-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#1a4a3a] shadow-sm"
      >
        <IconBack className="h-4 w-4" />
        Voltar para Atrativos
      </Link>
      <AtrativoForm />
    </AdminShell>
  );
}
