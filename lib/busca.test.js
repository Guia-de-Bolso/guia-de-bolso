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

const restaurante24h = {
  id: "r2",
  nome: "Lanchonete 24h",
  categoria: "Gastronomia",
  mostrar_horarios: true,
  horarios: {
    seg: "24h",
    ter: "24h",
    qua: "24h",
    qui: "24h",
    sex: "24h",
    sab: "24h",
    dom: "24h",
  },
  descricao: "Sempre aberto",
  lugares_tags: [],
};

assert.equal(lugarEstaAberto(trilhaPublica), false);
assert.equal(lugarEstaAberto(restauranteFechado), false);
assert.equal(lugarEstaAberto(restaurante24h), true);

const resumoTrilha = buildLugarBuscaResumo(trilhaPublica);
assert.equal(resumoTrilha.abertoAgora, false);
assert.equal(resumoTrilha.statusDetail, "Sem horário comercial");

const abertos = filtrarLugaresPorStatus(
  [trilhaPublica, restauranteFechado, restaurante24h],
  FILTRO_STATUS_BUSCA.ABERTOS
);
assert.deepEqual(abertos.map((l) => l.id), ["r2"]);

const todos = filtrarLugaresPorStatus(
  [trilhaPublica, restauranteFechado, restaurante24h],
  FILTRO_STATUS_BUSCA.TODOS
);
assert.equal(todos.length, 3);

const longDesc = "x".repeat(BUSCA_DESCRICAO_MAX_CHARS + 20);
assert.equal(truncateBuscaDescricao(longDesc).length, BUSCA_DESCRICAO_MAX_CHARS + 1);
assert.ok(buildLugarBuscaResumo({ ...trilhaPublica, descricao: longDesc }).descricao.endsWith("…"));

console.log("busca.test.js OK");
