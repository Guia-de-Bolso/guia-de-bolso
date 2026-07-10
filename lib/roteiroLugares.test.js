import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ROTEIRO_MIN_RELEVANCE_SCORE,
  compareLugaresForRoteiro,
  pontuarRelevanciaRoteiro,
  selecionarLugaresParaRoteiro,
} from "./roteiroLugares.js";

describe("roteiroLugares", () => {
  it("parceiro sem relevância não ganha por bônus fixo", () => {
    const relevancia = pontuarRelevanciaRoteiro(
      {
        categoria: "Serviços",
        subcategoria: "",
        nome: "Loja X",
        tags: [],
        descricao: "",
      },
      ["gastronomia"]
    );
    assert.equal(relevancia, 0);

    const parceiroIrrelevante = {
      relevanceScore: 0,
      ehParceiro: true,
      nome: "Parceiro",
    };
    const relevante = {
      relevanceScore: ROTEIRO_MIN_RELEVANCE_SCORE,
      ehParceiro: false,
      nome: "Restaurante",
    };
    assert.ok(compareLugaresForRoteiro(relevante, parceiroIrrelevante) < 0);
  });

  it("parceiro com mesma relevância vence só no desempate", () => {
    const a = {
      relevanceScore: 6,
      ehParceiro: false,
      nome: "B",
    };
    const b = {
      relevanceScore: 6,
      ehParceiro: true,
      nome: "A",
    };
    assert.ok(compareLugaresForRoteiro(b, a) < 0);
  });

  it("selecionarLugaresParaRoteiro exclui parceiro irrelevante do pool principal", () => {
    const lugares = [
      {
        id: "1",
        nome: "Praia",
        categoria: "Natureza",
        subcategoria: "Praias",
        descricao: "praia",
        lugares_tags: [],
        ehParceiro: false,
      },
      {
        id: "2",
        nome: "Parceiro Off",
        categoria: "Compras",
        subcategoria: "",
        descricao: "",
        lugares_tags: [],
        ehParceiro: true,
      },
    ];

    const selecionados = selecionarLugaresParaRoteiro(lugares, ["praias"], 24);
    const ids = selecionados.map((l) => l.id);
    assert.ok(ids.includes("1"));
    assert.ok(!ids.includes("2") || selecionados.length === 1);
  });

  it("prioriza restaurantes com tag de especialidade gastronômica", () => {
    const lugares = [
      {
        id: "1",
        nome: "Pizzaria do Centro",
        categoria: "Gastronomia",
        subcategoria: "Restaurantes",
        descricao: "pizza artesanal",
        lugares_tags: [{ tags: { nome: "Pizza" } }],
        ehParceiro: false,
      },
      {
        id: "2",
        nome: "Restaurante Geral",
        categoria: "Gastronomia",
        subcategoria: "Restaurantes",
        descricao: "comida variada",
        lugares_tags: [],
        ehParceiro: false,
      },
    ];

    const selecionados = selecionarLugaresParaRoteiro(
      lugares,
      ["Gastronomia"],
      24,
      ["Pizza"]
    );
    assert.equal(selecionados[0]?.id, "1");
  });
});
