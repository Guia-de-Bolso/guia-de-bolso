/**
 * Layout determinístico de pins ao longo de uma trilha ilustrada (SVG).
 * Não usa GPS — só posições visuais ao longo de um path fixo.
 * @module lib/atrativoMapaLayout
 */

/** Trilha base em viewBox 0 0 320 200 (esquerda/baixo → direita/cima). */
export const ATRATIVO_TRAIL_POINTS = [
  [28, 172],
  [52, 158],
  [74, 138],
  [96, 118],
  [118, 100],
  [142, 90],
  [168, 96],
  [190, 118],
  [210, 138],
  [234, 148],
  [258, 128],
  [278, 98],
  [296, 68],
  [308, 48],
];

/**
 * @param {Array<[number, number]>} points
 * @returns {{ segments: Array<{ from: [number, number], to: [number, number], length: number }>, totalLength: number }}
 */
export function buildTrailSegments(points = ATRATIVO_TRAIL_POINTS) {
  const segments = [];
  let totalLength = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const length = Math.hypot(dx, dy);
    segments.push({ from, to, length });
    totalLength += length;
  }

  return { segments, totalLength };
}

/**
 * Amostra um ponto a uma fração `t` (0–1) ao longo da trilha.
 * @param {number} t
 * @param {Array<[number, number]>} [points]
 * @returns {{ x: number, y: number }}
 */
export function sampleTrailAt(t, points = ATRATIVO_TRAIL_POINTS) {
  const { segments, totalLength } = buildTrailSegments(points);
  if (segments.length === 0 || totalLength <= 0) {
    const fallback = points[0] || [160, 100];
    return { x: fallback[0], y: fallback[1] };
  }

  const clamped = Math.min(1, Math.max(0, Number(t) || 0));
  let remaining = clamped * totalLength;

  for (const segment of segments) {
    if (remaining <= segment.length || segment === segments[segments.length - 1]) {
      const ratio = segment.length > 0 ? remaining / segment.length : 0;
      const safeRatio = Math.min(1, Math.max(0, ratio));
      return {
        x: segment.from[0] + (segment.to[0] - segment.from[0]) * safeRatio,
        y: segment.from[1] + (segment.to[1] - segment.from[1]) * safeRatio,
      };
    }
    remaining -= segment.length;
  }

  const last = points[points.length - 1];
  return { x: last[0], y: last[1] };
}

/**
 * Posições dos pins para `count` pontos (espalhados na trilha, sem colar nas pontas).
 * @param {number} count
 * @param {Array<[number, number]>} [points]
 * @returns {Array<{ x: number, y: number, ordem: number }>}
 */
export function getPercursoPinPositions(count, points = ATRATIVO_TRAIL_POINTS) {
  const n = Math.max(0, Math.floor(Number(count) || 0));
  if (n === 0) return [];

  if (n === 1) {
    const mid = sampleTrailAt(0.5, points);
    return [{ ...mid, ordem: 1 }];
  }

  const start = 0.06;
  const end = 0.94;
  const positions = [];

  for (let i = 0; i < n; i += 1) {
    const t = start + ((end - start) * i) / (n - 1);
    const point = sampleTrailAt(t, points);
    positions.push({ ...point, ordem: i + 1 });
  }

  return positions;
}

/**
 * Path SVG `d` a partir dos pontos da trilha (linhas suaves via polyline).
 * @param {Array<[number, number]>} [points]
 * @returns {string}
 */
export function getTrailPathD(points = ATRATIVO_TRAIL_POINTS) {
  if (!points.length) return "";
  const [first, ...rest] = points;
  return [`M ${first[0]} ${first[1]}`, ...rest.map(([x, y]) => `L ${x} ${y}`)].join(" ");
}
