"use client";

import { useParams } from "next/navigation";
import LugarPageClient from "@/components/lugar/LugarPageClient";

/**
 * Detalhe de lugar favorito — prioriza cache offline (client-only).
 * @returns {import("react").ReactElement}
 */
export default function FavoritoLugarPage() {
  const params = useParams();
  const lugarId = String(params.id ?? "");

  return <LugarPageClient lugarId={lugarId} offlinePreferred />;
}
