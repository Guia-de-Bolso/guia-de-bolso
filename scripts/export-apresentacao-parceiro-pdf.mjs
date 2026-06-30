/**
 * Gera PDF A4 da apresentação parceiro (papel timbrado) via Playwright.
 * Uso: node scripts/export-apresentacao-parceiro-pdf.mjs
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "docs/materiais/APRESENTACAO-PARCEIRO-A4.html");
const pdfPath = path.join(root, "docs/materiais/APRESENTACAO-PARCEIRO-A4.pdf");

const browser = await chromium.launch();
const page = await browser.newPage();

await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);

await page.pdf({
  path: pdfPath,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

await browser.close();
console.log(`PDF gerado: ${pdfPath}`);
