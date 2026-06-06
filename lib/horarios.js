const DIAS_ORDEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

const DIAS_LABEL = {
  dom: 'domingo',
  seg: 'segunda',
  ter: 'terça',
  qua: 'quarta',
  qui: 'quinta',
  sex: 'sexta',
  sab: 'sábado',
};

const MINUTOS_POR_DIA = 24 * 60;

/**
 * Converte Date para instante no fuso America/Sao_Paulo.
 * @param {Date} [date]
 * @returns {Date}
 */
function toSaoPauloDate(date = new Date()) {
  return new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

/**
 * Retorna a chave do dia da semana atual no fuso de São Paulo (`dom`–`sab`).
 * @param {Date} [referencia]
 * @returns {string}
 */
export function getDiaAtualKey(referencia) {
  const now = toSaoPauloDate(referencia);
  return DIAS_ORDEM[now.getDay()];
}

/**
 * @param {string} diaKey
 * @returns {string}
 */
function getDiaAnteriorKey(diaKey) {
  const idx = DIAS_ORDEM.indexOf(diaKey);
  if (idx < 0) return DIAS_ORDEM[0];
  return DIAS_ORDEM[(idx + 6) % 7];
}

/**
 * Minutos desde meia-noite no fuso de São Paulo.
 * @param {Date} [referencia]
 * @returns {number}
 */
export function getMinutosAtuais(referencia) {
  const now = toSaoPauloDate(referencia);
  return now.getHours() * 60 + now.getMinutes();
}

/**
 * Lista de dias da semana com chave e rótulo em português.
 * @returns {Array<{ key: string, label: string }>}
 */
export function getDiasHorario() {
  return [
    { key: 'dom', label: 'Domingo' },
    { key: 'seg', label: 'Segunda-Feira' },
    { key: 'ter', label: 'Terça-Feira' },
    { key: 'qua', label: 'Quarta-Feira' },
    { key: 'qui', label: 'Quinta-Feira' },
    { key: 'sex', label: 'Sexta-Feira' },
    { key: 'sab', label: 'Sábado' },
  ];
}

/**
 * Converte `HH:MM` em minutos desde meia-noite.
 * @param {string} time
 * @returns {number|null}
 */
export function timeToMinutes(time) {
  if (!time || typeof time !== 'string') return null;
  const [h, m] = time.trim().split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/**
 * Converte minutos desde meia-noite em `HH:MM`.
 * @param {number} minutes
 * @returns {string}
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * @typedef {{ inicio: string, fim: string }} IntervaloHorario
 * @typedef {{ fechado: boolean, vinteQuatroHoras: boolean, intervalos: IntervaloHorario[] }} HorarioDiaParsed
 * @typedef {{ start: number, endSameDay: number, endExtended: number, cruzaMeiaNoite: boolean }} IntervaloRange
 */

/**
 * Indica se o turno termina no dia seguinte (fechamento ≤ abertura).
 * @param {string} inicio
 * @param {string} fim
 * @returns {boolean}
 */
export function intervaloCruzaMeiaNoite(inicio, fim) {
  const start = timeToMinutes(inicio);
  const end = timeToMinutes(fim);
  if (start === null || end === null) return false;
  return end <= start;
}

/**
 * @param {string} inicio
 * @param {string} fim
 * @returns {IntervaloRange|null}
 */
export function getIntervaloRange(inicio, fim) {
  const start = timeToMinutes(inicio);
  const end = timeToMinutes(fim);
  if (start === null || end === null) return null;

  const cruzaMeiaNoite = end <= start;
  const endSameDay = end;
  const endExtended = cruzaMeiaNoite
    ? (end === 0 ? MINUTOS_POR_DIA : end + MINUTOS_POR_DIA)
    : end;

  return { start, endSameDay, endExtended, cruzaMeiaNoite };
}

/**
 * Verifica se o estabelecimento está aberto neste intervalo (mesmo dia civil).
 * @param {number} minutosAtuais
 * @param {string} inicio
 * @param {string} fim
 * @returns {boolean}
 */
export function estaAbertoNoIntervalo(minutosAtuais, inicio, fim) {
  const range = getIntervaloRange(inicio, fim);
  if (!range) return false;

  if (!range.cruzaMeiaNoite) {
    return minutosAtuais >= range.start && minutosAtuais < range.endSameDay;
  }

  if (range.endSameDay === 0) {
    return minutosAtuais >= range.start;
  }

  return minutosAtuais >= range.start || minutosAtuais < range.endSameDay;
}

/**
 * Verifica carry-over: turno do dia anterior que ainda está aberto na madrugada.
 * @param {string} inicio
 * @param {string} fim
 * @param {number} minutosAtuais
 * @returns {boolean}
 */
function estaAbertoNoCarryOver(minutosAtuais, inicio, fim) {
  if (!intervaloCruzaMeiaNoite(inicio, fim)) return false;

  const end = timeToMinutes(fim);
  if (end === null || end === 0) return false;

  return minutosAtuais < end;
}

/**
 * @param {string} fim
 * @returns {string}
 */
function formatDetailFechamento(fim) {
  const hora = fim.trim();
  if (hora === '00:00') return 'Fecha à meia-noite';
  return `Fecha às ${hora}`;
}

/**
 * @param {IntervaloHorario} intervalo
 * @returns {StatusFuncionamento}
 */
function buildStatusAberto(intervalo) {
  const detail = formatDetailFechamento(intervalo.fim);
  return {
    aberto: true,
    label: 'Aberto agora',
    detail,
    resumo: `Aberto · ${detail.toLowerCase()}`,
  };
}

/**
 * Parseia valor de um dia (`fechado`, `24h`, um ou vários intervalos).
 * @param {string} [value]
 * @returns {HorarioDiaParsed}
 */
export function parseHorarioDia(value) {
  const raw = (value || '').trim().toLowerCase();

  if (!raw || raw === 'fechado') {
    return { fechado: true, vinteQuatroHoras: false, intervalos: [] };
  }

  if (raw === '24h') {
    return { fechado: false, vinteQuatroHoras: true, intervalos: [] };
  }

  const partes = raw.split(',').map((part) => part.trim()).filter(Boolean);
  const intervalos = partes.map((part) => {
    const [inicio = '', fim = ''] = part.split('-').map((t) => t.trim());
    return { inicio, fim };
  });

  return { fechado: false, vinteQuatroHoras: false, intervalos };
}

/**
 * Valida intervalos de um dia (sem sobreposição; permite cruzar meia-noite).
 * @param {IntervaloHorario[]} intervalos
 * @returns {{ valid: boolean, error?: string }}
 */
export function validarIntervalos(intervalos) {
  if (!intervalos?.length) {
    return { valid: false, error: 'Informe abertura e fechamento.' };
  }

  const noturnos = intervalos.filter((item) =>
    intervaloCruzaMeiaNoite(item.inicio, item.fim)
  );

  if (noturnos.length > 1) {
    return {
      valid: false,
      error: 'Apenas um turno noturno (fecha após meia-noite) é permitido por dia.',
    };
  }

  const ranges = [];

  for (let i = 0; i < intervalos.length; i += 1) {
    const { inicio, fim } = intervalos[i];
    const range = getIntervaloRange(inicio, fim);

    if (!range) {
      return { valid: false, error: `Turno ${i + 1}: horário inválido.` };
    }

    if (range.start === range.endSameDay && range.cruzaMeiaNoite) {
      return { valid: false, error: `Turno ${i + 1}: abertura e fechamento não podem ser iguais.` };
    }

    ranges.push({ ...range, index: i + 1 });
  }

  if (noturnos.length === 1) {
    const noturnoRange = getIntervaloRange(noturnos[0].inicio, noturnos[0].fim);

    for (const item of intervalos) {
      if (intervaloCruzaMeiaNoite(item.inicio, item.fim)) continue;

      const diurnoRange = getIntervaloRange(item.inicio, item.fim);
      if (!diurnoRange || !noturnoRange) continue;

      if (diurnoRange.endExtended > noturnoRange.start) {
        return { valid: false, error: 'Os turnos não podem se sobrepor.' };
      }
    }
  }

  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  for (let i = 1; i < sorted.length; i += 1) {
    if (sorted[i - 1].cruzaMeiaNoite && !sorted[i].cruzaMeiaNoite) {
      return {
        valid: false,
        error: 'Turno noturno deve ser o último turno do dia (após os demais).',
      };
    }

    if (sorted[i].start < sorted[i - 1].endExtended) {
      return { valid: false, error: 'Os turnos não podem se sobrepor.' };
    }
  }

  return { valid: true };
}

/**
 * Serializa estado editável de um dia para string do banco.
 * @param {HorarioDiaParsed} parsed
 * @returns {string}
 */
export function serializeHorarioDia(parsed) {
  if (parsed.fechado) return 'fechado';
  if (parsed.vinteQuatroHoras) return '24h';

  const validos = (parsed.intervalos || []).filter(
    (item) => item.inicio && item.fim && timeToMinutes(item.inicio) !== null && timeToMinutes(item.fim) !== null
  );

  if (validos.length === 0) return 'fechado';

  return validos.map((item) => `${item.inicio}-${item.fim}`).join(',');
}

/**
 * Primeiro horário de abertura de um valor de dia.
 * @param {string} value
 * @returns {string|null}
 */
export function getPrimeiraAberturaDia(value) {
  const parsed = parseHorarioDia(value);
  if (parsed.fechado) return null;
  if (parsed.vinteQuatroHoras) return '00:00';
  return parsed.intervalos[0]?.inicio?.trim() || null;
}

/**
 * @param {string} inicio
 * @param {string} fim
 * @returns {string}
 */
function formatIntervaloDisplay(inicio, fim) {
  const abertura = inicio.trim();
  const fechamento = fim.trim();
  if (intervaloCruzaMeiaNoite(inicio, fim)) {
    if (fechamento === '00:00') return `${abertura} – 00:00 (dia seguinte)`;
    return `${abertura} – ${fechamento} (dia seguinte)`;
  }
  return `${abertura} – ${fechamento}`;
}

/**
 * Formata valor de horário do banco para exibição.
 * @param {string} [value]
 * @returns {string}
 */
export function formatHorario(value) {
  if (!value || value === 'fechado') return 'Fechado';
  if (value === '24h') return '24 horas';

  return value
    .split(',')
    .map((part) => {
      const [inicio = '', fim = ''] = part.trim().split('-').map((t) => t.trim());
      return formatIntervaloDisplay(inicio, fim);
    })
    .join(' · ');
}

/**
 * @typedef {Object} StatusFuncionamento
 * @property {boolean} aberto
 * @property {string} label
 * @property {string} detail
 * @property {string} [resumo]
 */

/**
 * Indica se há horário de funcionamento configurado (pelo menos um dia aberto ou 24h).
 * @param {Record<string, string>|null|undefined} horarios
 * @returns {boolean}
 */
export function horariosTemCadastro(horarios) {
  if (!horarios || typeof horarios !== 'object' || Array.isArray(horarios)) {
    return false;
  }

  return Object.keys(horarios).some((diaKey) => {
    const parsed = parseHorarioDia(horarios[diaKey]);
    return !parsed.fechado;
  });
}

/**
 * Intervalo ativo no momento (hoje ou carry-over do dia anterior).
 * @param {Record<string, string>} horarios
 * @param {string} diaKey
 * @param {number} minutosAtuais
 * @returns {{ intervalo: IntervaloHorario, origem: 'hoje'|'ontem' }|null}
 */
export function getIntervaloAtivoParaMomento(horarios, diaKey, minutosAtuais) {
  const diaAnterior = getDiaAnteriorKey(diaKey);
  const parsedOntem = parseHorarioDia(horarios[diaAnterior]);

  if (!parsedOntem.fechado && !parsedOntem.vinteQuatroHoras) {
    for (const intervalo of parsedOntem.intervalos) {
      if (estaAbertoNoCarryOver(minutosAtuais, intervalo.inicio, intervalo.fim)) {
        return { intervalo, origem: 'ontem' };
      }
    }
  }

  const parsedHoje = parseHorarioDia(horarios[diaKey]);
  if (parsedHoje.fechado || parsedHoje.vinteQuatroHoras) return null;

  for (const intervalo of parsedHoje.intervalos) {
    if (estaAbertoNoIntervalo(minutosAtuais, intervalo.inicio, intervalo.fim)) {
      return { intervalo, origem: 'hoje' };
    }
  }

  return null;
}

/**
 * Encontra a próxima abertura após o momento atual (hoje ou dias seguintes).
 * @param {Record<string, string>} horarios
 * @param {string} diaAtualKey
 * @param {number} minutosAtuais
 * @returns {{ label: string, hora: string }|null}
 */
export function getProximoDiaAberto(horarios, diaAtualKey, minutosAtuais) {
  const idxAtual = DIAS_ORDEM.indexOf(diaAtualKey);
  if (idxAtual < 0) return null;

  if (getIntervaloAtivoParaMomento(horarios, diaAtualKey, minutosAtuais)) {
    return null;
  }

  const valorHoje = (horarios[diaAtualKey] || 'fechado').trim();
  const parsedHoje = parseHorarioDia(valorHoje);

  if (!parsedHoje.fechado && !parsedHoje.vinteQuatroHoras) {
    for (const intervalo of parsedHoje.intervalos) {
      const inicio = timeToMinutes(intervalo.inicio);
      if (inicio !== null && minutosAtuais < inicio) {
        return { label: 'hoje', hora: intervalo.inicio.trim() };
      }
    }
  }

  for (let i = 1; i <= 6; i += 1) {
    const idx = (idxAtual + i) % 7;
    const key = DIAS_ORDEM[idx];
    const valor = (horarios[key] || 'fechado').trim();
    const parsed = parseHorarioDia(valor);

    if (parsed.fechado) continue;

    const hora = parsed.vinteQuatroHoras
      ? '00:00'
      : getPrimeiraAberturaDia(valor);

    if (hora) {
      return { label: DIAS_LABEL[key], hora };
    }
  }

  return null;
}

/**
 * @param {{ label: string, hora: string }|null} proximo
 * @returns {string|null}
 */
function formatProximaAbertura(proximo) {
  if (!proximo) return null;
  if (proximo.label === 'hoje') return `Abre às ${proximo.hora}`;
  return `Abre ${proximo.label} às ${proximo.hora}`;
}

/**
 * @param {HorarioDiaParsed} parsed
 * @param {number} minutosAtuais
 * @returns {StatusFuncionamento|null}
 */
function getStatusFechadoParaDia(parsed, minutosAtuais) {
  const primeiro = parsed.intervalos[0];
  const primeiroInicio = timeToMinutes(primeiro?.inicio);

  if (primeiroInicio !== null && minutosAtuais < primeiroInicio) {
    const hora = primeiro.inicio.trim();
    return {
      aberto: false,
      label: 'Fechado',
      detail: `Abre às ${hora}`,
      resumo: `Fechado · abre às ${hora}`,
    };
  }

  for (let i = 0; i < parsed.intervalos.length - 1; i += 1) {
    const intervaloAtual = parsed.intervalos[i];
    const intervaloProx = parsed.intervalos[i + 1];

    if (intervaloCruzaMeiaNoite(intervaloAtual.inicio, intervaloAtual.fim)) {
      continue;
    }

    const fimAtual = timeToMinutes(intervaloAtual.fim);
    const inicioProx = timeToMinutes(intervaloProx.inicio);
    if (fimAtual === null || inicioProx === null) continue;

    if (minutosAtuais >= fimAtual && minutosAtuais < inicioProx) {
      const hora = intervaloProx.inicio.trim();
      return {
        aberto: false,
        label: 'Fechado',
        detail: `Abre mais tarde às ${hora}`,
        resumo: `Abre mais tarde às ${hora}`,
      };
    }
  }

  const ultimo = parsed.intervalos[parsed.intervalos.length - 1];
  const ultimoRange = getIntervaloRange(ultimo?.inicio, ultimo?.fim);

  if (ultimoRange && !ultimoRange.cruzaMeiaNoite && minutosAtuais >= ultimoRange.endSameDay) {
    return {
      aberto: false,
      label: 'Fechado',
      detail: 'Fechado hoje',
      resumo: 'Fechado hoje',
    };
  }

  if (ultimoRange?.cruzaMeiaNoite && ultimoRange.endSameDay === 0 && minutosAtuais < ultimoRange.start) {
    const hora = ultimo.inicio.trim();
    return {
      aberto: false,
      label: 'Fechado',
      detail: `Abre às ${hora}`,
      resumo: `Fechado · abre às ${hora}`,
    };
  }

  return null;
}

/**
 * Calcula status de funcionamento do lugar para o momento atual (fuso São Paulo).
 * @param {Record<string, string>|null|undefined} horarios
 * @param {boolean} [mostrar_horarios]
 * @param {Date} [referencia]
 * @returns {StatusFuncionamento|null}
 */
export function getStatusFuncionamento(horarios, mostrar_horarios, referencia) {
  const badgeMode = typeof mostrar_horarios === 'boolean';
  if (badgeMode) {
    if (!mostrar_horarios || !horariosTemCadastro(horarios)) return null;
  } else if (!horariosTemCadastro(horarios)) {
    return null;
  }

  const diaKey = getDiaAtualKey(referencia);
  const minutosAtuais = getMinutosAtuais(referencia);
  const valorHoje = (horarios[diaKey] || 'fechado').trim();
  const parsed = parseHorarioDia(valorHoje);

  const ativo = getIntervaloAtivoParaMomento(horarios, diaKey, minutosAtuais);
  if (ativo) {
    return buildStatusAberto(ativo.intervalo);
  }

  if (parsed.vinteQuatroHoras) {
    return {
      aberto: true,
      label: 'Aberto agora',
      detail: 'Aberto 24 horas',
      resumo: 'Aberto 24 horas',
    };
  }

  if (parsed.fechado) {
    const proximo = getProximoDiaAberto(horarios, diaKey, minutosAtuais);
    const abertura = formatProximaAbertura(proximo);
    return {
      aberto: false,
      label: 'Fechado',
      detail: abertura ? `Fechado hoje · ${abertura}` : 'Fechado hoje',
      resumo: abertura ? `Fechado · ${abertura.toLowerCase()}` : 'Fechado hoje',
    };
  }

  const fechadoParcial = getStatusFechadoParaDia(parsed, minutosAtuais);
  if (fechadoParcial) return fechadoParcial;

  const ultimo = parsed.intervalos[parsed.intervalos.length - 1];
  if (ultimo && intervaloCruzaMeiaNoite(ultimo.inicio, ultimo.fim) && minutosAtuais >= timeToMinutes(ultimo.inicio)) {
    return {
      aberto: false,
      label: 'Fechado',
      detail: 'Fechado hoje',
      resumo: 'Fechado hoje',
    };
  }

  const proximo = getProximoDiaAberto(horarios, diaKey, minutosAtuais);
  const abertura = formatProximaAbertura(proximo);

  return {
    aberto: false,
    label: 'Fechado',
    detail: abertura || 'Fechado hoje',
    resumo: abertura ? `Fechado · ${abertura.toLowerCase()}` : 'Fechado hoje',
  };
}
