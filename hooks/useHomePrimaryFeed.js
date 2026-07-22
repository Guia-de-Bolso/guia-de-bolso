"use client";

import useSWR from "swr";
import { CLIENT_CACHE_KEYS } from "@/lib/clientCacheKeys";
import { fetchHomePrimaryFeed } from "@/lib/fetchHomePrimaryFeed";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";

/**
 * Feed principal da home com cache SWR (5 min).
 * Sempre revalida no mount: o SSR/Full Route Cache pode ficar horas desatualizado
 * (parceiros novos somem do carrossel se confiarmos só no fallback).
 * @param {Awaited<ReturnType<import('@/lib/homePageData').fetchHomePageInitialData>>} [initialData]
 * @returns {{ data: Awaited<ReturnType<typeof fetchHomePrimaryFeed>>|null, loading: boolean, error: unknown, mutate: import('swr').KeyedMutator<Awaited<ReturnType<typeof fetchHomePrimaryFeed>>> }}
 */
export function useHomePrimaryFeed(initialData = null) {
  const enabled = isSupabasePublicConfigured();

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    enabled ? CLIENT_CACHE_KEYS.homePrimary : null,
    fetchHomePrimaryFeed,
    {
      fallbackData: initialData ?? undefined,
      revalidateOnMount: true,
    }
  );

  const loading = enabled && !data && (isLoading || isValidating);

  return { data: data ?? null, loading, error, mutate };
}
