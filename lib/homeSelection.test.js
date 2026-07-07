import assert from "node:assert/strict";
import {
  PARCEIROS_CARROSSEL_LIMIT,
  pickNewestParceiro,
  pickParceirosCarrossel,
} from "./homeSelection.js";

const parceiros = [
  {
    id: "a",
    nome: "Antigo",
    eh_parceiro: true,
    imagem_url: "https://a.test/1.jpg",
    parceiro_inicio_em: "2026-01-01",
  },
  {
    id: "b",
    nome: "Novo",
    eh_parceiro: true,
    imagem_url: "https://a.test/2.jpg",
    parceiro_inicio_em: "2026-07-06",
  },
  {
    id: "c",
    nome: "Meio",
    eh_parceiro: true,
    imagem_url: "https://a.test/3.jpg",
    parceiro_inicio_em: "2026-03-01",
  },
];

assert.equal(pickNewestParceiro(parceiros)?.id, "b");

const carrossel = pickParceirosCarrossel(parceiros, "2026-07-06");
assert.equal(carrossel[0]?.id, "b");
assert.equal(carrossel.length, 3);

const many = Array.from({ length: 12 }, (_, index) => ({
  id: `p${index}`,
  nome: `Parceiro ${index}`,
  eh_parceiro: true,
  imagem_url: `https://a.test/${index}.jpg`,
  parceiro_inicio_em: `2026-01-${String(index + 1).padStart(2, "0")}`,
}));

const limited = pickParceirosCarrossel(many, "2026-07-06");
assert.equal(limited.length, PARCEIROS_CARROSSEL_LIMIT);
assert.equal(limited[0]?.id, "p11");

const sameDay = pickParceirosCarrossel(
  [
    {
      id: "x",
      nome: "X",
      eh_parceiro: true,
      imagem_url: "https://a.test/x.jpg",
      parceiro_inicio_em: "2026-07-06",
    },
    {
      id: "y",
      nome: "Y",
      eh_parceiro: true,
      imagem_url: "https://a.test/y.jpg",
      parceiro_inicio_em: "2026-07-06",
    },
  ],
  "2026-07-06"
);

assert.equal(sameDay[0]?.id, "y");

console.log("homeSelection.test.js: ok");
