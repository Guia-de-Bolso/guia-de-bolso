"use client";

import useSWR from "swr";
import { CLIENT_CACHE_KEYS } from "@/lib/clientCacheKeys";
import { fetchPerfilPageInitialData } from "@/lib/perfilPageData";
import { createClient } from "@/lib/supabase";

/**
 * Perfil + estatísticas com cache SWR (5 min) para revisitar a aba.
 * @param {import('@/lib/perfilPageData').PerfilPageInitialData} initialData
 * @param {string|null} [currentUserId] — usuário ativo no client (ex.: após auth)
 * @returns {{
 *   data: import('@/lib/perfilPageData').PerfilPageInitialData,
 *   loading: boolean,
 *   mutate: import('swr').KeyedMutator<import('@/lib/perfilPageData').PerfilPageInitialData>,
 * }}
 */
export function usePerfilPageData(initialData, currentUserId = null) {
  const userId = currentUserId ?? initialData.user?.id ?? null;

  const { data, isLoading, isValidating, mutate } = useSWR(
    userId ? CLIENT_CACHE_KEYS.perfilPage(userId) : null,
    async () => {
      const supabase = createClient();
      return fetchPerfilPageInitialData(supabase);
    },
    {
      fallbackData: initialData,
      revalidateOnMount: Boolean(userId),
    }
  );

  return {
    data: data ?? initialData,
    loading: Boolean(userId) && !data && (isLoading || isValidating),
    mutate,
  };
}
