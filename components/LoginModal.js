"use client";

import AuthFlow from "@/components/AuthFlow";
import BottomSheetShell from "@/components/BottomSheetShell";

const subtitles = {
  favoritar: "Salve seus lugares favoritos para acessar quando quiser",
  avaliar: "Compartilhe sua experiência e ajude outros viajantes",
  rotas: "Acesse atrativos detalhados com dicas exclusivas para chegar lá",
  atrativos: "Acesse atrativos detalhados com dicas exclusivas para chegar lá",
  busca: "Faça login para buscar lugares com inteligência artificial",
  clima: "Faça login para ver o clima das praias da região",
  premium: "Entre na sua conta para assinar o Guia Premium",
};

/**
 * IconHeart - Heart icon for favorites login prompt.
 * @param {object} props
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
function IconHeart({ className = "h-9 w-9" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}

/**
 * IconLock - Lock icon for restricted-content login prompt.
 * @param {object} props
 * @param {string} [props.className]
 * @returns {import('react').ReactElement}
 */
function IconLock({ className = "h-9 w-9" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18 8h-1V6A5 5 0 007 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9a2 2 0 110-4 2 2 0 010 4zm3.1-9H8.9V6a3.1 3.1 0 016.2 0v2z" />
    </svg>
  );
}

/**
 * LoginModal - Bottom sheet prompting login for restricted actions.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the modal is visible.
 * @param {() => void} props.onClose - Called when the user dismisses the modal.
 * @param {string} [props.motivo] - Context key for subtitle copy (e.g. favoritar, rotas).
 * @param {string} [props.redirectAfterLogin] - Path pós-OAuth/SMS (padrão: `/atrativos` se motivo=atrativos).
 * @param {() => void} [props.onLoginSuccess] - Chamado após login SMS no modal (sem navegar).
 * @returns {import('react').ReactElement|null}
 */
export default function LoginModal({
  isOpen,
  onClose,
  motivo = "favoritar",
  redirectAfterLogin,
  onLoginSuccess,
}) {
  const postLoginPath =
    redirectAfterLogin ?? (motivo === "atrativos" || motivo === "rotas" ? "/atrativos" : "/");
  const MainIcon = motivo === "favoritar" ? IconHeart : IconLock;
  const subtitle =
    subtitles[motivo] ??
    "Salve seus lugares favoritos e acesse conteúdo exclusivo";

  return (
    <BottomSheetShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="login-modal-title"
      maxHeight="min(92vh, 720px)"
      footer={
        <div className="shrink-0 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-sm font-medium text-[#5a6b66] transition-colors hover:text-[#1a4a3a]"
          >
            Agora não
          </button>
        </div>
      }
    >
      <div className="px-6 pt-1">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#d4ede8] text-[#1a4a3a]">
            <MainIcon className="h-8 w-8" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[#5a6b66]">{subtitle}</p>
        </div>

        <div id="login-modal-title" className="mt-5 max-h-[min(70vh,520px)] overflow-y-auto overscroll-contain">
          <AuthFlow
            compact
            redirectAfterLogin={postLoginPath}
            onLoginSuccess={onLoginSuccess}
          />
        </div>
      </div>
    </BottomSheetShell>
  );
}
