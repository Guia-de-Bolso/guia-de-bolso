import Link from "next/link";
import RemotePhoto from "@/components/shared/RemotePhoto";
import Logo from "@/components/Logo";

/**
 * Página 404 — rota não encontrada, visual alinhado ao Guia de Bolso.
 * @returns {import("react").ReactElement}
 */
export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8">
        <div className="flex items-center gap-2">
          <Logo size="sm" variant="default" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1a4a3a]/70">
            Guia de bolso
          </p>
        </div>

        <div className="relative mt-6 overflow-hidden rounded-[28px] shadow-lg ring-1 ring-black/5">
          <div className="relative h-52 w-full">
            <RemotePhoto
              src="https://picsum.photos/seed/imbituba-litoral/800/520"
              alt="Paisagem do litoral de Imbituba"
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f1a]/90 via-[#0b1f1a]/40 to-[#0b1f1a]/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 p-2 backdrop-blur-md">
                <Logo size="md" variant="light" />
              </div>
              <p className="mt-4 text-6xl font-extrabold tracking-tight text-white">404</p>
            </div>
          </div>

          <div className="bg-white px-6 py-7">
            <h1 className="font-display text-2xl font-bold text-[#1a2e28]">
              Caminho não encontrado
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-[#5a6b66]">
              Essa página não existe ou foi movida. Mas o litoral continua aqui —
              entre na sua conta e descubra praias, trilhas e lugares perto de você.
            </p>
          </div>
        </div>

        <Link
          href="/login"
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-bold text-white shadow-lg transition-transform active:scale-[0.98]"
        >
          Entrar no Guia
          <span aria-hidden>→</span>
        </Link>

        <p className="mt-6 text-center text-xs text-[#8a9a95]">
          Imbituba · Santa Catarina
        </p>
      </div>
    </div>
  );
}
