import assert from "node:assert/strict";
import {
  getEffectiveUsageCounters,
  getUsageDayKey,
  isLegacyUsageMonthKey,
  isSameUsageDay,
  normalizeUsageFromPerfil,
  shouldAlignUsageToDay,
} from "./premium.js";

const today = getUsageDayKey();

assert.equal(isLegacyUsageMonthKey("2026-05"), true);
assert.equal(isLegacyUsageMonthKey(today), false);

assert.equal(
  getEffectiveUsageCounters({
    uso_ia_mes: "2026-05",
    buscas_ia: 3,
    roteiros_ia: 2,
  }).buscas,
  0
);

assert.equal(
  getEffectiveUsageCounters({
    uso_ia_mes: today,
    buscas_ia: 2,
    roteiros_ia: 1,
  }).buscas,
  2
);

assert.equal(
  shouldAlignUsageToDay({ id: "u1", uso_ia_mes: "2026-05", buscas_ia: 3 }),
  true
);
assert.equal(
  shouldAlignUsageToDay({ id: "u1", uso_ia_mes: today, buscas_ia: 1 }),
  false
);

const normalized = normalizeUsageFromPerfil({
  uso_ia_mes: today,
  buscas_ia: 3,
  roteiros_ia: 0,
});
assert.equal(normalized.buscas.used, 3);
assert.equal(normalized.buscas.remaining, 7);
assert.equal(normalized.buscas.limit, 10);

assert.equal(isSameUsageDay(today, today), true);
assert.equal(isSameUsageDay("2026-05", today), false);

console.log("premium.test.js: ok");
