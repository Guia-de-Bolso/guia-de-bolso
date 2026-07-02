import { fetchCapacitorAtrativoIds } from "@/lib/capacitorStaticParams";

export async function generateStaticParams() {
  return fetchCapacitorAtrativoIds();
}

/**
 * @param {{ children: import("react").ReactNode }} props
 * @returns {import("react").ReactElement}
 */
export default function FavoritoAtrativoLayout({ children }) {
  return children;
}
