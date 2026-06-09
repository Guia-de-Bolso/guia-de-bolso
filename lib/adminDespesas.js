import { USAGE_TIMEZONE } from "./premium.js";

/** @typedef {import("@supabase/supabase-js").SupabaseClient} SupabaseClient */

export const USD_BRL_DEFAULT = 5.9;

export const PERIODICIDADE_OPTIONS = [
  { id: "mensal", label: "Mensal", meses: 1 },
  { id: "trimestral", label: "Trimestral", meses: 3 },
  { id: "semestral", label: "Semestral", meses: 6 },
  { id: "anual", label: "Anual", meses: 12 },
  { id: "unico", label: "Único", meses: null },
];

export const CATEGORIA_OPTIONS = [
  { id: "infra", label: "Infraestrutura" },
  { id: "ia", label: "IA" },
  { id: "auth", label: "Autenticação" },
  { id: "maps", label: "Mapas" },
  { id: "lojas", label: "Lojas (App)" },
  { id: "ferramentas", label: "Ferramentas" },
  { id: "dominio", label: "Domínio" },
  { id: "marketing", label: "Marketing" },
  { id: "outros", label: "Outros" },
];

export const MOEDA_OPTIONS = [
  { id: "BRL", label: "BRL (R$)" },
  { id: "USD", label: "USD ($)" },
];

export const DESPESA_PERIODOS = [
  { id: "mes", label: "Este mês" },
  { id: "trimestre", label: "Trimestre" },
  { id: "semestre", label: "Semestre" },
  { id: "ano", label: "Ano" },
  { id: "custom", label: "Personalizado" },
];

export const CATEGORIA_CHIP_STYLES = {
  infra: "bg-blue-100 text-blue-700",
  ia: "bg-purple-100 text-purple-700",
  auth: "bg-amber-100 text-amber-700",
  maps: "bg-cyan-100 text-cyan-700",
  lojas: "bg-orange-100 text-orange-700",
  ferramentas: "bg-indigo-100 text-indigo-700",
  dominio: "bg-gray-100 text-gray-700",
  marketing: "bg-pink-100 text-pink-700",
  outros: "bg-slate-100 text-slate-700",
};

/** @type {Record<string, number|null>} */
export const PERIODICIDADE_MESES = Object.fromEntries(
  PERIODICIDADE_OPTIONS.map((o) => [o.id, o.meses])
);

/** Sugestões baseadas em docs/CUSTOS.md §5. */
export const DESPESAS_SEED_SUGESTOES = [
  { nome_plataforma: "Cursor Pro", categoria: "ferramentas", periodicidade: "mensal", valor: 20, moeda: "USD" },
  { nome_plataforma: "Domínio .com.br", categoria: "dominio", periodicidade: "anual", valor: 40, moeda: "BRL" },
  { nome_plataforma: "Vercel Pro", categoria: "infra", periodicidade: "mensal", valor: 20, moeda: "USD" },
  { nome_plataforma: "Supabase Pro", categoria: "infra", periodicidade: "mensal", valor: 25, moeda: "USD" },
  { nome_plataforma: "Google Maps", categoria: "maps", periodicidade: "mensal", valor: 50, moeda: "BRL" },
  { nome_plataforma: "Twilio WhatsApp", categoria: "auth", periodicidade: "mensal", valor: 15, moeda: "BRL" },
  { nome_plataforma: "Apple Developer", categoria: "lojas", periodicidade: "anual", valor: 99, moeda: "USD" },
  { nome_plataforma: "Google Play", categoria: "lojas", periodicidade: "unico", valor: 25, moeda: "USD" },
];

/**
 * @param {string} [categoriaId]
 * @returns {string}
 */
export function getCategoriaLabel(categoriaId) {
  return CATEGORIA_OPTIONS.find((c) => c.id === categoriaId)?.label || categoriaId || "—";
}

/**
 * @param {string} [periodicidadeId]
 * @returns {string}
 */
export function getPeriodicidadeLabel(periodicidadeId) {
  return PERIODICIDADE_OPTIONS.find((p) => p.id === periodicidadeId)?.label || periodicidadeId || "—";
}

/**
 * @param {number|string} valor
 * @param {string} periodicidade
 * @returns {number}
 */
