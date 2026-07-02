/** Tempo em que o SWR evita refetch duplicado (5 min). */
export const CLIENT_CACHE_STALE_MS = 5 * 60 * 1000;

/** @type {import('swr').SWRConfiguration} */
export const defaultSwrConfig = {
  dedupingInterval: CLIENT_CACHE_STALE_MS,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
  keepPreviousData: true,
};
