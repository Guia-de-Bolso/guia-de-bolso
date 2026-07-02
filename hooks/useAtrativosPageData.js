"use client";

import useSWR from "swr";
import { CLIENT_CACHE_KEYS } from "@/lib/clientCacheKeys";
import { fetchAtrativosPageFromApi } from "@/lib/fetchAtrativosPageApi";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";

/**
 * Lista de atrativos + roteiros salvos com cache SWR (5 min).
 * @param {{ atrativos?: object[], roteiros?: object[] }|null} [initialData]
 * @returns {{ data: { atrativos: object[], roteiros: object[] }|null, loading: boolean, error: unknown, mutate: import('swr').KeyedMutator<{ atrativos: object[], roteiros: object[] }> }}
 */
export function useAtrativosPageData(initialData = null) {
  const enabled = isSupabasePublicConfigured();
  const hasInitial = Boolean(initialData?.atrativos?.length);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? CLIENT_CACHE_KEYS.atrativosPage : null,
    fetchAtrativosPageFromApi,
    {
      fallbackData: initialData ?? undefined,
      revalidateOnMount: !hasInitial,
    }
  );

  const loading = enabled && !data && (isLoading || isValidating);

  return {
    data: data ?? null,
    loading,
    error,
    mutate,
  };
}
