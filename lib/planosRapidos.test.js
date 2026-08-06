import assert from "node:assert/strict";
import test from "node:test";
import { FILTRO_STATUS_BUSCA } from "./busca.js";
import {
  filterLugaresForPlano,
  getPlanoRapidoById,
  lugarMatchesPlanoCriterios,
  normalizarPlanoTexto,
  PLANOS_RAPIDOS,
  scoreLugarForPlano,
} from "./planosRapidos.js";

const lugaresFixture = [
  {
    id: "cafe",
    nome: "Café da Praia",
    categoria: "Gastronomia",
    subcategoria: "Cafés",
    horarios: { seg: "08:00-18:00" },
    descricao: "Café da manhã com vista",
    tags: ["Comida local"],
  },
  {
    id: "praia",
    nome: "Praia da Vila",
    categoria: "Natureza",
    subcategoria: "Praias",
    horarios: { seg: "00:00-23:59" },
    descricao: "Praia paradisíaca no centro",
    tags: ["Praia paradisíaca"],
  },
  {
    id: "rest",
    nome: "Restaurante Romântico",
    categoria: "Gastronomia",
    subcategoria: "Restaurantes",
    horarios: { seg: "12:00-23:00" },
    descricao: "Jantar romântico com frutos do mar",
    tags: ["Frutos do mar", "Ambiente intimista"],
  },
  {
    id: "mirante",
    nome: "Mirante do Pôr do Sol",
    categoria: "Natureza",
    subcategoria: "Mirantes",
    horarios: { seg: "06:00-20:00" },
    descricao: "Vista incrível do pôr do sol",
    tags: [],
  },
  {
    id: "museu",
    nome: "Museu Local",
    categoria: "Cultura",
    subcategoria: "Museus",
    horarios: { seg: "10:00-17:00" },
    descricao: "Arte local e patrimônio",
    tags: ["Arte local", "Patrimônio histórico"],
  },
  {
    id: "trilha",
    nome: "Trilha da Mata",
    categoria: "Natureza",
    subcategoria: "Trilhas",
    horarios: { seg: "06:00-18:00" },
    descricao: "Trilha leve",
    tags: ["Trilha leve"],
  },
  {
    id: "pub",
    nome: "Pub da Orla",
    categoria: "Noite",
    subcategoria: "Pubs",
    horarios: { seg: "18:00-02:00" },
    descricao: "Drinks autorais e música",
    tags: ["Drinks autorais", "Happy hour"],
  },
  {
    id: "sorveteria",
    nome: "Sorveteria Central",
    categoria: "Gastronomia",
    subcategoria: "Sorveterias",
    horarios: { seg: "10:00-22:00" },
    localizacoes: { latitude: -28.24, longitude: -48.67 },
  },
  {
    id: "mercado",
    nome: "Mercado do Centro",
    categoria: "Serviços",
    subcategoria: "Mercados",
    horarios: { seg: "09:00-18:00" },
    localizacoes: { latitude: -28.25, longitude: -48.68 },
  },
];

test("PLANOS_RAPIDOS tem 5 itens com ids únicos", () => {
  assert.equal(PLANOS_RAPIDOS.length, 5);
  assert.equal(new Set(PLANOS_RAPIDOS.map((p) => p.id)).size, 5);
});

test("normalizarPlanoTexto remove acentos", () => {
  assert.equal(normalizarPlanoTexto("Pôr do sol"), "por do sol");
});

test("manhã perfeita inclui café e praia, não trilha", () => {
  const plano = getPlanoRapidoById("manha");
  assert.ok(plano);
  assert.ok(lugarMatchesPlanoCriterios(lugaresFixture[0], plano.criterios));
  assert.ok(lugarMatchesPlanoCriterios(lugaresFixture[1], plano.criterios));
  assert.equal(lugarMatchesPlanoCriterios(lugaresFixture[5], plano.criterios), false);

  const { lugares } = filterLugaresForPlano(lugaresFixture, "manha", {
    filtroStatus: FILTRO_STATUS_BUSCA.TODOS,
  });
  const ids = lugares.map((l) => l.id);
  assert.ok(ids.includes("cafe"));
  assert.ok(ids.includes("praia"));
  assert.equal(ids.includes("trilha"), false);
});

test("tarde romântica prioriza restaurante e mirante com boost", () => {
  const restScore = scoreLugarForPlano(
    lugaresFixture[2],
    getPlanoRapidoById("tarde-romantica").criterios
  );
  const museuScore = scoreLugarForPlano(
    lugaresFixture[4],
    getPlanoRapidoById("tarde-romantica").criterios
  );
  assert.ok(restScore > museuScore);

  const { lugares } = filterLugaresForPlano(lugaresFixture, "tarde-romantica");
  const ids = lugares.map((l) => l.id);
  assert.ok(ids.includes("rest"));
  assert.ok(ids.includes("mirante"));
});

test("dia chuvoso exclui trilhas e inclui museu", () => {
  const { lugares } = filterLugaresForPlano(lugaresFixture, "dia-chuvoso");
  const ids = lugares.map((l) => l.id);
  assert.ok(ids.includes("museu"));
  assert.equal(ids.includes("trilha"), false);
  assert.equal(ids.includes("praia"), false);
});

test("noite animada inclui pub de Noite", () => {
  const { lugares } = filterLugaresForPlano(lugaresFixture, "noite", {
    filtroStatus: FILTRO_STATUS_BUSCA.TODOS,
  });
  assert.ok(lugares.some((l) => l.id === "pub"));
});

test("bate-volta ordena por distância", () => {
  const userPosition = { latitude: -28.24, longitude: -48.67 };
  const { lugares } = filterLugaresForPlano(lugaresFixture, "bate-volta", {
    filtroStatus: FILTRO_STATUS_BUSCA.TODOS,
    userPosition,
  });
  assert.ok(lugares.length >= 2);
  assert.equal(lugares[0].id, "sorveteria");
});
