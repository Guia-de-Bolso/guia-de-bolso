"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { fetchFavoritoLugar } from "@/lib/data/lugarDetalheQueries";
import { CLIENT_CACHE_KEYS } from "@/lib/clientCacheKeys";
import { createClient } from "@/lib/supabase";

/**
 * Estado de favorito de um lugar com cache SWR por usuário/lugar.
 * @param {string|null|undefined} userId
 * @param {string|null|undefined} lugarId
 * @param {{ enabled?: boolean, fallback?: boolean }} [options]
 * @returns {{ isFavorito: boolean, setIsFavorito: (value: boolean) => void, mutate: import('swr').KeyedMutator<boolean> }}
 */
export function useFavoritoLugar(userId, lugarId, options = {}) {
  const { enabled = true, fallback = false } = options;
  const supabase = useMemo(() => createClient(), []);

  const cacheKey =
    enabled && userId && lugarId
      ? CLIENT_CACHE_KEYS.favoritoLugar(userId, lugarId)
      : null;

  const { data, mutate } = useSWR(
    cacheKey,
    async () => {
      const { data: row } = await fetchFavoritoLugar(supabase, userId, lugarId);
      return Boolean(row);
    },
    {
      fallbackData: fallback ? true : undefined,
      revalidateOnMount: true,
    }
  );

  /** @param {boolean} value */
  function setIsFavorito(value) {
    mutate(value, { revalidate: false });
  }

  return {
    isFavorito: data ?? false,
    setIsFavorito,
    mutate,
  };
}
