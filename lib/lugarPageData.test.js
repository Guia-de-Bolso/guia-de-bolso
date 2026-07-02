import assert from "node:assert/strict";
import {
  normalizeFotosLegado,
  normalizeLugarForClient,
  normalizeTagsFromJoin,
  resolveLugarFotosIniciais,
} from "./lugarPageDataNormalize.js";

assert.deepEqual(
  normalizeLugarForClient({
    id: "1",
    nome: "Praia",
    localizacoes: [{ lat: -28 }],
  }),
  { id: "1", nome: "Praia" }
);

assert.deepEqual(
  normalizeTagsFromJoin([{ tags: { id: "t1", nome: "Surf" } }, { tags: null }]),
  [{ id: "t1", nome: "Surf" }]
);

assert.deepEqual(
  normalizeFotosLegado([{ url: "https://a.jpg" }, { imagem_url: "https://b.jpg" }]),
  ["https://a.jpg", "https://b.jpg"]
);

assert.deepEqual(
  resolveLugarFotosIniciais({ fotos: ["https://json.jpg"] }, ["https://legado.jpg"]),
  ["https://json.jpg"]
);

assert.deepEqual(
  resolveLugarFotosIniciais({ imagem_url: "https://capa.jpg" }, ["https://legado.jpg"]),
  ["https://capa.jpg"]
);

assert.deepEqual(
  resolveLugarFotosIniciais({ nome: "Sem fotos" }, ["https://legado.jpg"]),
  ["https://legado.jpg"]
);

console.log("lugarPageData.test.js: ok");
