"use client";

import Link from "next/link";

/**
 * Barra fixa de salvar em formulários longos do admin.
 * @param {object} props
 * @param {boolean} props.dirty
 * @param {boolean} props.saving
 * @param {string} [props.saveLabel]
 * @param {string} [props.savingLabel]
 * @param {string} [props.cancelHref]
 * @param {string} [props.cancelLabel]
 * @param {boolean} [props.saveDisabled]
 * @param {boolean} [props.requireDirty=true] - Em criação, pode salvar sem marcar dirty.
 * @param {string} [props.formId] - Associa o botão a um `<form id=...>` externo.
 * @returns {import("react").JSX.Element}
 */
export default function AdminStickySaveBar({
  dirty,
  saving,
  saveLabel = "Salvar",
  savingLabel = "Salvando…",
  cancelHref,
  cancelLabel = "Cancelar",
  saveDisabled = false,
  requireDirty = true,
  formId,
}) {
  const blockedByClean = requireDirty && !dirty && !saving;

  return (
    <>
      <div className="h-20" aria-hidden />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dce5e2] bg-[#f0f4f3]/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 lg:px-8">
          <p className="text-sm text-[#5a6b66]">
            {saving ? (
              <span className="font-semibold text-[#1a4a3a]">Salvando alterações…</span>
            ) : dirty ? (
              <span className="font-semibold text-amber-800">Alterações não salvas</span>
            ) : requireDirty ? (
              <span>Tudo salvo</span>
            ) : (
              <span>Preencha e salve o cadastro</span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {cancelHref ? (
              <Link
                href={cancelHref}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#5a6b66] shadow-sm ring-1 ring-black/5 transition hover:bg-[#f7faf9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/30"
              >
                {cancelLabel}
              </Link>
            ) : null}
            <button
              type="submit"
              form={formId}
              disabled={saving || saveDisabled || blockedByClean}
              className="rounded-xl bg-[#1a4a3a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#153d31] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4a3a]/40 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? savingLabel : saveLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