export function normalizeValorMensal(valor, periodicidade) {
  const amount = Number(valor || 0);
  if (!amount || periodicidade === "unico") return 0;

  const meses = PERIODICIDADE_MESES[periodicidade];
  if (!meses) return 0;
  return amount / meses;
}

/**
 * @param {number|string} valor
 * @param {string} moeda
 * @param {number} [taxaCambio]
 * @param {number|string|null} [taxaItem]
 * @returns {number}
 */
export function toBrl(valor, moeda, taxaCambio = USD_BRL_DEFAULT, taxaItem = null) {
  const amount = Number(valor || 0);
  if (moeda === "BRL") return amount;
  const taxa = Number(taxaItem || taxaCambio || USD_BRL_DEFAULT);
  return amount * taxa;
}

/**
 * @param {number|string} valorBrl
 * @param {number} [taxaCambio]
 * @returns {number}
 */
export function toUsd(valorBrl, taxaCambio = USD_BRL_DEFAULT) {
  const taxa = Number(taxaCambio || USD_BRL_DEFAULT);
  if (!taxa) return 0;
  return Number(valorBrl || 0) / taxa;
}

/**
 * @param {string} dateKey - YYYY-MM-DD
 * @returns {{ year: number, month: number, day: number }}
 */
function parseDateKey(dateKey) {
  const [year, month, day] = String(dateKey).split("-").map(Number);
  return { year, month, day };
}

/**
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {string}
 */
