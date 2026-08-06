"use client";

import Link from "next/link";

/**
 * Empty state padronizado do painel admin.
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {string} [props.actionLabel]
 * @param {string} [props.actionHref]
 * @param {() => void} [props.onAction]
 * @param {import("react").ReactNode} [props.icon]
 * @param {string} [props.className]
 * @returns {import("react").JSX.Element}
 */
export default function AdminEmptyState({
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  icon,
  className = "",
}) {
  return (
    <div
      className={`rounded-2xl bg-white px-6 py-12 text-center shadow-sm ring-1 ring-black/5 ${className}`.trim()}
    >
      {icon ? (
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef8f4] text-[#1a4a3a]">
          {icon}
        </div>
      ) : null}
      <h2 className="text-lg font-bold text-[#1a2e28]">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[#5a6b66]">
          {description}
        </p>
      ) : null}
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-6 inline-flex rounded-xl bg-[#1a4a3a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#153d31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30"
        >
          {actionLabel}
        </Link>
      ) : null}
      {!actionHref && actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-6 inline-flex rounded-xl bg-[#1a4a3a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#153d31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}
