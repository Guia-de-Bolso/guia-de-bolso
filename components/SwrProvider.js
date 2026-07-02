"use client";

import { SWRConfig } from "swr";
import { defaultSwrConfig } from "@/lib/clientCacheConfig";

/**
 * Provider global do SWR (cache client-side entre navegações).
 * @param {{ children: import("react").ReactNode }} props
 * @returns {import("react").ReactElement}
 */
export default function SwrProvider({ children }) {
  return <SWRConfig value={defaultSwrConfig}>{children}</SWRConfig>;
}
