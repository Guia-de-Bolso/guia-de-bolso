"use client";

import useSWR from "swr";
import { CLIENT_CACHE_KEYS } from "@/lib/clientCacheKeys";
import { fetchHomePrimaryFeed } from "@/lib/fetchHomePrimaryFeed";
import { isSupabasePublicConfigured } from "@/lib/supabase/publicEnv";

/**
 * Feed principal da home com cache SWR (5 min).
 * Com dados de SSR, não refetch no mount — o CDN de `/api/lugares` e o foco da aba cobrem atualização.
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
      revalidateOnMount: !initialData,
    }
  );

  const loading = enabled && !data && (isLoading || isValidating);

  return { data: data ?? null, loading, error, mutate };
}
