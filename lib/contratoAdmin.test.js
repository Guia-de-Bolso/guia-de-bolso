import assert from "node:assert/strict";
import {
  CONTRATO_STATUS,
  CONTRATO_TIPO,
  CONTRATO_DOC_TIPO,
  CONTRATO_TIPO_OPTIONS_CRIACAO,
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
  isLugarElegivelParaContratoDropdown,
} from "./contratoAdmin.js";
import { canAccessContratosAdmin } from "./adminRoles.js";
import { PARCEIRO_MODALIDADE } from "./parceiroAdmin.js";

assert.equal(
  getContratoTipoLabel(CONTRATO_TIPO.LANCAMENTO_6_MESES),
  "Lançamento — 6 meses grátis (legado)"
);
assert.equal(getContratoStatusLabel(CONTRATO_STATUS.ATIVO), "Ativo");
assert.equal(formatContratoValorMensal(299), "R$ 299,00");
assert.equal(formatContratoValorMensal(null), "Grátis");

assert.ok(
  CONTRATO_TIPO_OPTIONS_CRIACAO.every((item) => item.id !== CONTRATO_TIPO.LANCAMENTO_6_MESES)
);

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
  isLugarElegivelParaContratoDropdown({
    eh_parceiro: true,
    status: "ativo",
    parceiro_modalidade: PARCEIRO_MODALIDADE.PAGO,
  }),
  true
);
assert.equal(
  isLugarElegivelParaContratoDropdown({
    eh_parceiro: true,
    status: "ativo",
    parceiro_modalidade: PARCEIRO_MODALIDADE.LANCAMENTO_GRATIS,
  }),
  false
);
assert.equal(
  isLugarElegivelParaContratoDropdown({ eh_parceiro: false, status: "ativo" }),
  false
);
assert.equal(
  isLugarElegivelParaContratoDropdown({
    eh_parceiro: true,
    status: "em_analise",
    parceiro_modalidade: PARCEIRO_MODALIDADE.PAGO,
  }),
  false
);

// Política: sem alerta de parceiro sem contrato (só plano pago tem contrato)
assert.equal(
  deveAlertarParceiroSemContratoAtivo({ id: "l1", eh_parceiro: true }, {}),
  false
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
