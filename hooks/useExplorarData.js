"use client";

import useSWR from "swr";
import { CLIENT_CACHE_KEYS } from "@/lib/clientCacheKeys";
import { fetchExplorarFromApi } from "@/lib/fetchExplorarApi";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";

/**
 * Dados da tela Explorar com cache SWR (5 min).
 * @param {import('@/lib/explorarCategoryCounts').buildExplorarCountsFromLugares|null} [initialData]
 * @returns {{ data: import('@/lib/explorarCategoryCounts').buildExplorarCountsFromLugares|null, loading: boolean, error: unknown }}
 */
export function useExplorarData(initialData = null) {
  const enabled = isSupabasePublicConfigured();

  const { data, error, isLoading, isValidating } = useSWR(
    enabled ? CLIENT_CACHE_KEYS.explorar : null,
    fetchExplorarFromApi,
    {
      fallbackData: initialData ?? undefined,
      revalidateOnMount: true,
      dedupingInterval: 30_000,
    }
  );

  const loading = enabled && !data && (isLoading || isValidating);

  return { data: data ?? null, loading, error };
}
