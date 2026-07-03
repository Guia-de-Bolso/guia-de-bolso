import assert from "node:assert/strict";
import {
  getLugarStatusLabel,
  isLugarAtivo,
  isLugarInativoComPurge,
  isLugarPausado,
  LUGAR_STATUS,
} from "./lugarStatus.js";

assert.equal(isLugarAtivo({ status: LUGAR_STATUS.ATIVO }), true);
assert.equal(isLugarAtivo({ status: LUGAR_STATUS.PAUSADO }), false);
assert.equal(isLugarPausado({ status: LUGAR_STATUS.PAUSADO }), true);
assert.equal(isLugarInativoComPurge({ status: LUGAR_STATUS.DESATIVADO }), true);
assert.equal(isLugarInativoComPurge({ status: LUGAR_STATUS.PAUSADO }), false);
assert.equal(getLugarStatusLabel(LUGAR_STATUS.PAUSADO), "Desativado");
assert.equal(getLugarStatusLabel(LUGAR_STATUS.DESATIVADO), "Inativo");

console.log("lugarStatus.test.js: ok");
