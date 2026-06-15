import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeFixadaAteInclusive,
  findAtrativoDoDiaFixado,
  isFixacaoVigente,
  pickAtrativoDoDiaRotativo,
  resolveAtrativoDoDia,
} from "./atrativoDoDia.js";

describe("atrativoDoDia", () => {
  const rotas = [
    { id: "a", nome: "A", ativa: true },
    { id: "b", nome: "B", ativa: true },
    { id: "c", nome: "C", ativa: true },
  ];

  it("isFixacaoVigente compara datas ISO", () => {
    assert.equal(isFixacaoVigente("2026-05-28", "2026-05-26"), true);
    assert.equal(isFixacaoVigente("2026-05-25", "2026-05-26"), false);
  });

  it("pickAtrativoDoDiaRotativo faz round-robin determinístico", () => {
    const epoch = "2026-01-01";
    const ids = [];
    for (let i = 0; i < 3; i += 1) {
      const d = new Date(`${epoch}T12:00:00`);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      ids.push(pickAtrativoDoDiaRotativo(rotas, iso, epoch)?.id);
    }
    assert.deepEqual(ids, ["a", "b", "c"]);
  });

  it("findAtrativoDoDiaFixado prioriza fixação vigente", () => {
    const comFix = [
      ...rotas,
      {
        id: "fix",
        nome: "Fix",
        ativa: true,
        rota_do_dia_fixada_ate: "2026-05-30",
      },
    ];
    const found = findAtrativoDoDiaFixado(comFix, "2026-05-26");
    assert.equal(found?.id, "fix");
  });

  it("resolveAtrativoDoDia usa fixação sobre rotação", () => {
    const comFix = [
      { id: "x", ativa: true, rota_do_dia_fixada_ate: "2026-05-28" },
      { id: "y", ativa: true },
    ];
    const { rota, modo } = resolveAtrativoDoDia(comFix, { dayKey: "2026-05-26" });
    assert.equal(rota?.id, "x");
    assert.equal(modo, "fixada");
  });

  it("computeFixadaAteInclusive conta dias inclusivos", () => {
    assert.equal(computeFixadaAteInclusive(1, "2026-05-26"), "2026-05-26");
    assert.equal(computeFixadaAteInclusive(7, "2026-05-26"), "2026-06-01");
  });
});
