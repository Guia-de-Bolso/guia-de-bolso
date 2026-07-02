import assert from "node:assert/strict";
import {
  CONTRATO_STATUS,
  CONTRATO_TIPO,
  CONTRATO_DOC_TIPO,
  buildContratoPayload,
  buildLugarParceiroPatchFromContrato,
  calcularResumoContratos,
  contratoMatchesFiltro,
  contratoTemDocumentoAssinado,
  deveAlertarContratoSemDocumentoAssinado,
  deveAlertarParceiroSemContratoAtivo,
  formatContratoValorMensal,
  getContratoStatusLabel,
  getContratoTipoLabel,
  isAllowedContratoDocMime,
  buildContratoStoragePath,
} from "./contratoAdmin.js";
import { canAccessContratosAdmin } from "./adminRoles.js";

assert.equal(getContratoTipoLabel(CONTRATO_TIPO.LANCAMENTO_6_MESES), "Lançamento — 6 meses grátis");
assert.equal(getContratoStatusLabel(CONTRATO_STATUS.ATIVO), "Ativo");
assert.equal(formatContratoValorMensal(299), "R$ 299,00");
assert.equal(formatContratoValorMensal(null), "Grátis");

const payload = buildContratoPayload({
  lugar_id: "uuid-1",
  tipo: CONTRATO_TIPO.PARCEIRO_PAGO,
  status: CONTRATO_STATUS.RASCUNHO,
  data_inicio: "2026-07-01",
  valor_mensal: 299,
});
assert.equal(payload.tipo, CONTRATO_TIPO.PARCEIRO_PAGO);
assert.equal(payload.valor_mensal, 299);

const gratisPayload = buildContratoPayload({
  lugar_id: "uuid-2",
  tipo: CONTRATO_TIPO.LANCAMENTO_6_MESES,
  data_inicio: "2026-07-01",
});
assert.equal(gratisPayload.data_fim, "2027-01-01");

const patch = buildLugarParceiroPatchFromContrato({
  tipo: CONTRATO_TIPO.PARCEIRO_PAGO,
  data_inicio: "2026-07-01",
  data_fim: null,
  numero_proposta: "003/2026",
});
assert.equal(patch.parceiro_modalidade, "pago");

const contratoAtivo = {
  id: "c1",
  ativo: true,
  tipo: CONTRATO_TIPO.LANCAMENTO_6_MESES,
  status: CONTRATO_STATUS.ATIVO,
  data_fim: "2026-07-20",
};
const docsSemAssinado = [{ tipo: CONTRATO_DOC_TIPO.PROPOSTA }];
const docsComAssinado = [{ tipo: CONTRATO_DOC_TIPO.CONTRATO_ASSINADO }];

assert.equal(contratoTemDocumentoAssinado(contratoAtivo, docsSemAssinado), false);
assert.equal(contratoTemDocumentoAssinado(contratoAtivo, docsComAssinado), true);
assert.equal(
  deveAlertarContratoSemDocumentoAssinado(contratoAtivo, docsSemAssinado, "2026-07-01"),
  true
);
assert.equal(
  deveAlertarContratoSemDocumentoAssinado(contratoAtivo, docsComAssinado, "2026-07-01"),
  false
);

assert.equal(
  contratoMatchesFiltro(contratoAtivo, "vencendo", docsSemAssinado, "2026-06-25"),
  true
);
assert.equal(contratoMatchesFiltro(contratoAtivo, "sem_doc", docsSemAssinado, "2026-07-01"), true);

const resumo = calcularResumoContratos(
  [contratoAtivo],
  { c1: docsSemAssinado },
  "2026-07-01"
);
assert.equal(resumo.ativos, 1);
assert.equal(resumo.semDoc, 1);

assert.equal(isAllowedContratoDocMime("application/pdf"), true);
assert.equal(isAllowedContratoDocMime("text/plain"), false);
assert.match(buildContratoStoragePath("abc", "Contrato.pdf"), /^abc\/\d+-Contrato.pdf$/);

assert.equal(canAccessContratosAdmin("dev"), true);
assert.equal(canAccessContratosAdmin("admin"), false);

assert.equal(
  deveAlertarParceiroSemContratoAtivo({ id: "l1", eh_parceiro: true }, {}),
  true
);
assert.equal(
  deveAlertarParceiroSemContratoAtivo(
    { id: "l1", eh_parceiro: true },
    { l1: { id: "c1" } }
  ),
  false
);
assert.equal(deveAlertarParceiroSemContratoAtivo({ id: "l1", eh_parceiro: false }, {}), false);

console.log("contratoAdmin tests OK");
