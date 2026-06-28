import assert from "node:assert/strict";
import {
  FILTRO_STATUS_BUSCA,
  buildLugarBuscaResumo,
  filtrarLugaresPorStatus,
  lugarEstaAberto,
  truncateBuscaDescricao,
  BUSCA_DESCRICAO_MAX_CHARS,
} from "./busca.js";

const trilhaPublica = {
  id: "t1",
  nome: "Trilha da Mata",
  categoria: "Natureza",
  subcategoria: "Trilhas",
  mostrar_horarios: false,
  horarios: null,
  descricao: "Trilha leve",
  lugares_tags: [],
};

const restauranteFechado = {
  id: "r1",
  nome: "Restaurante X",
  categoria: "Gastronomia",
  mostrar_horarios: true,
  horarios: {
    seg: "fechado",
    ter: "fechado",
    qua: "fechado",
    qui: "fechado",
    sex: "fechado",
    sab: "fechado",
    dom: "fechado",
  },
  descricao: "Comida local",
  lugares_tags: [],
};

assert.equal(lugarEstaAberto(trilhaPublica), true);
assert.equal(lugarEstaAberto(restauranteFechado), false);

const resumoTrilha = buildLugarBuscaResumo(trilhaPublica);
assert.equal(resumoTrilha.abertoAgora, true);
assert.equal(resumoTrilha.statusDetail, "Sem horário comercial");

const abertos = filtrarLugaresPorStatus([trilhaPublica, restauranteFechado], FILTRO_STATUS_BUSCA.ABERTOS);
assert.deepEqual(
  abertos.map((l) => l.id),
  ["t1"]
);

const longDesc = "x".repeat(BUSCA_DESCRICAO_MAX_CHARS + 20);
assert.equal(truncateBuscaDescricao(longDesc).length, BUSCA_DESCRICAO_MAX_CHARS + 1);
assert.ok(buildLugarBuscaResumo({ ...trilhaPublica, descricao: longDesc }).descricao.endsWith("…"));

console.log("busca.test.js OK");
