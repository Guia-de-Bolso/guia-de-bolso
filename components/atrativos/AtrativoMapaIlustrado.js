"use client";

import { getPercursoPinPositions, getTrailPathD } from "@/lib/atrativoMapaLayout";

/**
 * Mapa ilustrado (sem GPS) com pins sincronizados ao progresso do percurso.
 * @param {object} props
 * @param {Array<{ id: string }>} props.pontos
 * @param {(pontoId: string) => boolean} props.isPontoDone
 * @param {number} props.currentIndex - índice do próximo / ativo
 * @param {(index: number) => void} [props.onPinClick]
 */
export default function AtrativoMapaIlustrado({
  pontos = [],
  isPontoDone,
  currentIndex = 0,
  onPinClick,
}) {
  const pins = getPercursoPinPositions(pontos.length);
  const trailD = getTrailPathD();

  if (!pontos.length) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#d8ebe4] via-[#e8f3ef] to-[#c5ddd4] shadow-[0_8px_28px_rgba(26,74,58,0.12)] ring-1 ring-[#cfe0d9]">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.7) 0, transparent 40%), radial-gradient(circle at 80% 20%, rgba(26,74,58,0.08) 0, transparent 35%)",
        }}
        aria-hidden
      />

      <svg
        viewBox="0 0 320 200"
        className="relative z-[1] h-auto w-full"
        role="img"
        aria-label={`Mapa ilustrado do percurso com ${pontos.length} pontos`}
      >
        {/* Colinas */}
        <ellipse cx="55" cy="175" rx="70" ry="28" fill="#b7d4c8" opacity="0.85" />
        <ellipse cx="160" cy="185" rx="90" ry="22" fill="#a8cbbb" opacity="0.7" />
        <ellipse cx="270" cy="170" rx="60" ry="26" fill="#b7d4c8" opacity="0.8" />

        {/* Lago */}
        <ellipse cx="248" cy="58" rx="42" ry="18" fill="#9ec9e0" opacity="0.55" />
        <ellipse cx="248" cy="56" rx="28" ry="10" fill="#c5e4f2" opacity="0.45" />

        {/* Árvores simples */}
        <g fill="#1a4a3a" opacity="0.35">
          <circle cx="42" cy="120" r="8" />
          <rect x="40" y="126" width="4" height="10" rx="1" fill="#2d5a4a" />
          <circle cx="88" cy="78" r="7" />
          <rect x="86" y="83" width="4" height="9" rx="1" fill="#2d5a4a" />
          <circle cx="300" cy="110" r="9" />
          <rect x="298" y="116" width="4" height="11" rx="1" fill="#2d5a4a" />
        </g>

        {/* Trilha (sombra + linha) */}
        <path
          d={trailD}
          fill="none"
          stroke="#1a4a3a"
          strokeOpacity="0.12"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={trailD}
          fill="none"
          stroke="#f7faf8"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="2 10"
        />
        <path
          d={trailD}
          fill="none"
          stroke="#1a4a3a"
          strokeOpacity="0.55"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Pins */}
        {pins.map((pin, index) => {
          const ponto = pontos[index];
          const id = String(ponto?.id ?? "");
          const done = Boolean(id && isPontoDone?.(id));
          const isCurrent = index === currentIndex && !done;
          const fill = done ? "#1a4a3a" : isCurrent ? "#2f7a62" : "#ffffff";
          const textFill = done || isCurrent ? "#ffffff" : "#1a4a3a";
          const ring = done ? "#1a4a3a" : isCurrent ? "#1a4a3a" : "#9bb5aa";

          return (
            <g key={id || `pin-${index}`} transform={`translate(${pin.x} ${pin.y})`}>
              {isCurrent && (
                <circle r="14" fill="#1a4a3a" opacity="0.18">
                  <animate
                    attributeName="r"
                    values="12;16;12"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.22;0.08;0.22"
                    dur="1.8s"
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              <circle
                r="11"
                fill={fill}
                stroke={ring}
                strokeWidth="2.5"
                className={onPinClick ? "cursor-pointer" : undefined}
                onClick={
                  onPinClick
                    ? (event) => {
                        event.preventDefault();
                        onPinClick(index);
                      }
                    : undefined
                }
                role={onPinClick ? "button" : undefined}
                tabIndex={onPinClick ? 0 : undefined}
                onKeyDown={
                  onPinClick
                    ? (event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          onPinClick(index);
                        }
                      }
                    : undefined
                }
                aria-label={`Ponto ${pin.ordem}${done ? ", concluído" : isCurrent ? ", atual" : ""}`}
              />
              {done ? (
                <path
                  d="M-4 0.5 L-1.5 3 L4.5 -3"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pointerEvents="none"
                />
              ) : (
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textFill}
                  fontSize="10"
                  fontWeight="700"
                  pointerEvents="none"
                >
                  {pin.ordem}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="relative z-[1] px-3 pb-2.5 text-center text-[10px] font-medium uppercase tracking-[0.16em] text-[#5a7a6e]">
        Mapa ilustrativo · não é GPS
      </p>
    </div>
  );
}
