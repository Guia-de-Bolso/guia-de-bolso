/**
 * Saudação da home: período do dia + gancho curto ligado ao clima.
 * @module lib/homeGreeting
 */

/**
 * @returns {"Boa manhã"|"Boa tarde"|"Boa noite"}
 */
export function getSaudacaoPeriodo(date = new Date()) {
  const hora = date instanceof Date ? date.getHours() : new Date().getHours();
  if (hora < 12) return "Boa manhã";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

/**
 * Frase curta ligada à condição do tempo (sem temperatura).
 * @param {string|null|undefined} condition - Ex.: "Ensolarado" (getWeatherCondition).
 * @param {number|null|undefined} [temperature]
 * @param {Date} [date]
 * @returns {string|null}
 */
export function getClimaHook(condition, temperature = null, date = new Date()) {
  const cond = typeof condition === "string" ? condition.trim() : "";
  if (!cond) return null;

  const temp = Number(temperature);
  const hora = date instanceof Date ? date.getHours() : new Date().getHours();
  const isNoite = hora >= 18 || hora < 5;
  const isQuente = Number.isFinite(temp) && temp >= 29;
  const isFresco = Number.isFinite(temp) && temp <= 17;

  switch (cond) {
    case "Ensolarado":
      if (isNoite) return "Céu limpo";
      if (isQuente) return "Sol e calorzinho";
      return "Dia de sol";
    case "Parcialmente nublado":
      return isNoite ? "Nuvens leves" : "Sol entre nuvens";
    case "Neblina":
      return "Neblina no ar";
    case "Garoa":
      return "Garoa leve";
    case "Chuva":
      return isNoite ? "Chuva na noite" : "Dia de chuva";
    case "Pancadas de chuva":
      return "Pancadas no ar";
    case "Tempestade":
      return "Tempestade por perto";
    case "Neve":
      return "Frio intenso";
    case "Nublado":
      if (isFresco) return "Céu fechado e fresco";
      return isNoite ? "Noite nublada" : "Céu nublado";
    default:
      return null;
  }
}

/**
 * Monta as linhas da saudação da home.
 * @param {object} opts
 * @param {string|null} [opts.primeiroNome]
 * @param {string|null} [opts.condition]
 * @param {number|null} [opts.temperature]
 * @param {Date} [opts.date]
 * @returns {{ saudacao: string, climaLinha: string|null }}
 */
export function buildHomeGreeting({
  primeiroNome = null,
  condition = null,
  temperature = null,
  date = new Date(),
} = {}) {
  const periodo = getSaudacaoPeriodo(date);
  const nome =
    typeof primeiroNome === "string" && primeiroNome.trim()
      ? primeiroNome.trim().split(/\s+/)[0]
      : null;
  const saudacao = nome ? `${periodo}, ${nome}` : periodo;

  const hook = getClimaHook(condition, temperature, date);
  if (!hook) {
    return { saudacao, climaLinha: null };
  }

  const tempNum = Number(temperature);
  const tempLabel = Number.isFinite(tempNum) ? `${Math.round(tempNum)}°` : null;
  const climaLinha = tempLabel ? `${hook} · ${tempLabel}` : hook;

  return { saudacao, climaLinha };
}
