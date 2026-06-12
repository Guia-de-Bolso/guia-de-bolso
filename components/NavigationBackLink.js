"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import IconBack from "@/components/IconBack";

/**
 * Voltar preservando histórico; usa `href` como fallback (ex.: query `from`).
 */
export default function NavigationBackLink({
  href = "/",
  className = "",
  ariaLabel = "Voltar",
  children,
  iconClassName,
}) {
  const router = useRouter();

  const handleClick = (event) => {
    event.preventDefault();

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(href);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={className}
      aria-label={ariaLabel}
    >
      {children ?? <IconBack className={iconClassName} />}
    </Link>
  );
}
