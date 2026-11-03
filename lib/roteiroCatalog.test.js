import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeRoteiroCatalogos, toRoteiroCatalogItem, trimFotosCapa } from "./roteiroCatalog.js";

describe("toRoteiroCatalogItem", () => {
  it("achata coordenadas e mantém só a capa quando pedido", () => {
    const item = toRoteiroCatalogItem(
      {
        id: "abc",
        nome: "Praia da Vila",
        slug: "praia-da-vila",
        eh_parceiro: true,
        imagem_url: "https://cdn.example/full.jpg",
        fotos: ["https://cdn.example/1.jpg", "https://cdn.example/2.jpg"],
        localizacoes: [{ latitude: "-28.24", longitude: "-48.67", endereco_completo: "Centro" }],
      },
      { apenasCapa: true }
    );

    assert.equal(item.slug, "praia-da-vila");
    assert.equal(item.ehParceiro, true);
    assert.equal(item.latitude, -28.24);
    assert.equal(item.endereco, "Centro");
    assert.deepEqual(item.fotos, ["https://cdn.example/1.jpg"]);
  });
});

describe("trimFotosCapa", () => {
  it("ignora lista vazia", () => {
    assert.equal(trimFotosCapa([]), null);
  });
});

describe("mergeRoteiroCatalogos", () => {
  it("preenche foto ausente no catálogo da geração", () => {
    const merged = mergeRoteiroCatalogos(
      [{ id: "1", nome: "Lagoa" }],
      [{ id: "1", nome: "Lagoa", imagem_url: "https://cdn.example/lagoa.jpg", ehParceiro: true }]
    );

    assert.equal(merged.length, 1);
    assert.equal(merged[0].imagem_url, "https://cdn.example/lagoa.jpg");
    assert.equal(merged[0].ehParceiro, true);
  });

  it("não apaga a foto do catálogo principal", () => {
    const merged = mergeRoteiroCatalogos(
      [{ id: "1", nome: "Lagoa", imagem_url: "https://cdn.example/a.jpg" }],
      [{ id: "1", nome: "Lagoa", imagem_url: "https://cdn.example/b.jpg" }]
    );

    assert.equal(merged[0].imagem_url, "https://cdn.example/a.jpg");
  });
});
