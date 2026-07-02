import { fetchCapacitorLugarIds } from "@/lib/capacitorStaticParams";

export async function generateStaticParams() {
  return fetchCapacitorLugarIds();
}

/**
 * @param {{ children: import("react").ReactNode }} props
 * @returns {import("react").ReactElement}
 */
export default function FavoritoLugarLayout({ children }) {
  return children;
}
