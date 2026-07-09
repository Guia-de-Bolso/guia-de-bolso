import assert from "node:assert/strict";
import {
  getCapaFromLugar,
  getCapaThumbFromLugar,
  getCapaBlurFromLugar,
  getFotosFromLugar,
  getPhotoEntryUrl,
  normalizePhotoEntry,
  parsePhotoEntries,
  serializePhotoEntry,
} from "./fotos.js";

assert.deepEqual(normalizePhotoEntry("https://a.test/1.jpg"), {
  url: "https://a.test/1.jpg",
  thumb: "https://a.test/1.jpg",
});

assert.deepEqual(
  normalizePhotoEntry({
    url: "https://a.test/full.webp",
    thumb: "https://a.test/full-thumb.webp",
  }),
  {
    url: "https://a.test/full.webp",
    thumb: "https://a.test/full-thumb.webp",
  }
);

assert.deepEqual(parsePhotoEntries(["https://a.test/1.jpg"]), [
  { url: "https://a.test/1.jpg", thumb: "https://a.test/1.jpg" },
]);

assert.deepEqual(
  serializePhotoEntry({
    url: "https://a.test/full.webp",
    thumb: "https://a.test/full-thumb.webp",
    blur: "data:image/jpeg;base64,abc",
  }),
  {
    url: "https://a.test/full.webp",
    thumb: "https://a.test/full-thumb.webp",
    blur: "data:image/jpeg;base64,abc",
  }
);

const lugarComBlur = {
  fotos: [
    {
      url: "https://a.test/full.webp",
      thumb: "https://a.test/thumb.webp",
      blur: "data:image/jpeg;base64,xyz",
    },
  ],
};

assert.equal(getCapaBlurFromLugar(lugarComBlur), "data:image/jpeg;base64,xyz");

assert.equal(serializePhotoEntry("https://a.test/1.jpg"), "https://a.test/1.jpg");

const lugarComThumb = {
  fotos: [{ url: "https://a.test/full.webp", thumb: "https://a.test/thumb.webp" }],
};

assert.equal(getCapaFromLugar(lugarComThumb), "https://a.test/full.webp");
assert.equal(getCapaThumbFromLugar(lugarComThumb), "https://a.test/thumb.webp");
assert.deepEqual(getFotosFromLugar(lugarComThumb), ["https://a.test/full.webp"]);
assert.equal(getPhotoEntryUrl(lugarComThumb.fotos[0]), "https://a.test/full.webp");

const lugarLegado = { imagem_url: "https://a.test/legado.jpg" };
assert.equal(getCapaThumbFromLugar(lugarLegado), "https://a.test/legado.jpg");

console.log("fotos.test.js: ok");
