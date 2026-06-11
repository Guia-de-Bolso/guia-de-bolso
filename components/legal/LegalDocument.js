"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppDeveloperCredit from "@/components/AppDeveloperCredit";
import IconBack from "@/components/IconBack";
import { LEGAL_LAST_UPDATED, LEGAL_RESPONSAVEL } from "@/lib/legalContent";

/**
 * Página legal estática (privacidade ou termos).
 * @param {object} props
 * @param {"privacidade" | "termos" | "excluir-conta"} props.kind
 * @param {string} props.title
 * @param {import("@/lib/legalContent").LegalSection[]} props.sections
 * @returns {import("react").ReactElement}
 */
export default function LegalDocument({ kind, title, sections }) {
  const searchParams = useSearchParams();
  const fromPerfil = searchParams.get("from") === "perfil";
  const backHref = fromPerfil ? "/perfil" : "/";
  const backLabel = fromPerfil ? "Voltar ao perfil" : "Voltar ao app";

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto max-w-md px-4 pb-12 pt-[max(1rem,env(safe-area-inset-top))]">
        <header className="mb-4 flex items-center gap-3">
          <Link
            href={backHref}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1a4a3a] shadow-sm ring-1 ring-[#e8eeee] transition active:scale-[0.97]"
            aria-label={backLabel}
          >
            <IconBack />
          </Link>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#1a4a3a]">
              {LEGAL_RESPONSAVEL.produto}
            </p>
            <p className="truncate text-sm font-semibold text-[#5a6b66]">{backLabel}</p>
          </div>
        </header>

        <div className="mt-2">
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#1a2e28]">
            {title}
          </h1>
          <p className="mt-2 text-xs text-[#5a6b66]">
            Atualizado em {LEGAL_LAST_UPDATED} · {LEGAL_RESPONSAVEL.nome}
          </p>
        </div>

        <nav
          className="mt-6 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-[#e8eeee]"
          aria-label="Índice"
        >
          <p className="text-xs font-bold uppercase tracking-wide text-[#5a6b66]">
            Índice
          </p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="font-medium text-[#1a4a3a] underline-offset-2 hover:underline"
                >
                  {section.title.replace(/^\d+\.\s*/, "")}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="mt-8 space-y-8">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-6">
              <h2 className="text-base font-bold text-[#1a4a3a]">{section.title}</h2>
              <div className="mt-3 space-y-3">
                {section.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    className="text-sm leading-relaxed text-[#5a6b66]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </article>

        <footer className="mt-10 rounded-2xl bg-white p-4 text-center text-xs text-[#5a6b66] shadow-sm ring-1 ring-[#e8eeee]">
          <p>
            Contato:{" "}
            <a
              href={`mailto:${LEGAL_RESPONSAVEL.email}`}
              className="font-semibold text-[#1a4a3a] underline"
            >
              {LEGAL_RESPONSAVEL.email}
            </a>
          </p>
          <p className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {kind !== "privacidade" && (
              <Link
                href={fromPerfil ? "/privacidade?from=perfil" : "/privacidade"}
                className="font-semibold text-[#1a4a3a] underline"
              >
                Política de Privacidade
              </Link>
            )}
            {kind !== "termos" && (
              <Link
                href={fromPerfil ? "/termos?from=perfil" : "/termos"}
                className="font-semibold text-[#1a4a3a] underline"
              >
                Termos de Uso
              </Link>
            )}
            {kind !== "excluir-conta" && (
              <Link
                href={fromPerfil ? "/excluir-conta?from=perfil" : "/excluir-conta"}
                className="font-semibold text-[#1a4a3a] underline"
              >
                Excluir conta
              </Link>
            )}
          </p>
          <div className="mt-4 border-t border-[#e8eeee] pt-4">
            <AppDeveloperCredit />
          </div>
        </footer>
      </div>
    </div>
  );
}
