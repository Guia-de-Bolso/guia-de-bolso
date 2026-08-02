/**
 * @typedef {'manha'|'tarde'|'noite'} PeriodoId
 */

/**
 * @typedef {Object} RoteiroParada
 * @property {number} ordem
 * @property {string} nome
 * @property {string[]} atividades
 * @property {string} [dica]
 * @property {string} [duracao]
 * @property {string|null} [lugarId]
 */

/**
 * @typedef {Object} RoteiroPeriodo
 * @property {PeriodoId|null} id
 * @property {string} label
 * @property {string} emoji
 * @property {RoteiroParada[]} paradas
 */

/**
 * @typedef {Object} RoteiroDia
 * @property {string} titulo
 * @property {number} numero
 * @property {RoteiroPeriodo[]} periodos
 * @property {RoteiroParada[]} paradasSemPeriodo
 */

/**
 * @typedef {Object} RoteiroParsed
 * @property {string[]} intro
 * @property {RoteiroDia[]} dias
 * @property {boolean} fallbackTexto
 */

const PERIODO_META = {
  manha: { label: "Manhã", emoji: "🌅" },
  tarde: { label: "Tarde", emoji: "☀️" },
  noite: { label: "Noite", emoji: "🌙" },
};

/**
 * @param {string} line
 * @returns {PeriodoId|null}
 */
