import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ROTEIRO_PERFIL_MAX,
  buildTituloRoteiro,
  sanitizePerfilRoteiro,
} from "./roteiroPerfil.js";

describe("sanitizePerfilRoteiro", () => {
  it("remove quebras de linha e limita o tamanho", () => {
    const entrada = `lua\nde\tmel ${"a".repeat(200)}`;
    const saida = sanitizePerfilRoteiro(entrada);
    assert.equal(saida.includes("\n"), false);
    assert.equal(saida.startsWith("lua de mel "), true);
    assert.equal(saida.length, ROTEIRO_PERFIL_MAX);
  });

  it("retorna vazio para entrada em branco", () => {
    assert.equal(sanitizePerfilRoteiro("   "), "");
    assert.equal(sanitizePerfilRoteiro(null), "");
  });
});

describe("buildTituloRoteiro", () => {
  it("inclui perfil curto no título", () => {
    assert.equal(buildTituloRoteiro("3 dias", "Casal"), "Roteiro 3 dias - Casal");
  });

  it("omite perfil longo do título", () => {
    const perfil = "Viagem de aniversário com a família e o cachorro";
    assert.equal(buildTituloRoteiro("5 dias", perfil), "Roteiro 5 dias");
  });
});
