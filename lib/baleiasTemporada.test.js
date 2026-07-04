import assert from "node:assert/strict";
import test from "node:test";
import {
  BALEIAS_AVISTAGENS_URL,
  BALEIAS_FONTE_NOME,
  getMesSaoPaulo,
  getTemporadaBaleiasSubtitulo,
  isTemporadaBaleiasAtiva,
} from "./baleiasTemporada.js";

test("URLs e crédito oficiais do ProFRANCA", () => {
  assert.equal(BALEIAS_AVISTAGENS_URL, "https://baleiafranca.org.br/avistagens/");
  assert.match(BALEIAS_FONTE_NOME, /Instituto Australis/);
});

test("isTemporadaBaleiasAtiva — dentro da temporada", () => {
  assert.equal(isTemporadaBaleiasAtiva(new Date("2026-07-15T12:00:00-03:00")), true);
  assert.equal(isTemporadaBaleiasAtiva(new Date("2026-09-01T12:00:00-03:00")), true);
  assert.equal(isTemporadaBaleiasAtiva(new Date("2026-11-30T12:00:00-03:00")), true);
});

test("isTemporadaBaleiasAtiva — fora da temporada", () => {
  assert.equal(isTemporadaBaleiasAtiva(new Date("2026-06-30T12:00:00-03:00")), false);
  assert.equal(isTemporadaBaleiasAtiva(new Date("2026-12-01T12:00:00-03:00")), false);
  assert.equal(isTemporadaBaleiasAtiva(new Date("2026-03-15T12:00:00-03:00")), false);
});

test("getTemporadaBaleiasSubtitulo — pico em setembro", () => {
  const texto = getTemporadaBaleiasSubtitulo(new Date("2026-09-10T12:00:00-03:00"));
  assert.match(texto, /setembro/i);
});

test("getTemporadaBaleiasSubtitulo — null fora da temporada", () => {
  assert.equal(getTemporadaBaleiasSubtitulo(new Date("2026-01-10T12:00:00-03:00")), null);
});

test("getMesSaoPaulo retorna mês numérico", () => {
  assert.equal(getMesSaoPaulo(new Date("2026-08-01T12:00:00-03:00")), 8);
});
