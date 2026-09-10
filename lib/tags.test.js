import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  deriveCategoriasFromSubcategorias,
  filterTagIdsBySubcategoria,
  filterTagsBySubcategoria,
  normalizeSelectedTagIds,
  normalizeSubcategoriasJson,
  tagMatchesCategoria,
  tagMatchesSubcategoria,
  toggleSelectedTagId,
} from "./tagSubcategorias.js";

describe("normalizeSubcategoriasJson", () => {
  it("remove duplicatas e entradas inválidas", () => {
    const result = normalizeSubcategoriasJson([
      { categoria: "Natureza", nome: "Praias" },
      { categoria: "Natureza", nome: "Praias" },
      { categoria: "", nome: "X" },
    ]);
    assert.equal(result.length, 1);
    assert.deepEqual(result[0], { categoria: "Natureza", nome: "Praias" });
  });
});

describe("tagMatchesSubcategoria", () => {
  it("corresponde quando subcategorias inclui o par", () => {
    const tag = {
      subcategorias: [{ categoria: "Natureza", nome: "Praias" }],
      categorias: ["Natureza"],
    };
    assert.equal(tagMatchesSubcategoria(tag, "Natureza", "Praias"), true);
    assert.equal(tagMatchesSubcategoria(tag, "Natureza", "Trilhas"), false);
  });

  it("usa fallback por categoria quando subcategorias vazio", () => {
    const tag = { categorias: ["Natureza"], subcategorias: [] };
    assert.equal(tagMatchesSubcategoria(tag, "Natureza", "Praias"), true);
    assert.equal(tagMatchesSubcategoria(tag, "Gastronomia", "Bares"), false);
  });

  it("retorna false sem subcategoria selecionada", () => {
    const tag = {
      subcategorias: [{ categoria: "Natureza", nome: "Praias" }],
    };
    assert.equal(tagMatchesSubcategoria(tag, "Natureza", ""), false);
  });
});

describe("filterTagsBySubcategoria", () => {
  it("filtra lista pelo par categoria + subcategoria", () => {
    const tags = [
      { id: 1, nome: "Surfe", subcategorias: [{ categoria: "Natureza", nome: "Praias" }] },
      { id: 2, nome: "Trilha curta", subcategorias: [{ categoria: "Natureza", nome: "Trilhas" }] },
    ];
    const result = filterTagsBySubcategoria(tags, "Natureza", "Praias");
    assert.equal(result.length, 1);
    assert.equal(result[0].nome, "Surfe");
  });
});

describe("filterTagIdsBySubcategoria", () => {
  it("remove ids incompatíveis", () => {
    const tags = [
      { id: 1, nome: "A", subcategorias: [{ categoria: "Natureza", nome: "Praias" }] },
      { id: 2, nome: "B", subcategorias: [{ categoria: "Natureza", nome: "Trilhas" }] },
    ];
    const ids = filterTagIdsBySubcategoria(["1", "2"], tags, "Natureza", "Praias");
    assert.deepEqual(ids, ["1"]);
  });
});

describe("normalizeSelectedTagIds", () => {
  it("deduplica e normaliza para string", () => {
    assert.deepEqual(normalizeSelectedTagIds([1, "1", 2, ""]), ["1", "2"]);
  });
});

describe("toggleSelectedTagId", () => {
  const tags = [
    { id: 1, nome: "A", subcategorias: [{ categoria: "Gastronomia", nome: "Restaurantes" }] },
    { id: 2, nome: "B", subcategorias: [{ categoria: "Gastronomia", nome: "Restaurantes" }] },
    { id: 3, nome: "C", subcategorias: [{ categoria: "Gastronomia", nome: "Restaurantes" }] },
    { id: 9, nome: "fantasma", subcategorias: [{ categoria: "Noite", nome: "Baladas" }] },
  ];

  it("não conta ids incompatíveis no limite", () => {
    const { next, limitReached } = toggleSelectedTagId(["9", "9", 1, 2], 3, {
      tags,
      categoria: "Gastronomia",
      subcategoria: "Restaurantes",
      max: 3,
    });
    assert.equal(limitReached, false);
    assert.deepEqual(next, ["9", "1", "2", "3"]);
  });

  it("bloqueia ao atingir o máximo de tags compatíveis", () => {
    const { next, limitReached } = toggleSelectedTagId(["1", "2", "3"], 4, {
      tags: [
        ...tags,
        {
          id: 4,
          nome: "D",
          subcategorias: [{ categoria: "Gastronomia", nome: "Restaurantes" }],
        },
      ],
      categoria: "Gastronomia",
      subcategoria: "Restaurantes",
      max: 3,
    });
    assert.equal(limitReached, true);
    assert.deepEqual(next, ["1", "2", "3"]);
  });

  it("remove tag já selecionada mesmo com tipo misto", () => {
    const { next, limitReached } = toggleSelectedTagId([1, "2"], "1", {
      tags,
      categoria: "Gastronomia",
      subcategoria: "Restaurantes",
      max: 5,
    });
    assert.equal(limitReached, false);
    assert.deepEqual(next, ["2"]);
  });
});

describe("deriveCategoriasFromSubcategorias", () => {
  it("extrai categorias únicas", () => {
    const cats = deriveCategoriasFromSubcategorias([
      { categoria: "Natureza", nome: "Praias" },
      { categoria: "Natureza", nome: "Trilhas" },
      { categoria: "Gastronomia", nome: "Bares" },
    ]);
    assert.deepEqual(cats.sort(), ["Gastronomia", "Natureza"]);
  });
});

describe("tagMatchesCategoria", () => {
  it("continua funcionando para compatibilidade", () => {
    assert.equal(tagMatchesCategoria({ categorias: ["Natureza"] }, "Natureza"), true);
  });
});
