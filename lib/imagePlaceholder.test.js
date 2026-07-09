import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_BLUR_DATA_URL,
  getBlurDataUrlForCategory,
  getCategoryPlaceholderHex,
  resolvePhotoBlurDataUrl,
} from "./imagePlaceholder.js";

describe("imagePlaceholder", () => {
  it("retorna blur padrão da marca", () => {
    assert.ok(DEFAULT_BLUR_DATA_URL.startsWith("data:image/jpeg;base64,"));
    assert.equal(getBlurDataUrlForCategory(), DEFAULT_BLUR_DATA_URL);
  });

  it("mapeia categorias conhecidas", () => {
    const natureza = getBlurDataUrlForCategory("Natureza");
    const gastronomia = getBlurDataUrlForCategory("Gastronomia");
    assert.notEqual(natureza, gastronomia);
    assert.ok(natureza.startsWith("data:image/jpeg;base64,"));
  });

  it("expõe cor hex por categoria", () => {
    assert.equal(getCategoryPlaceholderHex("Natureza"), "#7ec8b8");
    assert.equal(getCategoryPlaceholderHex(), "#d8e8e2");
  });

  it("resolve blur explícito com prioridade", () => {
    const custom = "data:image/jpeg;base64,custom";
    assert.equal(
      resolvePhotoBlurDataUrl({ blurDataURL: custom, categoria: "Natureza" }),
      custom
    );
  });
});
