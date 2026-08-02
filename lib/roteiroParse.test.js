import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  countRoteiroParadas,
  parseRoteiroMarkdown,
} from "./roteiroParse.js";

const ROTEIRO_BASE = `# Dia 1 — Praias e gastronomia

## 🌅 Manhã
**Praia do Rosa**
→ Caminhada na areia e fotos
💡 Vá cedo para evitar vento
⏱️ ~2h

## ☀️ Tarde
**Mirante do Morro**
→ Vista panorâmica da costa
💡 Leve água e protetor
⏱️ ~3h

## 🌙 Noite
**Restaurante da Vila**
→ Jantar com frutos do mar
💡 Reserve mesa com vista
⏱️ ~2h
`;

describe("parseRoteiroMarkdown", () => {
  it("numera paradas em sequência no dia (1, 2, 3)", () => {
    const parsed = parseRoteiroMarkdown(ROTEIRO_BASE);
    assert.equal(parsed.dias.length, 1);

    const ordens = parsed.dias[0].periodos.flatMap((p) =>
      p.paradas.map((parada) => parada.ordem)
    );
    assert.deepEqual(ordens, [1, 2, 3]);
    assert.equal(countRoteiroParadas(parsed), 3);
  });

  it("ignora frase de fechamento após manhã/tarde/noite", () => {
    const parsed = parseRoteiroMarkdown(`${ROTEIRO_BASE}\nAproveite o dia em Imbituba!\n`);
    assert.equal(countRoteiroParadas(parsed), 3);

    const nomes = parsed.dias[0].periodos.flatMap((p) =>
      p.paradas.map((parada) => parada.nome)
    );
    assert.deepEqual(nomes, [
      "Praia do Rosa",
      "Mirante do Morro",
      "Restaurante da Vila",
    ]);

    const atividades = parsed.dias[0].periodos.flatMap((p) =>
      p.paradas.flatMap((parada) => parada.atividades)
    );
    assert.equal(
      atividades.some((a) => /explore o local/i.test(a)),
      false
    );
  });

  it("não inventa atividade genérica quando a parada já tem conteúdo", () => {
    const parsed = parseRoteiroMarkdown(ROTEIRO_BASE);
    for (const periodo of parsed.dias[0].periodos) {
      for (const parada of periodo.paradas) {
        assert.equal(
          parada.atividades.includes("Explore o local e aproveite o momento"),
          false
        );
        assert.ok(parada.atividades.length > 0);
      }
    }
  });

  it("separa paradas consecutivas no mesmo período", () => {
    const markdown = `# Dia 1 — Dois pontos

## 🌅 Manhã
**Praia do Rosa**
→ Caminhada
💡 Vá cedo
⏱️ ~1h
**Mirante do Morro**
→ Vista
💡 Leve água
⏱️ ~1h
`;
    const parsed = parseRoteiroMarkdown(markdown);
    const manha = parsed.dias[0].periodos.find((p) => p.id === "manha");
    assert.equal(manha?.paradas.length, 2);
    assert.deepEqual(
      manha.paradas.map((p) => [p.ordem, p.nome]),
      [
        [1, "Praia do Rosa"],
        [2, "Mirante do Morro"],
      ]
    );
  });

  it("mantém tip/duração após linha em branco na mesma parada", () => {
    const markdown = `# Dia 1

## 🌅 Manhã
**Praia do Rosa**
→ Caminhada

💡 Vá cedo
⏱️ ~2h
`;
    const parsed = parseRoteiroMarkdown(markdown);
    const parada = parsed.dias[0].periodos[0].paradas[0];
    assert.equal(parada.nome, "Praia do Rosa");
    assert.equal(parada.dica, "Vá cedo");
    assert.equal(parada.duracao, "~2h");
    assert.equal(parada.ordem, 1);
  });
});