function toDateKey(year, month) {
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/**
 * @param {Date} [refDate]
 * @returns {string}
 */
export function getTodayDateKey(refDate = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: USAGE_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(refDate);

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;
  return `${year}-${month}-${day}`;
}

/**
 * @param {string} dateKey
 * @returns {number}
 */
function monthIndex(dateKey) {
  const { year, month } = parseDateKey(dateKey);
  return year * 12 + (month - 1);
}

/**
 * @param {number} index
 * @returns {string}
 */
function monthKeyFromIndex(index) {
  const year = Math.floor(index / 12);
  const month = (index % 12) + 1;
  return toDateKey(year, month);
}

/**
 * @param {string} inicioKey
 * @param {string} fimKey
 * @returns {number}
 */
export function countMonthsInRange(inicioKey, fimKey) {
  const start = monthIndex(inicioKey.slice(0, 7) + "-01");
  const end = monthIndex(fimKey.slice(0, 7) + "-01");
  return Math.max(0, end - start + 1);
}

/**
 * @param {object} despesa
 * @param {string} [refDateKey]
 * @returns {boolean}
 */
export function isDespesaAtiva(despesa, refDateKey = getTodayDateKey()) {
  if (!despesa?.ativo) return false;
  const inicio = despesa.data_inicio || refDateKey;
  if (inicio > refDateKey) return false;
  if (despesa.data_fim && despesa.data_fim < refDateKey) return false;
  return true;
}

/**
 * @param {string} periodoId
 * @param {number} [ano]
 * @param {string} [customInicio]
 * @param {string} [customFim]
 * @param {Date} [refDate]
 * @returns {{ inicio: string, fim: string, meses: number, label: string }}
 */
export function resolveDespesaPeriodo(periodoId, ano, customInicio, customFim, refDate = new Date()) {
  const todayKey = getTodayDateKey(refDate);
  const { year: currentYear, month: currentMonth } = parseDateKey(todayKey);
  const selectedYear = Number(ano || currentYear);

  if (periodoId === "custom") {
    const inicio = customInicio || todayKey;
    const fim = customFim || todayKey;
    return {
      inicio,
      fim: fim >= inicio ? fim : inicio,
      meses: countMonthsInRange(inicio, fim),
      label: "Personalizado",
    };
  }

  if (periodoId === "mes") {
    const inicio = toDateKey(selectedYear, currentMonth);
    const lastDay = new Date(selectedYear, currentMonth, 0).getDate();
    const fim = `${selectedYear}-${String(currentMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { inicio, fim, meses: 1, label: "Este mês" };
  }

  if (periodoId === "trimestre") {
    const quarter = Math.floor((currentMonth - 1) / 3);
    const startMonth = quarter * 3 + 1;
    const endMonth = startMonth + 2;
    const inicio = toDateKey(selectedYear, startMonth);
    const lastDay = new Date(selectedYear, endMonth, 0).getDate();
    const fim = `${selectedYear}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { inicio, fim, meses: 3, label: "Trimestre" };
  }

  if (periodoId === "semestre") {
    const startMonth = currentMonth <= 6 ? 1 : 7;
    const endMonth = currentMonth <= 6 ? 6 : 12;
    const inicio = toDateKey(selectedYear, startMonth);
    const lastDay = new Date(selectedYear, endMonth, 0).getDate();
    const fim = `${selectedYear}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { inicio, fim, meses: 6, label: "Semestre" };
  }

  const inicio = `${selectedYear}-01-01`;
  const fim = `${selectedYear}-12-31`;
  return { inicio, fim, meses: 12, label: "Ano" };
}

/**
 * @param {string} periodoId
 * @param {{ inicio: string, fim: string, meses: number }} periodo
 * @param {number} [ano]
 * @param {Date} [refDate]
 * @returns {{ inicio: string, fim: string, meses: number }}
 */
export function getPeriodoAnterior(periodoId, periodo, ano, refDate = new Date()) {
  const todayKey = getTodayDateKey(refDate);
  const { year: currentYear, month: currentMonth } = parseDateKey(todayKey);
  const selectedYear = Number(ano || currentYear);

  if (periodoId === "custom") {
    const days = Math.max(
      1,
      Math.round(
        (new Date(periodo.fim).getTime() - new Date(periodo.inicio).getTime()) / (1000 * 60 * 60 * 24)
      ) + 1
    );
    const prevFim = new Date(periodo.inicio);
    prevFim.setDate(prevFim.getDate() - 1);
    const prevInicio = new Date(prevFim);
    prevInicio.setDate(prevInicio.getDate() - (days - 1));
    const inicio = getTodayDateKey(prevInicio);
    const fim = getTodayDateKey(prevFim);
    return { inicio, fim, meses: countMonthsInRange(inicio, fim) };
  }

  if (periodoId === "mes") {
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? selectedYear - 1 : selectedYear;
    const inicio = toDateKey(prevYear, prevMonth);
    const lastDay = new Date(prevYear, prevMonth, 0).getDate();
    const fim = `${prevYear}-${String(prevMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { inicio, fim, meses: 1 };
  }

  if (periodoId === "trimestre") {
    const quarter = Math.floor((currentMonth - 1) / 3);
    const prevQuarter = quarter === 0 ? 3 : quarter - 1;
    const prevYear = quarter === 0 ? selectedYear - 1 : selectedYear;
    const startMonth = prevQuarter * 3 + 1;
    const endMonth = startMonth + 2;
    const inicio = toDateKey(prevYear, startMonth);
    const lastDay = new Date(prevYear, endMonth, 0).getDate();
    const fim = `${prevYear}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { inicio, fim, meses: 3 };
  }

  if (periodoId === "semestre") {
    if (currentMonth <= 6) {
      return { inicio: `${selectedYear - 1}-07-01`, fim: `${selectedYear - 1}-12-31`, meses: 6 };
    }
    return { inicio: `${selectedYear}-01-01`, fim: `${selectedYear}-06-30`, meses: 6 };
  }

  return { inicio: `${selectedYear - 1}-01-01`, fim: `${selectedYear - 1}-12-31`, meses: 12 };
}

/**
 * Meses em que a despesa está ativa dentro do período.
 * @param {object} despesa
 * @param {string} inicio
 * @param {string} fim
 * @returns {number}
 */
export function countMesesAtivosNoPeriodo(despesa, inicio, fim) {
  const despesaInicio = despesa.data_inicio || inicio;
  const despesaFim = despesa.data_fim || fim;
  const overlapInicio = despesaInicio > inicio ? despesaInicio : inicio;
  const overlapFim = despesaFim < fim ? despesaFim : fim;
  if (overlapInicio > overlapFim) return 0;
  return countMonthsInRange(overlapInicio, overlapFim);
}

/**
 * @param {object} despesa
 * @param {string} inicio
 * @param {string} fim
 * @param {number} taxaCambio
 * @returns {number}
 */
export function calcularCustoProjetadoDespesa(despesa, inicio, fim, taxaCambio = USD_BRL_DEFAULT) {
  if (!despesa?.ativo) return 0;

  const mesesAtivos = countMesesAtivosNoPeriodo(despesa, inicio, fim);
  if (mesesAtivos <= 0) return 0;

  const valorBrl = toBrl(despesa.valor, despesa.moeda, taxaCambio, despesa.taxa_cambio);

  if (despesa.periodicidade === "unico") {
    const dataInicio = despesa.data_inicio;
    return dataInicio >= inicio && dataInicio <= fim ? valorBrl : 0;
  }

  const mesesPorCobranca = PERIODICIDADE_MESES[despesa.periodicidade] || 1;
  const ciclos = mesesAtivos / mesesPorCobranca;
  return valorBrl * ciclos;
}

/**
 * @param {object} lancamento
 * @param {number} taxaCambio
 * @returns {number}
 */
export function calcularValorLancamentoBrl(lancamento, taxaCambio = USD_BRL_DEFAULT) {
  return toBrl(lancamento.valor, lancamento.moeda, taxaCambio);
}

/**
 * @param {object[]} despesas
 * @param {object[]} lancamentos
 * @param {string} inicio
 * @param {string} fim
 * @param {number} taxaCambio
 * @param {"projetado"|"realizado"} modo
 * @returns {number}
 */
export function calcularTotalPeriodo(despesas, lancamentos, inicio, fim, taxaCambio, modo = "projetado") {
  if (modo === "realizado") {
    const lancamentosNoPeriodo = lancamentos.filter(
      (l) => l.data_pagamento >= inicio && l.data_pagamento <= fim
    );

    if (lancamentosNoPeriodo.length > 0) {
      return lancamentosNoPeriodo.reduce(
        (acc, l) => acc + calcularValorLancamentoBrl(l, taxaCambio),
        0
      );
    }
  }

  return despesas.reduce(
    (acc, despesa) => acc + calcularCustoProjetadoDespesa(despesa, inicio, fim, taxaCambio),
    0
  );
}

/**
 * @param {number} atual
 * @param {number} anterior
 * @returns {number}
 */
export function calcVariationPercent(atual, anterior) {
  const a = Number(atual || 0);
  const b = Number(anterior || 0);
  if (b === 0) return a === 0 ? 0 : 100;
  return ((a - b) / b) * 100;
}

/**
 * @param {object[]} despesas
 * @param {object[]} lancamentos
 * @param {{ inicio: string, fim: string, meses: number }} periodo
 * @param {number} taxaCambio
 * @param {"projetado"|"realizado"} modo
 * @returns {object}
 */
export function calcularResumo(despesas, lancamentos, periodo, taxaCambio = USD_BRL_DEFAULT, modo = "projetado") {
  const totalBrl = calcularTotalPeriodo(
    despesas,
    lancamentos,
    periodo.inicio,
    periodo.fim,
    taxaCambio,
    modo
  );

  const totalUsd = toUsd(totalBrl, taxaCambio);
  const meses = Math.max(periodo.meses, 1);
  const mensalEquivalente = totalBrl / meses;
  const anualProjetado = mensalEquivalente * 12;

  const ativas = despesas.filter((d) => isDespesaAtiva(d, periodo.fim));

  const porCategoriaMap = {};
  despesas.forEach((despesa) => {
    const valor = calcularCustoProjetadoDespesa(despesa, periodo.inicio, periodo.fim, taxaCambio);
    if (valor <= 0) return;
    porCategoriaMap[despesa.categoria] = (porCategoriaMap[despesa.categoria] || 0) + valor;
  });

  const porCategoria = Object.entries(porCategoriaMap)
    .map(([categoria, totalCategoriaBrl]) => ({
      categoria,
      label: getCategoriaLabel(categoria),
      totalBrl: totalCategoriaBrl,
      percentual: totalBrl > 0 ? (totalCategoriaBrl / totalBrl) * 100 : 0,
    }))
    .sort((a, b) => b.totalBrl - a.totalBrl);

  const porPlataforma = despesas
    .map((despesa) => ({
      id: despesa.id,
      nome: despesa.nome_plataforma,
      periodicidade: despesa.periodicidade,
      totalBrl: calcularCustoProjetadoDespesa(despesa, periodo.inicio, periodo.fim, taxaCambio),
      mensalBrl: toBrl(
        normalizeValorMensal(despesa.valor, despesa.periodicidade),
        despesa.moeda,
        taxaCambio,
        despesa.taxa_cambio
      ),
      ativo: despesa.ativo,
    }))
    .filter((item) => item.totalBrl > 0 || item.mensalBrl > 0)
    .sort((a, b) => b.totalBrl - a.totalBrl);

  const lancamentosNoPeriodo = lancamentos.filter(
    (l) => l.data_pagamento >= periodo.inicio && l.data_pagamento <= periodo.fim
  );

  return {
    totalBrl,
    totalUsd,
    mensalEquivalente,
    anualProjetado,
    porCategoria,
    porPlataforma,
    itensAtivos: ativas.length,
    itensLancados: lancamentosNoPeriodo.length,
    itensProjetados: porPlataforma.length,
  };
}

/**
 * @param {object} payload
 * @returns {{ ok: boolean, error?: string, data?: object }}
 */
export function validateDespesaPayload(payload) {
  const nome = String(payload?.nome_plataforma || "").trim();
  if (!nome) return { ok: false, error: "Informe o nome da plataforma." };

  const valor = Number(payload?.valor);
  if (!Number.isFinite(valor) || valor <= 0) return { ok: false, error: "Valor deve ser maior que zero." };

  if (!MOEDA_OPTIONS.some((m) => m.id === payload?.moeda)) {
    return { ok: false, error: "Moeda inválida." };
  }

  if (!PERIODICIDADE_OPTIONS.some((p) => p.id === payload?.periodicidade)) {
    return { ok: false, error: "Periodicidade inválida." };
  }

  if (!CATEGORIA_OPTIONS.some((c) => c.id === payload?.categoria)) {
    return { ok: false, error: "Categoria inválida." };
  }

  if (payload?.data_fim && payload?.data_inicio && payload.data_fim < payload.data_inicio) {
    return { ok: false, error: "Data fim não pode ser anterior à data início." };
  }

  return {
    ok: true,
    data: {
      nome_plataforma: nome,
      categoria: payload.categoria,
      periodicidade: payload.periodicidade,
      valor,
      moeda: payload.moeda,
      ativo: Boolean(payload.ativo ?? true),
      data_inicio: payload.data_inicio || getTodayDateKey(),
      data_fim: payload.data_fim || null,
      dia_vencimento: payload.dia_vencimento ? Number(payload.dia_vencimento) : null,
      notas: payload.notas?.trim() || null,
      url_referencia: payload.url_referencia?.trim() || null,
      taxa_cambio: payload.taxa_cambio ? Number(payload.taxa_cambio) : null,
    },
  };
}

/**
 * @param {SupabaseClient} supabase
 * @returns {Promise<number>}
 */
export async function fetchTaxaCambio(supabase) {
  const { data, error } = await supabase
    .from("despesas_config")
    .select("taxa_cambio_usd_brl")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("[fetchTaxaCambio]", error.message);
    return USD_BRL_DEFAULT;
  }

  return Number(data?.taxa_cambio_usd_brl || USD_BRL_DEFAULT);
}

/**
 * @param {SupabaseClient} supabase
 * @param {number} taxa
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function updateTaxaCambio(supabase, taxa) {
  const value = Number(taxa);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, error: "Taxa de câmbio inválida." };
  }

  const { error } = await supabase
    .from("despesas_config")
    .upsert({ id: 1, taxa_cambio_usd_brl: value });

  if (error) {
    console.error("[updateTaxaCambio]", error.message);
    return { ok: false, error: "Não foi possível salvar a taxa de câmbio." };
  }

  return { ok: true };
}

/**
 * @param {SupabaseClient} supabase
 * @returns {Promise<object[]>}
 */
export async function fetchDespesasAdmin(supabase) {
  const { data, error } = await supabase
    .from("despesas_operacionais")
    .select("*")
    .order("nome_plataforma");

  if (error) {
    console.error("[fetchDespesasAdmin]", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * @param {SupabaseClient} supabase
 * @returns {Promise<object[]>}
 */
export async function fetchLancamentosAdmin(supabase) {
  const { data, error } = await supabase
    .from("despesas_lancamentos")
    .select("*")
    .order("data_pagamento", { ascending: false });

  if (error) {
    console.error("[fetchLancamentosAdmin]", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} despesaId
 * @returns {Promise<object[]>}
 */
export async function fetchLancamentosByDespesa(supabase, despesaId) {
  const { data, error } = await supabase
    .from("despesas_lancamentos")
    .select("*")
    .eq("despesa_id", despesaId)
    .order("data_pagamento", { ascending: false });

  if (error) {
    console.error("[fetchLancamentosByDespesa]", error.message);
    return [];
  }

  return data ?? [];
}

/**
 * @param {SupabaseClient} supabase
 * @param {object} payload
 * @returns {Promise<{ ok: boolean, error?: string, data?: object }>}
 */
export async function createDespesaAdmin(supabase, payload) {
  const validation = validateDespesaPayload(payload);
  if (!validation.ok) return validation;

  const { data, error } = await supabase
    .from("despesas_operacionais")
    .insert(validation.data)
    .select()
    .single();

  if (error) {
    console.error("[createDespesaAdmin]", error.message);
    return { ok: false, error: "Não foi possível criar a despesa." };
  }

  return { ok: true, data };
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} id
 * @param {object} payload
 * @returns {Promise<{ ok: boolean, error?: string, data?: object }>}
 */
export async function updateDespesaAdmin(supabase, id, payload) {
  const validation = validateDespesaPayload(payload);
  if (!validation.ok) return validation;

  const { data, error } = await supabase
    .from("despesas_operacionais")
    .update(validation.data)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[updateDespesaAdmin]", error.message);
    return { ok: false, error: "Não foi possível atualizar a despesa." };
  }

  return { ok: true, data };
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} id
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function deleteDespesaAdmin(supabase, id) {
  const { error } = await supabase.from("despesas_operacionais").delete().eq("id", id);

  if (error) {
    console.error("[deleteDespesaAdmin]", error.message);
    return { ok: false, error: "Não foi possível excluir a despesa." };
  }

  return { ok: true };
}

/**
 * @param {SupabaseClient} supabase
 * @param {object} payload
 * @returns {Promise<{ ok: boolean, error?: string, data?: object }>}
 */
export async function createLancamentoAdmin(supabase, payload) {
  const valor = Number(payload?.valor);
  if (!payload?.despesa_id) return { ok: false, error: "Despesa inválida." };
  if (!Number.isFinite(valor) || valor <= 0) return { ok: false, error: "Valor inválido." };
  if (!MOEDA_OPTIONS.some((m) => m.id === payload?.moeda)) {
    return { ok: false, error: "Moeda inválida." };
  }
  if (!payload?.data_pagamento) return { ok: false, error: "Informe a data de pagamento." };

  const row = {
    despesa_id: payload.despesa_id,
    valor,
    moeda: payload.moeda,
    data_pagamento: payload.data_pagamento,
    competencia: payload.competencia?.trim() || null,
    notas: payload.notas?.trim() || null,
  };

  const { data, error } = await supabase
    .from("despesas_lancamentos")
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error("[createLancamentoAdmin]", error.message);
    return { ok: false, error: "Não foi possível registrar o pagamento." };
  }

  return { ok: true, data };
}

/**
 * @param {SupabaseClient} supabase
 * @param {string} id
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function deleteLancamentoAdmin(supabase, id) {
  const { error } = await supabase.from("despesas_lancamentos").delete().eq("id", id);

  if (error) {
    console.error("[deleteLancamentoAdmin]", error.message);
    return { ok: false, error: "Não foi possível excluir o lançamento." };
  }

  return { ok: true };
}

/**
 * @param {SupabaseClient} supabase
 * @returns {Promise<{ inseridos: number, ignorados: number }>}
 */
export async function seedDespesasSugestoes(supabase) {
  const existentes = await fetchDespesasAdmin(supabase);
  const nomes = new Set(existentes.map((d) => d.nome_plataforma.toLowerCase()));

  let inseridos = 0;
  let ignorados = 0;

  for (const item of DESPESAS_SEED_SUGESTOES) {
    if (nomes.has(item.nome_plataforma.toLowerCase())) {
      ignorados += 1;
      continue;
    }

    const result = await createDespesaAdmin(supabase, {
      ...item,
      ativo: true,
      data_inicio: getTodayDateKey(),
      notas: "Sugestão importada de docs/CUSTOS.md",
    });

    if (result.ok) inseridos += 1;
  }

  return { inseridos, ignorados };
}

/**
 * @param {number} value
 * @param {"BRL"|"USD"} [currency]
 * @returns {string}
 */
export function formatDespesaCurrency(value, currency = "BRL") {
  if (currency === "USD") {
    return `$${Number(value || 0).toFixed(2)}`;
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    Number(value || 0)
  );
}
