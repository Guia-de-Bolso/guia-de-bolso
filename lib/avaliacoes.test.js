import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getFotoAutorAvaliacao,
  getNomeAutorAvaliacao,
  getNotaEmoji,
  getSentimentoEmoji,
} from "./avaliacoes.js";

describe("getNotaEmoji", () => {
  it("maps 1–5 stars to progressively happier faces", () => {
    assert.equal(getNotaEmoji(1), "😞");
    assert.equal(getNotaEmoji(2), "😕");
    assert.equal(getNotaEmoji(3), "😐");
    assert.equal(getNotaEmoji(4), "😊");
    assert.equal(getNotaEmoji(5), "🤩");
  });

  it("rounds fractional notes", () => {
    assert.equal(getNotaEmoji(4.6), "🤩");
    assert.equal(getNotaEmoji(2.4), "😕");
  });

  it("falls back to neutral for invalid notes", () => {
    assert.equal(getNotaEmoji(0), "😐");
    assert.equal(getNotaEmoji(null), "😐");
  });
});

describe("getSentimentoEmoji", () => {
  it("still maps IA sentiment labels for admin", () => {
    assert.equal(getSentimentoEmoji("positivo"), "😊");
    assert.equal(getSentimentoEmoji("negativo"), "😞");
    assert.equal(getSentimentoEmoji(""), "😐");
  });
});

describe("getNomeAutorAvaliacao", () => {
  it("prefers autor_nome snapshot over perfis join", () => {
    assert.equal(
      getNomeAutorAvaliacao({
        autor_nome: "Maria Silva",
        perfis: { nome: "Outro" },
      }),
      "Maria Silva"
    );
  });

  it("falls back to perfis then Visitante", () => {
    assert.equal(
      getNomeAutorAvaliacao({ perfis: { nome: "João" } }),
      "João"
    );
    assert.equal(getNomeAutorAvaliacao({}), "Visitante");
    assert.equal(getNomeAutorAvaliacao({ autor_nome: "  " }), "Visitante");
    assert.equal(getNomeAutorAvaliacao({ autor_nome: "Usuário" }), "Visitante");
  });
});

describe("getFotoAutorAvaliacao", () => {
  it("prefers snapshot URL", () => {
    assert.equal(
      getFotoAutorAvaliacao({
        autor_foto_url: "https://cdn/a.jpg",
        perfis: { foto_url: "https://cdn/b.jpg" },
      }),
      "https://cdn/a.jpg"
    );
  });

  it("falls back to perfis or null", () => {
    assert.equal(
      getFotoAutorAvaliacao({ perfis: { foto_url: "https://cdn/b.jpg" } }),
      "https://cdn/b.jpg"
    );
    assert.equal(getFotoAutorAvaliacao({}), null);
  });
});
