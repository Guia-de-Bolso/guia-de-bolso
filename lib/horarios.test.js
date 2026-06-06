import assert from "node:assert/strict";
import {
  formatHorario,
  getDiaAtualKey,
  getStatusFuncionamento,
  horariosTemCadastro,
  parseHorarioDia,
  serializeHorarioDia,
  validarIntervalos,
} from "./horarios.js";

const segunda14h = new Date("2026-05-25T14:00:00-03:00");
const segunda16h = new Date("2026-05-25T16:00:00-03:00");
const segunda21h = new Date("2026-05-25T21:00:00-03:00");
const segunda2330 = new Date("2026-05-25T23:30:00-03:00");
const segunda10h = new Date("2026-05-25T10:00:00-03:00");
const sexta23h = new Date("2026-05-29T23:00:00-03:00");
const sabado0030 = new Date("2026-05-30T00:30:00-03:00");
const sabado0015 = new Date("2026-05-30T00:15:00-03:00");

const doisTurnos = {
  seg: "11:00-15:00,18:00-23:00",
  ter: "09:00-18:00",
  qua: "fechado",
  qui: "09:00-18:00",
  sex: "09:00-18:00",
  sab: "09:00-18:00",
  dom: "fechado",
};

const pubNoturno = {
  dom: "18:30-00:00",
  seg: "18:30-00:00",
  ter: "18:30-00:00",
  qua: "18:30-00:00",
  qui: "18:30-00:00",
  sex: "18:30-00:00",
  sab: "18:30-00:00",
};

const carryOverPub = {
  dom: "fechado",
  seg: "fechado",
  ter: "fechado",
  qua: "fechado",
  qui: "fechado",
  sex: "22:00-02:00",
  sab: "fechado",
};

assert.equal(getDiaAtualKey(segunda14h), "seg");
assert.equal(getDiaAtualKey(sexta23h), "sex");
assert.equal(getDiaAtualKey(sabado0030), "sab");

assert.deepEqual(parseHorarioDia("08:00-18:00").intervalos, [
  { inicio: "08:00", fim: "18:00" },
]);

assert.deepEqual(parseHorarioDia("11:00-15:00,18:00-23:00").intervalos, [
  { inicio: "11:00", fim: "15:00" },
  { inicio: "18:00", fim: "23:00" },
]);

assert.equal(
  serializeHorarioDia({
    fechado: false,
    vinteQuatroHoras: false,
    intervalos: [
      { inicio: "11:00", fim: "15:00" },
      { inicio: "18:00", fim: "23:00" },
    ],
  }),
  "11:00-15:00,18:00-23:00"
);

assert.equal(
  formatHorario("11:00-15:00,18:00-23:00"),
  "11:00 – 15:00 · 18:00 – 23:00"
);

assert.equal(
  formatHorario("18:30-00:00"),
  "18:30 – 00:00 (dia seguinte)"
);

assert.equal(validarIntervalos([{ inicio: "11:00", fim: "15:00" }]).valid, true);
assert.equal(validarIntervalos([{ inicio: "18:30", fim: "00:00" }]).valid, true);
assert.equal(
  validarIntervalos([
    { inicio: "11:00", fim: "15:00" },
    { inicio: "18:00", fim: "04:00" },
  ]).valid,
  true
);
assert.equal(
  validarIntervalos([
    { inicio: "11:00", fim: "15:00" },
    { inicio: "18:30", fim: "00:00" },
  ]).valid,
  true
);
assert.equal(
  validarIntervalos([
    { inicio: "11:00", fim: "15:00" },
    { inicio: "14:00", fim: "18:00" },
  ]).valid,
  false
);
assert.equal(
  validarIntervalos([
    { inicio: "18:00", fim: "04:00" },
    { inicio: "22:00", fim: "03:00" },
  ]).valid,
  false
);
assert.equal(
  validarIntervalos([
    { inicio: "11:00", fim: "19:00" },
    { inicio: "18:00", fim: "04:00" },
  ]).valid,
  false
);

const legado = { seg: "09:00-18:00" };
const statusLegado = getStatusFuncionamento(legado, undefined, segunda10h);
assert.equal(statusLegado.aberto, true);
assert.match(statusLegado.detail, /Fecha às 18:00/);

