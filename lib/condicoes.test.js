import test from "node:test";
import assert from "node:assert/strict";
import {
  avaliarCondicoes,
  buildDailyHighlights,
  getTideTrend,
  normalizePicosAquaticos,
  parseCondicoesData,
} from "./condicoes.js";

test("avalia cada esporte com critérios diferentes", () => {
  const surf = avaliarCondicoes("surf", {
    waveHeight: 1.2,
    swellPeriod: 9,
    windSpeed: 12,
    windGusts: 20,
  });
  const kite = avaliarCondicoes("kite", {
    waveHeight: 1,
    windSpeed: 25,
    windGusts: 32,
  });
  const sup = avaliarCondicoes("sup", {
    waveHeight: 0.2,
    windSpeed: 5,
    windGusts: 8,
  });

  assert.equal(surf.label, "Excelente");
  assert.equal(kite.label, "Excelente");
  assert.equal(sup.label, "Excelente");
});

test("não apresenta condição ruim de surf como favorável", () => {
  const result = avaliarCondicoes("surf", {
    waveHeight: 0.2,
    swellPeriod: 4,
    windSpeed: 40,
    windGusts: 60,
  });

  assert.equal(result.label, "Fraca");
  assert.ok(result.score < 45);
});

test("normaliza somente picos aquáticos com coordenadas válidas", () => {
  const result = normalizePicosAquaticos([
    {
      id: 1,
      nome: "Praia do Rosa",
      slug: "praia-do-rosa",
      subcategoria: "Praias",
      localizacoes: [{ latitude: "-28.12", longitude: "-48.64" }],
    },
    {
      id: 2,
      nome: "Restaurante Central",
      subcategoria: "Restaurantes",
      localizacoes: [{ latitude: -28.2, longitude: -48.7 }],
    },
    {
      id: 3,
      nome: "Lagoa de Ibiraquera",
      subcategoria: "Lagoas",
      localizacoes: null,
    },
  ]);

  assert.deepEqual(result, [
    {
      id: "1",
      nome: "Praia do Rosa",
      slug: "praia-do-rosa",
      latitude: -28.12,
      longitude: -48.64,
    },
  ]);
});

test("identifica tendência estimada da maré", () => {
  assert.equal(getTideTrend(-0.2, -0.1).label, "Enchendo");
  assert.equal(getTideTrend(0.3, 0.2).label, "Vazando");
  assert.equal(getTideTrend(0.1, 0.11).label, "Estável");
  assert.equal(getTideTrend(null, 0.1).label, "Sem tendência");
});

test("combina previsão meteorológica e marinha em intervalos de três horas", () => {
  const times = [
    "2026-07-29T08:00",
    "2026-07-29T09:00",
    "2026-07-29T10:00",
    "2026-07-29T11:00",
  ];
  const weather = {
    current: {
      time: times[0],
      temperature_2m: 18,
      weather_code: 1,
      wind_speed_10m: 12,
      wind_direction_10m: 180,
      wind_gusts_10m: 20,
    },
    hourly: {
      time: times,
      temperature_2m: [18, 19, 20, 21],
      weather_code: [1, 1, 1, 1],
      wind_speed_10m: [12, 13, 14, 15],
      wind_direction_10m: [180, 180, 180, 180],
      wind_gusts_10m: [20, 21, 22, 23],
    },
  };
  const marine = {
    current: {
      time: times[0],
      wave_height: 1,
      wave_direction: 90,
      wave_period: 8,
      swell_wave_height: 0.8,
      swell_wave_direction: 100,
      swell_wave_period: 9,
      sea_level_height_msl: -0.2,
      sea_surface_temperature: 19,
    },
    hourly: {
      time: times,
      wave_height: [1, 1.1, 1.2, 1.3],
      wave_direction: [90, 90, 90, 90],
      wave_period: [8, 8, 8, 8],
      swell_wave_height: [0.8, 0.8, 0.8, 0.8],
      swell_wave_direction: [100, 100, 100, 100],
      swell_wave_period: [9, 9, 9, 9],
      sea_level_height_msl: [-0.2, -0.1, 0, 0.1],
      sea_surface_temperature: [19, 19, 19, 19],
    },
  };

  const result = parseCondicoesData(weather, marine);

  assert.equal(result.current.windCompass, "S");
  assert.equal(result.current.tideTrend.label, "Enchendo");
  assert.deepEqual(
    result.timeline.map((point) => point.time),
    [times[0], times[3]]
  );
});

test("seleciona a melhor janela de cada dia", () => {
  const timeline = [
    {
      time: "2026-07-29T09:00",
      waveHeight: 0.2,
      swellPeriod: 4,
      windSpeed: 35,
      windGusts: 50,
    },
    {
      time: "2026-07-29T12:00",
      waveHeight: 1.1,
      swellPeriod: 10,
      windSpeed: 8,
      windGusts: 14,
    },
  ];

  const highlights = buildDailyHighlights(timeline, "surf");

  assert.equal(highlights.length, 1);
  assert.equal(highlights[0].best.time, "2026-07-29T12:00");
});
