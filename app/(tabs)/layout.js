import TabsShell from "@/components/TabsShell";

/**
 * Layout compartilhado das abas principais (bottom nav persistente).
 * @param {{ children: import("react").ReactNode }} props
 * @returns {import("react").ReactElement}
 */
export default function TabsLayout({ children }) {
  return <TabsShell>{children}</TabsShell>;
}