const abertoTurno1 = getStatusFuncionamento(doisTurnos, undefined, segunda14h);
assert.equal(abertoTurno1.aberto, true);
assert.equal(abertoTurno1.detail, "Fecha às 15:00");

const pausa = getStatusFuncionamento(doisTurnos, undefined, segunda16h);
assert.equal(pausa.aberto, false);
assert.equal(pausa.detail, "Abre mais tarde às 18:00");

const almocoJantarNoturno = {
  seg: "11:00-15:00,18:00-04:00",
  ter: "11:00-15:00,18:00-04:00",
  qua: "11:00-15:00,18:00-04:00",
  qui: "11:00-15:00,18:00-04:00",
  sex: "11:00-15:00,18:00-04:00",
  sab: "11:00-15:00,18:00-04:00",
  dom: "11:00-15:00,18:00-04:00",
};
const pausaAlmocoJantar = getStatusFuncionamento(almocoJantarNoturno, undefined, segunda16h);
assert.equal(pausaAlmocoJantar.aberto, false);
assert.equal(pausaAlmocoJantar.detail, "Abre mais tarde às 18:00");

const madrugadaJantar = new Date("2026-05-26T02:00:00-03:00");
const abertoMadrugada = getStatusFuncionamento(almocoJantarNoturno, undefined, madrugadaJantar);
assert.equal(abertoMadrugada.aberto, true);
assert.equal(abertoMadrugada.detail, "Fecha às 04:00");

const abertoTurno2 = getStatusFuncionamento(doisTurnos, undefined, segunda21h);
assert.equal(abertoTurno2.aberto, true);
assert.equal(abertoTurno2.detail, "Fecha às 23:00");

const fechadoHoje = getStatusFuncionamento(doisTurnos, undefined, segunda2330);
assert.equal(fechadoHoje.aberto, false);
assert.equal(fechadoHoje.detail, "Fechado hoje");

const antesTurno1 = getStatusFuncionamento(doisTurnos, undefined, segunda10h);
assert.equal(antesTurno1.aberto, false);
assert.equal(antesTurno1.detail, "Abre às 11:00");

const diaFechado = {
  seg: "fechado",
  ter: "11:00-15:00,18:00-23:00",
  qua: "fechado",
  qui: "fechado",
  sex: "fechado",
  sab: "fechado",
  dom: "fechado",
};
const statusFechado = getStatusFuncionamento(diaFechado, undefined, segunda14h);
assert.equal(statusFechado.aberto, false);
assert.match(statusFechado.detail, /Fechado hoje · Abre terça às 11:00/);

const vinteQuatro = { seg: "24h" };
const status24 = getStatusFuncionamento(vinteQuatro, undefined, segunda14h);
assert.equal(status24.aberto, true);
assert.equal(status24.detail, "Aberto 24 horas");

const abertoNoturno = getStatusFuncionamento(pubNoturno, undefined, sexta23h);
assert.equal(abertoNoturno.aberto, true);
assert.equal(abertoNoturno.detail, "Fecha à meia-noite");
assert.match(abertoNoturno.resumo, /meia-noite/);

const fechadoMadrugada = getStatusFuncionamento(pubNoturno, undefined, sabado0030);
assert.equal(fechadoMadrugada.aberto, false);

const carryOverAberto = getStatusFuncionamento(carryOverPub, undefined, sabado0015);
assert.equal(carryOverAberto.aberto, true);
assert.equal(carryOverAberto.detail, "Fecha às 02:00");

const todosFechados = {
  seg: "fechado",
  ter: "fechado",
  qua: "fechado",
  qui: "fechado",
  sex: "fechado",
  sab: "fechado",
  dom: "fechado",
};

assert.equal(horariosTemCadastro(null), false);
assert.equal(horariosTemCadastro({}), false);
assert.equal(horariosTemCadastro(todosFechados), false);
assert.equal(horariosTemCadastro(legado), true);
assert.equal(horariosTemCadastro(vinteQuatro), true);

assert.equal(getStatusFuncionamento(null, undefined, segunda14h), null);
assert.equal(getStatusFuncionamento(todosFechados, undefined, segunda14h), null);
assert.equal(getStatusFuncionamento(todosFechados, true, segunda14h), null);
assert.equal(getStatusFuncionamento(legado, true, segunda10h).aberto, true);

console.log("lib/horarios.test.js: all assertions passed");
