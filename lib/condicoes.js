/**
 * Previsão de mar e vento para esportes aquáticos.
 * @module lib/condicoes
 */

import { degreesToCompass, getWeatherCondition, getWeatherEmoji } from "./clima.js";

const FORECAST_DAYS = 3;
const WATER_NAME_PATTERN = /^(praia|lagoa|barra)\b/i;
const WATER_SUBCATEGORY_PATTERN = /praia|lagoa|surf|kite|mar/i;

export const CONDICOES_ATIVIDADES = Object.freeze([
  { id: "surf", label: "Surf", icon: "🏄" },
  { id: "kite", label: "Kite/Wind", icon: "🪁" },
  { id: "sup", label: "SUP/Caiaque", icon: "🛶" },
]);

/**
 * Limita um número ao intervalo informado.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Converte um valor para número finito ou null.
 * @param {unknown} value
 * @returns {number|null}
 */
function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Classifica o potencial estimado de uma atividade.
 * Não considera fundo, crowd, correntes de retorno ou conhecimento local.
 * @param {'surf'|'kite'|'sup'} atividade
 * @param {object} condicoes
 * @returns {{ score: number, label: string, tone: 'great'|'good'|'fair'|'poor', summary: string }}
 */
export function avaliarCondicoes(atividade, condicoes = {}) {
  const waveHeight = finiteNumber(condicoes.waveHeight) ?? 0;
  const swellPeriod =
    finiteNumber(condicoes.swellPeriod) ?? finiteNumber(condicoes.wavePeriod) ?? 0;
  const windSpeed = finiteNumber(condicoes.windSpeed) ?? 0;
  const windGusts = finiteNumber(condicoes.windGusts) ?? windSpeed;
  let score = 0;

  if (atividade === "kite") {
    if (windSpeed < 12) score += 5;
    else if (windSpeed < 18) score += 22;
    else if (windSpeed <= 35) score += 52;
    else if (windSpeed <= 45) score += 34;
    else score += 8;

    score += waveHeight <= 1.5 ? 23 : waveHeight <= 2.5 ? 15 : 5;
    score += windGusts - windSpeed <= 12 ? 20 : windGusts - windSpeed <= 20 ? 10 : 2;
    score += 5;
  } else if (atividade === "sup") {
    score += windSpeed <= 8 ? 45 : windSpeed <= 14 ? 32 : windSpeed <= 20 ? 15 : 3;
    score += waveHeight <= 0.4 ? 38 : waveHeight <= 0.8 ? 27 : waveHeight <= 1.2 ? 13 : 2;
    score += windGusts <= 18 ? 17 : windGusts <= 28 ? 8 : 2;
  } else {
    if (waveHeight < 0.4) score += 8;
    else if (waveHeight < 0.7) score += 20;
    else if (waveHeight <= 2.2) score += 38;
    else if (waveHeight <= 3) score += 25;
    else score += 8;

    score += swellPeriod < 6 ? 5 : swellPeriod < 8 ? 13 : swellPeriod < 11 ? 22 : 27;
    score += windSpeed <= 8 ? 24 : windSpeed <= 16 ? 18 : windSpeed <= 25 ? 9 : 2;
    score += windGusts <= 35 ? 10 : windGusts <= 50 ? 4 : 0;
  }

  const normalizedScore = Math.round(clamp(score));
  if (normalizedScore >= 85) {
    return {
      score: normalizedScore,
      label: "Excelente",
      tone: "great",
      summary: "Janela promissora pelo modelo.",
    };
  }
  if (normalizedScore >= 70) {
    return {
      score: normalizedScore,
      label: "Boa",
      tone: "good",
      summary: "Condições favoráveis pelo modelo.",
    };
  }
  if (normalizedScore >= 45) {
    return {
      score: normalizedScore,
      label: "Razoável",
      tone: "fair",
      summary: "Pode valer, confira o pico antes de entrar.",
    };
  }
  return {
    score: normalizedScore,
    label: "Fraca",
    tone: "poor",
    summary: "Pouco favorável para esta atividade.",
  };
}

