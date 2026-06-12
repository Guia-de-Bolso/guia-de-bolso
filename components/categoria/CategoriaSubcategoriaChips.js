"use client";

/**
 * Filtros horizontais por subcategoria com contagem de lugares.
 */
export default function CategoriaSubcategoriaChips({ selecionada, onSelecionar, opcoes }) {
  if (opcoes.length === 0) return null;

  return (
    <div className="home-reveal sticky top-0 z-20 -mx-4 mb-5 border-b border-[#e8eeee]/80 bg-[#f0f4f3]/92 px-4 py-3 backdrop-blur-xl">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a4a3a]/70">
        Filtrar por tipo
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {opcoes.map((opcao) => {
          const selected = selecionada === opcao.nome;
          return (
            <button
              key={opcao.id ?? opcao.nome}
              type="button"
              onClick={() => onSelecionar(opcao.nome)}
              aria-pressed={selected}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                selected
                  ? "bg-[#1a4a3a] text-white shadow-[0_4px_16px_rgba(26,74,58,0.22)]"
                  : "bg-white text-[#1a4a3a] ring-1 ring-[#e8eeee] hover:ring-[#1a4a3a]/15"
              }`}
            >
              {opcao.icone ? <span aria-hidden>{opcao.icone}</span> : null}
              <span>{opcao.nome}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                  selected ? "bg-white/18 text-white" : "bg-[#f0f4f3] text-[#5a6b66]"
                }`}
              >
                {opcao.count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
