import Link from "next/link";

/**
 * Atalho da home para o hub de condições de esportes aquáticos.
 * @returns {import("react").ReactElement}
 */
export default function CondicoesDoMarCard() {
  return (
    <section className="mb-6 home-reveal" aria-labelledby="condicoes-mar-home-title">
      <Link
        href="/condicoes"
        className="group block overflow-hidden rounded-[28px] bg-gradient-to-br from-[#123d34] via-[#1b5a49] to-[#2b8066] p-5 text-white shadow-[0_16px_36px_rgba(20,63,53,0.2)] transition-transform active:scale-[0.99]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="inline-flex rounded-full bg-white/14 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.13em] text-white/90 ring-1 ring-white/15">
              Novo · condições locais
            </span>
            <h2 id="condicoes-mar-home-title" className="mt-3 font-display text-xl font-bold">
              Vai entrar no mar?
            </h2>
            <p className="mt-1 max-w-[260px] text-sm leading-relaxed text-white/75">
              Veja ondas, swell, vento, rajadas e maré estimada para surf, kite e SUP.
            </p>
          </div>
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 text-2xl ring-1 ring-white/15"
            aria-hidden
          >
            🌊
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-white/12 pt-3">
          <div className="flex gap-2 text-lg" aria-hidden>
            <span>🏄</span>
            <span>🪁</span>
            <span>🛶</span>
          </div>
          <span className="text-sm font-bold">
            Conferir agora <span aria-hidden>→</span>
          </span>
        </div>
      </Link>
    </section>
  );
}
