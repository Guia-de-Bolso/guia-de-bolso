import assert from "node:assert/strict";
import {
  ensureUniqueSlug,
  isSlugAutoFromNome,
  resolveLugarSlug,
  slugifyNome,
} from "./slug.js";
import { buildQrUrl, isLugarElegivelQr } from "./lugarQr.js";
import { getSiteUrl } from "./siteUrl.js";
import { createQrPdfDocument, formatCategoriaLinha, QR_PDF_COPY } from "./qrPdf.js";

assert.equal(slugifyNome("Bar do Zé!"), "bar-do-ze");
assert.equal(slugifyNome("  Café & Cia  "), "cafe-cia");

const taken = new Set(["bar-do-ze", "bar-do-ze-2"]);
assert.equal(ensureUniqueSlug("bar-do-ze", taken), "bar-do-ze-3");
assert.equal(ensureUniqueSlug("bar-do-ze", taken, "bar-do-ze"), "bar-do-ze");

assert.equal(isSlugAutoFromNome("bar-do-ze", "Bar do Zé"), true);
assert.equal(isSlugAutoFromNome("bar-do-ze-2", "Bar do Zé"), true);
assert.equal(isSlugAutoFromNome("outro-nome", "Bar do Zé"), false);

assert.equal(
  resolveLugarSlug({
    nome: "Bar do Zé",
    slugAuto: true,
    lugarId: 1,
    takenSlugs: new Set(["bar-do-ze"]),
  }),
  "bar-do-ze-2"
);

assert.equal(isLugarElegivelQr({ categoria: "Gastronomia" }), true);
assert.equal(isLugarElegivelQr({ categoria: "Natureza" }), false);
assert.equal(isLugarElegivelQr({ categoria: "Aventura" }), false);

assert.equal(
  buildQrUrl("bar-do-ze", "https://guiadebolso.app"),
  "https://guiadebolso.app/q/bar-do-ze"
);

assert.equal(getSiteUrl("https://preview.vercel.app"), "https://preview.vercel.app");

assert.equal(
  formatCategoriaLinha("Gastronomia", "Restaurantes"),
  "Gastronomia · Restaurantes"
);
assert.equal(formatCategoriaLinha("Gastronomia", ""), "Gastronomia");
assert.equal(QR_PDF_COPY.headline, "Escaneie e conheça este lugar");

const mesaDoc = createQrPdfDocument("mesa");
assert.equal(Math.round(mesaDoc.internal.pageSize.getWidth()), 105);

const a4Doc = createQrPdfDocument("a4");
assert.equal(Math.round(a4Doc.internal.pageSize.getWidth()), 210);

const adesivoDoc = createQrPdfDocument("adesivo");
assert.equal(Math.round(adesivoDoc.internal.pageSize.getWidth()), 80);

console.log("qrPdf/slug/lugarQr tests OK");