/**
 * Normaliza lugares aquáticos com coordenadas válidas.
 * @param {Array<object>} rows
 * @returns {Array<{ id: string, nome: string, slug: string|null, latitude: number, longitude: number }>}
 */
export function normalizePicosAquaticos(rows = []) {
  return rows
    .map((row) => {
      const localizacao = Array.isArray(row.localizacoes)
        ? row.localizacoes[0]
        : row.localizacoes;
      const latitude = finiteNumber(localizacao?.latitude);
      const longitude = finiteNumber(localizacao?.longitude);
      const isWaterPlace =
        WATER_NAME_PATTERN.test(row.nome ?? "") ||
        WATER_SUBCATEGORY_PATTERN.test(row.subcategoria ?? "");

      if (latitude === null || longitude === null || !isWaterPlace) {
        return null;
      }

      return {
        id: String(row.id),
        nome: row.nome,
        slug: row.slug ?? null,
        latitude,
        longitude,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

/**
 * Informa tendência do nível do mar usando a próxima leitura horária.
 * @param {number|null} currentLevel
 * @param {number|null} nextLevel
 * @returns {{ id: 'rising'|'falling'|'stable'|'unknown', label: string }}
 */
export function getTideTrend(currentLevel, nextLevel) {
  if (!Number.isFinite(currentLevel) || !Number.isFinite(nextLevel)) {
    return { id: "unknown", label: "Sem tendência" };
  }

  const difference = nextLevel - currentLevel;
  if (difference > 0.025) return { id: "rising", label: "Enchendo" };
  if (difference < -0.025) return { id: "falling", label: "Vazando" };
  return { id: "stable", label: "Estável" };
}

/**
 * Agrupa a previsão por dia e encontra a melhor janela de cada atividade.
 * @param {Array<object>} timeline
 * @param {'surf'|'kite'|'sup'} atividade
 * @returns {Array<{ date: string, label: string, best: object, rating: object }>}
 */
export function buildDailyHighlights(timeline, atividade) {
  const byDate = new Map();

  timeline.forEach((point) => {
    const date = point.time?.slice(0, 10);
    if (!date) return;
    const values = byDate.get(date) ?? [];
    values.push(point);
    byDate.set(date, values);
  });

  return Array.from(byDate.entries()).map(([date, points], index) => {
    const rated = points.map((point) => ({
      point,
      rating: avaliarCondicoes(atividade, point),
    }));
    const best = rated.reduce((winner, candidate) =>
      candidate.rating.score > winner.rating.score ? candidate : winner
    );

    return {
      date,
      label:
        index === 0
          ? "Hoje"
          : new Intl.DateTimeFormat("pt-BR", { weekday: "short" })
              .format(new Date(`${date}T12:00:00`))
              .replace(".", ""),
      best: best.point,
      rating: best.rating,
    };
  });
}

/**
 * Normaliza respostas meteorológica e marinha para o hub.
 * @param {object} weather
 * @param {object} marine
 * @returns {object}
 */
export function parseCondicoesData(weather, marine) {
  const weatherCurrent = weather?.current ?? {};
  const marineCurrent = marine?.current ?? {};
  const weatherHourly = weather?.hourly ?? {};
  const marineHourly = marine?.hourly ?? {};
  const startTime = weatherCurrent.time ?? marineCurrent.time ?? "";
  const weatherIndex = new Map(
    (weatherHourly.time ?? []).map((time, index) => [time, index])
  );

  const fullTimeline = (marineHourly.time ?? []).map((time, marineIndex) => {
    const windIndex = weatherIndex.get(time);
    return {
      time,
      waveHeight: marineHourly.wave_height?.[marineIndex],
      waveDirection: marineHourly.wave_direction?.[marineIndex],
      wavePeriod: marineHourly.wave_period?.[marineIndex],
      swellHeight: marineHourly.swell_wave_height?.[marineIndex],
      swellDirection: marineHourly.swell_wave_direction?.[marineIndex],
      swellPeriod: marineHourly.swell_wave_period?.[marineIndex],
      seaLevel: marineHourly.sea_level_height_msl?.[marineIndex],
      seaTemperature: marineHourly.sea_surface_temperature?.[marineIndex],
      windSpeed:
        windIndex === undefined ? null : weatherHourly.wind_speed_10m?.[windIndex],
      windDirection:
        windIndex === undefined ? null : weatherHourly.wind_direction_10m?.[windIndex],
      windGusts:
        windIndex === undefined ? null : weatherHourly.wind_gusts_10m?.[windIndex],
      temperature:
        windIndex === undefined ? null : weatherHourly.temperature_2m?.[windIndex],
      weatherCode:
        windIndex === undefined ? null : weatherHourly.weather_code?.[windIndex],
    };
  });

  const futureTimeline = fullTimeline.filter((point) => !startTime || point.time >= startTime);
  const currentMarineIndex = Math.max(
    0,
    (marineHourly.time ?? []).findIndex((time) => time >= startTime)
  );
  const nextSeaLevel = finiteNumber(
    marineHourly.sea_level_height_msl?.[currentMarineIndex + 1]
  );
  const seaLevel = finiteNumber(marineCurrent.sea_level_height_msl);

  const timeline = futureTimeline.filter((_, index) => index % 3 === 0);
  const current = {
    time: weatherCurrent.time ?? marineCurrent.time,
    temperature: weatherCurrent.temperature_2m,
    weatherCode: weatherCurrent.weather_code,
    weatherEmoji: getWeatherEmoji(weatherCurrent.weather_code),
    condition: getWeatherCondition(weatherCurrent.weather_code),
    windSpeed: weatherCurrent.wind_speed_10m,
    windDirection: weatherCurrent.wind_direction_10m,
    windCompass: degreesToCompass(weatherCurrent.wind_direction_10m),
    windGusts: weatherCurrent.wind_gusts_10m,
    waveHeight: marineCurrent.wave_height,
    waveDirection: marineCurrent.wave_direction,
    waveCompass: degreesToCompass(marineCurrent.wave_direction),
    wavePeriod: marineCurrent.wave_period,
    swellHeight: marineCurrent.swell_wave_height,
    swellDirection: marineCurrent.swell_wave_direction,
    swellCompass: degreesToCompass(marineCurrent.swell_wave_direction),
    swellPeriod: marineCurrent.swell_wave_period,
    seaTemperature: marineCurrent.sea_surface_temperature,
    seaLevel,
    tideTrend: getTideTrend(seaLevel, nextSeaLevel),
  };

  return {
    current,
    timeline,
    updatedAt: current.time,
  };
}

/**
 * Busca três dias de vento, ondas, swell e nível do mar no Open-Meteo.
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Promise<object>}
 */
export async function fetchCondicoes(latitude, longitude) {
  const weatherVariables =
    "temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m";
  const marineVariables =
    "wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,sea_level_height_msl,sea_surface_temperature";
  const commonParams =
    `latitude=${latitude}&longitude=${longitude}` +
    `&timezone=America%2FSao_Paulo&forecast_days=${FORECAST_DAYS}`;
  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast?${commonParams}` +
    `&current=${weatherVariables}&hourly=${weatherVariables}`;
  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?${commonParams}` +
    `&current=${marineVariables}&hourly=${marineVariables}&cell_selection=sea`;

  const [weatherResponse, marineResponse] = await Promise.all([
    fetch(weatherUrl),
    fetch(marineUrl),
  ]);

  if (!weatherResponse.ok || !marineResponse.ok) {
    throw new Error("Falha ao buscar previsão de condições");
  }

  const [weather, marine] = await Promise.all([
    weatherResponse.json(),
    marineResponse.json(),
  ]);

  return parseCondicoesData(weather, marine);
}
