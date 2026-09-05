import assert from "node:assert/strict";
import {
  buildAtrativoOfflineBundle,
  buildLugarOfflineBundle,
  groupByKey,
  indexById,
  normalizeTagsFromJoin,
  sortByOrdem,
} from "./favoritosOfflineBundles.js";

assert.deepEqual(normalizeTagsFromJoin([{ tags: { nome: "Surfe" } }, { nome: "Sol" }]), [
  { nome: "Surfe" },
  { nome: "Sol" },
]);

const grouped = groupByKey(
  [
    { lugar_id: 1, url: "a.jpg" },
    { lugar_id: "1", url: "b.jpg" },
    { lugar_id: 2, url: "c.jpg" },
  ],
  "lugar_id"
);
assert.equal(grouped.get("1").length, 2);
assert.equal(grouped.get("2").length, 1);

assert.equal(indexById([{ id: 10, nome: "A" }]).get("10").nome, "A");
assert.deepEqual(
  sortByOrdem([{ ordem: 2, texto: "b" }, { ordem: 1, texto: "a" }]).map((row) => row.texto),
  ["a", "b"]
);

const bundleJson = buildLugarOfflineBundle(
  { id: 1, fotos: ["https://a.test/capa.jpg"] },
  { latitude: -28 },
  [{ tags: { nome: "Praia" } }],
  [{ url: "https://a.test/legado.jpg" }]
);
assert.deepEqual(bundleJson.fotos, ["https://a.test/capa.jpg"]);
assert.equal(bundleJson.localizacao.latitude, -28);
assert.deepEqual(bundleJson.tags, [{ nome: "Praia" }]);

const bundleLegado = buildLugarOfflineBundle(
  { id: 2, imagem_url: "" },
  null,
  [],
  [{ imagem_url: "https://a.test/legado.jpg" }]
);
assert.deepEqual(bundleLegado.fotos, ["https://a.test/legado.jpg"]);
assert.equal(buildLugarOfflineBundle(null, null, [], []), null);

const atrativo = buildAtrativoOfflineBundle(
  { id: "r1", fotos: ["https://a.test/trilha.jpg"], rotas_tags: [{ tags: { nome: "Trilha" } }] },
  [{ ordem: 2, texto: "fim" }, { ordem: 1, texto: "inicio" }],
  [{ ordem: 1, texto: "leve agua" }],
  { cidade: "Imbituba" }
);
assert.equal(atrativo.pontos[0].texto, "inicio");
assert.equal(atrativo.localizacao.cidade, "Imbituba");
assert.ok(atrativo.fotos.includes("https://a.test/trilha.jpg"));

console.log("favoritosOfflineBundles.test.js: ok");
