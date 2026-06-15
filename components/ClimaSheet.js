"use client";

import BottomSheetShell from "@/components/BottomSheetShell";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import {
  formatNumber,
  getUvProgress,
  getWaveBarColor,
} from "@/lib/clima";

/**
 * Returns Tailwind background class for the UV index bar segment.
 * @param {string} level - UV level key (low, moderate, high, etc.).
 * @returns {string} CSS class string.
 */
function uvBarClass(level) {
  if (level === "low") return "bg-emerald-500";
  if (level === "moderate") return "bg-yellow-400";
  if (level === "high") return "bg-orange-500";
  if (level === "very-high") return "bg-red-500";
  if (level === "extreme") return "bg-purple-600";
  return "bg-gray-300";
}

/**
 * MetricRow - Label/value row for climate metrics.
 * @param {object} props
 * @param {string} props.label - Metric label.
 * @param {string} props.value - Formatted metric value.
 * @returns {import('react').ReactElement}
 */
function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-3 last:border-0">
      <span className="text-sm text-[#5a6b66]">{label}</span>
      <span className="text-right text-sm font-semibold text-[#1a2e28]">{value}</span>
    </div>
  );
}

/**
 * ClimaSheet - Bottom sheet with full beach weather and sea conditions.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the sheet is visible.
 * @param {() => void} props.onClose - Called when the user dismisses the sheet.
 * @param {object|null} props.praia - Selected beach place record.
 * @param {object|null} props.clima - Normalized climate data from APIs.
 * @returns {import('react').ReactElement|null}
 */
export default function ClimaSheet({ isOpen, onClose, praia, clima }) {
  const { sheetRef, scrollAreaRef, dragY, isDragging, sheetMotionStyle } = useBottomSheetDrag({
    isOpen,
    onClose,
    handleOnly: true,
  });

  const maxWave = Math.max(
    ...(clima?.waveChart ?? []).map((point) => Number(point.height) || 0),
    1
  );

  return (
    <BottomSheetShell
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy="clima-sheet-title"
      sheetRef={sheetRef}
      scrollRef={scrollAreaRef}
      sheetStyle={sheetMotionStyle}
      isDragging={isDragging}
      dragY={dragY}
      footer={
        <div className="shrink-0 border-t border-gray-100 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 touch-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white"
          >
            Fechar
          </button>
        </div>
      }
    >
      <div className="px-5 pt-1">
        <h2 id="clima-sheet-title" className="text-xl font-bold text-[#1a2e28]">
          {praia?.nome}
        </h2>
        <p className="mt-1 text-sm text-[#5a6b66]">Condições completas</p>

        {clima ? (
          <>
            <section className="mt-6 rounded-2xl bg-[#f0f4f3] p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
                Resumo do dia
              </h3>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-4xl" aria-hidden>
                  {clima.weatherEmoji}
                </span>
                <div>
                  <p className="text-3xl font-bold text-[#1a2e28]">
                    {formatNumber(clima.temperature, 0)}°C
                  </p>
                  <p className="text-sm text-[#5a6b66]">{clima.condition}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-sm">
                <div className="rounded-xl bg-white px-2 py-2">
                  <p className="text-[10px] uppercase text-[#5a6b66]">Mín</p>
                  <p className="font-bold text-[#1a2e28]">
                    {formatNumber(clima.tempMin, 0)}°
                  </p>
                </div>
                <div className="rounded-xl bg-white px-2 py-2">
                  <p className="text-[10px] uppercase text-[#5a6b66]">Máx</p>
                  <p className="font-bold text-[#1a2e28]">
                    {formatNumber(clima.tempMax, 0)}°
                  </p>
                </div>
                <div className="rounded-xl bg-white px-2 py-2">
                  <p className="text-[10px] uppercase text-[#5a6b66]">Sensação</p>
                  <p className="font-bold text-[#1a2e28]">
                    {formatNumber(clima.apparentTemperature, 0)}°
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-gray-100 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
                Condições do mar
              </h3>
              <div className="mt-2">
                <MetricRow
                  label="Altura das ondas"
                  value={`${formatNumber(clima.waveHeight)} m`}
                />
                <MetricRow
                  label="Período das ondas"
                  value={`${formatNumber(clima.wavePeriod, 0)} s`}
                />
                <MetricRow
                  label="Direção das ondas"
                  value={`${formatNumber(clima.waveDirection, 0)}° ${clima.waveCompass}`}
                />
                <MetricRow
                  label="Vento"
                  value={`${formatNumber(clima.windSpeed, 0)} km/h ${clima.windCompass}`}
                />
                <MetricRow
                  label="Temperatura da água"
                  value={`${formatNumber(clima.seaTemperature, 1)}°C`}
                />
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-gray-100 p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
                Ondas — próximas 24h
              </h3>
              <div className="mt-4 flex items-end justify-between gap-1">
                {(clima.waveChart ?? []).map((point) => {
                  const height = Number(point.height) || 0;
                  const barHeight = Math.max(12, Math.round((height / maxWave) * 88));

                  return (
                    <div
                      key={`${point.time}-${point.label}`}
                      className="flex min-w-0 flex-1 flex-col items-center gap-1"
                    >
                      <span className="text-[10px] font-medium text-[#5a6b66]">
                        {formatNumber(height)}m
                      </span>
                      <div
                        className={`w-full max-w-[28px] rounded-t-md ${getWaveBarColor(height)}`}
                        style={{ height: `${barHeight}px` }}
                      />
                      <span className="text-[10px] text-[#5a6b66]">{point.label}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-4 rounded-2xl border border-gray-100 p-4 pb-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-[#5a6b66]">
                Índices
              </h3>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#1a2e28]">Índice UV</span>
                  <span className="font-semibold text-[#1a4a3a]">
                    {formatNumber(clima.uvIndex, 0)} — {clima.uvLabel}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className={`h-full rounded-full transition-all ${uvBarClass(clima.uvLevel)}`}
                    style={{ width: `${getUvProgress(clima.uvIndex)}%` }}
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#f0f4f3] px-4 py-3">
                <span className="text-2xl" aria-hidden>
                  {clima.moonPhase.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#1a2e28]">Fase da lua</p>
                  <p className="text-sm text-[#5a6b66]">{clima.moonPhase.name}</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          <p className="mt-6 pb-4 text-sm text-[#5a6b66]">Dados indisponíveis no momento.</p>
        )}
      </div>
    </BottomSheetShell>
  );
}
