import assert from "node:assert/strict";
import {
  filterReportRows,
  isExcludedReportRole,
  REPORT_EXCLUDED_ROLES,
} from "./reportAudience.js";

assert.equal(isExcludedReportRole("admin"), true);
assert.equal(isExcludedReportRole("dev"), true);
assert.equal(isExcludedReportRole("usuario"), false);
assert.equal(isExcludedReportRole("estabelecimento"), false);
assert.deepEqual([...REPORT_EXCLUDED_ROLES], ["admin", "dev"]);

const excluded = new Set(["equipe-1"]);
const rows = [
  { id: 1, user_id: "equipe-1", acao: "visualizou_lugar" },
  { id: 2, user_id: "visitante", acao: "visualizou_lugar" },
  { id: 3, user_id: null, acao: "escaneou_qr" },
  { id: 4, acao: "ir_agora" },
];

const kept = filterReportRows(rows, excluded);
assert.deepEqual(
  kept.map((row) => row.id),
  [2, 3, 4]
);
assert.equal(filterReportRows(rows, new Set()).length, 4);
assert.equal(filterReportRows(null, excluded).length, 0);

console.log("reportAudience tests OK");
