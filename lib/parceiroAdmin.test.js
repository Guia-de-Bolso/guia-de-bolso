import assert from "node:assert/strict";
import {
  PARCEIRO_MODALIDADE,
  PARCEIRO_STATUS,
  buildCuradoriaAvaliacoesFeita,
  buildParceiroProgramaPayload,
  deveAlertarCuradoriaAtrasada,
  deveAlertarParceiroGratisVencido,
  deveAlertarParceiroVencendo30,
  deveAlertarParceiroVencendo7,
  getParceiroFimGratisISO,
} from "./parceiroAdmin.js";

const hoje = "2026-07-02";

assert.equal(getParceiroFimGratisISO("2026-07-02"), "2027-01-02");

const gratisPayload = buildParceiroProgramaPayload(
  {
    eh_parceiro: true,
    parceiro_modalidade: PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS,
    parceiro_inicio_em: "2026-07-02",
  },
  hoje
);
assert.equal(gratisPayload.parceiro_fim_em, "2027-01-02");
assert.equal(gratisPayload.parceiro_status, PARCEIRO_STATUS.ATIVO);
assert.equal(gratisPayload.proxima_curadoria_avaliacoes_em, "2026-09-30");

const pagoPayload = buildParceiroProgramaPayload(
  {
    eh_parceiro: true,
    parceiro_modalidade: PARCEIRO_MODALIDADE.PAGO,
    parceiro_inicio_em: "2026-01-01",
  },
  hoje
);
assert.equal(pagoPayload.parceiro_fim_em, null);
assert.equal(pagoPayload.parceiro_status, PARCEIRO_STATUS.CONVERTIDO_PAGO);

const encerradoPayload = buildParceiroProgramaPayload(
  {
    eh_parceiro: false,
    parceiro_status: PARCEIRO_STATUS.ATIVO,
  },
  hoje
);
assert.equal(encerradoPayload.parceiro_status, PARCEIRO_STATUS.ENCERRADO);

const curadoria = buildCuradoriaAvaliacoesFeita(hoje);
assert.equal(curadoria.ultima_curadoria_avaliacoes_em, hoje);
assert.equal(curadoria.proxima_curadoria_avaliacoes_em, "2026-09-30");

assert.equal(
  deveAlertarParceiroVencendo30("2026-07-20", PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS, hoje),
  true
);
assert.equal(
  deveAlertarParceiroVencendo7("2026-07-08", PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS, hoje),
  true
);
assert.equal(
  deveAlertarParceiroGratisVencido(
    "2026-06-01",
    PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS,
    true,
    hoje
  ),
  true
);
assert.equal(deveAlertarCuradoriaAtrasada("2026-06-01", true, hoje), true);

console.log("parceiroAdmin.test.js: ok");