export function detectPeriodoId(line) {
  const lower = line.toLowerCase();
  if (/manh[ãa]/.test(lower)) return "manha";
  if (/tarde/.test(lower)) return "tarde";
  if (/noite/.test(lower)) return "noite";
  return null;
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isDiaHeading(line) {
  const trimmed = line.trim();
  return /^#{1}\s/.test(trimmed) || /^dia\s+\d/i.test(trimmed);
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isPeriodoHeading(line) {
  const trimmed = line.trim();
  if (/^##\s/.test(trimmed) && detectPeriodoId(trimmed)) return true;
  return Boolean(detectPeriodoId(trimmed) && /[🌅☀️🌙]/.test(trimmed));
}

/**
 * @param {string} line
 * @returns {boolean}
 */
function isPlaceLine(line) {
  const trimmed = line.trim();
  return (
    /^📍/.test(trimmed) ||
    /^\*\*[^*]+\*\*$/.test(trimmed) ||
    (/^[A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9]/.test(trimmed) &&
      trimmed.length < 90 &&
      !trimmed.startsWith("→") &&
      !trimmed.startsWith("->") &&
      !trimmed.startsWith("-") &&
      !trimmed.startsWith("•") &&
      !trimmed.startsWith("💡") &&
      !/^⏱/.test(trimmed) &&
      !/^~/.test(trimmed) &&
      !/^dica:/i.test(trimmed))
  );
}

/**
 * @param {string} line
 * @returns {string}
 */
function cleanPlaceName(line) {
  return line
    .replace(/^#{1,3}\s*/, "")
    .replace(/^📍\s*/, "")
    .replace(/^\*\*|\*\*$/g, "")
    .replace(/^[🌅☀️🌙]\s*/, "")
    .trim();
}

/**
 * @param {string[]} lines
 * @returns {Omit<RoteiroParada, 'ordem'|'lugarId'>|null}
 */
function linesToParada(lines) {
  let nome = "";
  const atividades = [];
  let dica = "";
  let duracao = "";

  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;

    if (isPlaceLine(trimmed) && !nome) {
      nome = cleanPlaceName(trimmed);
      continue;
    }

    if (/^⏱|^~/.test(trimmed) || /^(tempo|duração|duracao)\b/i.test(trimmed)) {
      duracao = trimmed.replace(/^⏱️?\s*/, "").trim();
      continue;
    }

    if (/^💡/.test(trimmed) || /^dica:/i.test(trimmed)) {
      dica = trimmed.replace(/^💡\s*/, "").replace(/^dica:\s*/i, "").trim();
      continue;
    }

    if (
      trimmed.startsWith("→") ||
      trimmed.startsWith("->") ||
      trimmed.startsWith("-") ||
      trimmed.startsWith("•")
    ) {
      const text = trimmed.replace(/^[→>-•]\s*/, "").trim();
      if (text) atividades.push(text);
      continue;
    }

    if (!nome && trimmed.length < 90 && !/^##/.test(trimmed)) {
      nome = cleanPlaceName(trimmed);
    } else if (trimmed.length > 0) {
      atividades.push(trimmed.replace(/^\*\*|\*\*$/g, "").trim());
    }
  }

  const nomeFinal = nome.trim();
  const atividadesFiltradas = atividades.map((a) => a.trim()).filter(Boolean);

  if (!nomeFinal && atividadesFiltradas.length === 0) {
    return null;
  }

  return {
    nome: nomeFinal || atividadesFiltradas[0] || "Parada",
    atividades:
      nomeFinal && atividadesFiltradas.length > 0
        ? atividadesFiltradas
        : nomeFinal
          ? atividadesFiltradas
          : atividadesFiltradas.slice(1),
    dica: dica || undefined,
    duracao: duracao || undefined,
  };
}

/**
 * Parada precisa de nome + evidência de conteúdo (evita frases de fechamento da IA).
 * @param {Omit<RoteiroParada, 'ordem'>} parada
 * @returns {boolean}
 */
function paradaValida(parada) {
  const nome = parada.nome?.trim();
  if (!nome) return false;

  const temAtividade = (parada.atividades?.length ?? 0) > 0;
  const temDica = Boolean(parada.dica?.trim());
  const temDuracao = Boolean(parada.duracao?.trim());
  const temLugar = Boolean(parada.lugarId);

  return temAtividade || temDica || temDuracao || temLugar;
}

/**
 * Normaliza nome para comparação.
 * @param {string} value
 * @returns {string}
 */
function normalizeNome(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Associa parada a lugar do catálogo por nome aproximado.
 * @param {string} nomeParada
 * @param {Array<{ id: string, nome: string }>} [lugares]
 * @returns {string|null}
 */
export function matchLugarId(nomeParada, lugares = []) {
  const alvo = normalizeNome(nomeParada);
  if (!alvo || !lugares.length) return null;

  let best = null;
  let bestScore = 0;

  for (const lugar of lugares) {
    const candidato = normalizeNome(lugar.nome);
    if (!candidato) continue;

    if (candidato === alvo) return String(lugar.id);

    if (candidato.includes(alvo) || alvo.includes(candidato)) {
      const score = Math.min(alvo.length, candidato.length);
      if (score > bestScore) {
        bestScore = score;
        best = String(lugar.id);
      }
    }
  }

  return best;
}

/**
 * Associa lugares e descarta paradas vazias / frases soltas.
 * @param {RoteiroParada[]} paradas
 * @param {Array<{ id: string, nome: string }>} [lugares]
 * @returns {RoteiroParada[]}
 */
function finalizeParadas(paradas, lugares) {
  return paradas
    .map((parada) => ({
      ...parada,
      lugarId: matchLugarId(parada.nome, lugares),
    }))
    .filter(paradaValida);
}

/**
 * Numera paradas em sequência no dia (manhã → tarde → noite → sem período).
 * @param {RoteiroDia} dia
 * @returns {void}
 */
function assignOrdemNoDia(dia) {
  let ordem = 1;
  for (const periodo of dia.periodos) {
    for (const parada of periodo.paradas) {
      parada.ordem = ordem;
      ordem += 1;
    }
  }
  for (const parada of dia.paradasSemPeriodo) {
    parada.ordem = ordem;
    ordem += 1;
  }
}

/**
 * Indica se o buffer já tem nome de lugar (próxima linha de lugar inicia nova parada).
 * @param {string[]} lines
 * @returns {boolean}
 */
function bufferTemNomeLugar(lines) {
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    if (isPlaceLine(trimmed)) return true;
  }
  return false;
}

/**
 * @param {string} text
 * @param {Array<{ id: string, nome: string }>} [lugaresCatalog]
 * @returns {RoteiroParsed}
 */
export function parseRoteiroMarkdown(text, lugaresCatalog = []) {
  const empty = { intro: [], dias: [], fallbackTexto: false };

  if (!text?.trim()) {
    return empty;
  }

  const lines = String(text).replace(/\r\n/g, "\n").split("\n");
  const intro = [];
  const dias = [];

  let currentDia = null;
  let currentPeriodoId = null;
  let stepBuffer = [];
  let introMode = true;

  /** @type {RoteiroPeriodo|null} */
  let currentPeriodo = null;

  function flushStepToPeriod() {
    if (!stepBuffer.length) {
      stepBuffer = [];
      return;
    }

    const raw = linesToParada(stepBuffer);
    stepBuffer = [];
    if (!raw) return;

    const parada = {
      ...raw,
      ordem: 0,
      lugarId: null,
    };

    if (!paradaValida(parada)) return;

    if (currentPeriodo) {
      currentPeriodo.paradas.push(parada);
    } else if (currentDia) {
      currentDia.paradasSemPeriodo.push(parada);
    }
  }

  function ensurePeriodo(periodoId) {
    if (!currentDia || !periodoId) return;
    const meta = PERIODO_META[periodoId];
    let periodo = currentDia.periodos.find((p) => p.id === periodoId);
    if (!periodo) {
      periodo = {
        id: periodoId,
        label: meta.label,
        emoji: meta.emoji,
        paradas: [],
      };
      currentDia.periodos.push(periodo);
    }
    currentPeriodo = periodo;
    currentPeriodoId = periodoId;
  }

  function closePeriodo() {
    flushStepToPeriod();
    currentPeriodo = null;
    currentPeriodoId = null;
  }

  function closeDia() {
    closePeriodo();
    if (currentDia) {
      currentDia.paradasSemPeriodo = finalizeParadas(
        currentDia.paradasSemPeriodo,
        lugaresCatalog
      );
      currentDia.periodos = currentDia.periodos
        .map((periodo) => ({
          ...periodo,
          paradas: finalizeParadas(periodo.paradas, lugaresCatalog),
        }))
        .filter((p) => p.paradas.length > 0);
      assignOrdemNoDia(currentDia);
      if (
        currentDia.paradasSemPeriodo.length > 0 ||
        currentDia.periodos.length > 0
      ) {
        dias.push(currentDia);
      }
    }
    currentDia = null;
  }

  /**
   * Nova linha de lugar fecha a parada anterior (não flush em linha em branco —
   * senão tip/duração após espaço viram parada fantasma).
   * @param {string} line
   */
  function pushStepLine(line) {
    if (isPlaceLine(line) && bufferTemNomeLugar(stepBuffer)) {
      flushStepToPeriod();
    }
    stepBuffer.push(line);
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (isDiaHeading(line)) {
      closeDia();
      introMode = false;
      const titulo = line.replace(/^#\s*/, "").trim();
      const numeroMatch = titulo.match(/dia\s*(\d+)/i);
      currentDia = {
        titulo,
        numero: numeroMatch ? Number(numeroMatch[1]) : dias.length + 1,
        periodos: [],
        paradasSemPeriodo: [],
      };
      continue;
    }

    const periodoFromLine = detectPeriodoId(line);
    if (isPeriodoHeading(line) || (periodoFromLine && /^##/.test(line))) {
      introMode = false;
      if (!currentDia) {
        currentDia = {
          titulo: `Dia ${dias.length + 1}`,
          numero: dias.length + 1,
          periodos: [],
          paradasSemPeriodo: [],
        };
      }
      closePeriodo();
      const pid = periodoFromLine ?? detectPeriodoId(line.replace(/^##\s*/, ""));
      if (pid) ensurePeriodo(pid);
      if (!/^##\s*(manh|tarde|noite)/i.test(line) && !isPeriodoHeading(line)) {
        pushStepLine(line.replace(/^##\s*/, ""));
      }
      continue;
    }

    if (introMode && !currentDia) {
      intro.push(line);
      continue;
    }

    if (!currentDia) {
      currentDia = {
        titulo: `Dia ${dias.length + 1}`,
        numero: dias.length + 1,
        periodos: [],
        paradasSemPeriodo: [],
      };
    }

    if (currentPeriodo || currentPeriodoId) {
      pushStepLine(line);
    } else if (periodoFromLine) {
      ensurePeriodo(periodoFromLine);
      pushStepLine(line);
    } else {
      pushStepLine(line);
    }
  }

  closeDia();

  if (dias.length === 0 && intro.length === 0) {
    const paragrafo = String(text).trim();
    if (paragrafo) {
      return {
        intro: [paragrafo],
        dias: [],
        fallbackTexto: true,
      };
    }
    return empty;
  }

  return {
    intro: intro.filter(Boolean),
    dias,
    fallbackTexto: false,
  };
}

/**
 * Conta paradas totais no roteiro parseado.
 * @param {RoteiroParsed} parsed
 * @returns {number}
 */
export function countRoteiroParadas(parsed) {
  let total = 0;
  for (const dia of parsed.dias) {
    for (const periodo of dia.periodos) {
      total += periodo.paradas.length;
    }
    total += dia.paradasSemPeriodo.length;
  }
  return total;
}

/**
 * @param {RoteiroParsed} parsed
 * @returns {string}
 */
export function getRoteiroResumo(parsed) {
  const nDias = parsed.dias.length;
  const nParadas = countRoteiroParadas(parsed);
  if (!nDias) return "";
  const paradasLabel = nParadas === 1 ? "1 parada" : `${nParadas} paradas`;
  const diasLabel = nDias === 1 ? "1 dia" : `${nDias} dias`;
  return `${diasLabel} · ${paradasLabel}`;
}
