/**
 * Renderiza artes Instagram a partir dos templates HTML fixos (Playwright).
 * Uso: node marketing/scripts/render.mjs
 *
 * Formato: carrossel + 1 story (teaser). Sem Reels, sem enquete.
 * O 2º story é automático ao publicar o carrossel no Instagram.
 * Horário: noite, após 19h. Regra: não reutilizar fotos do post anterior.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const MARKETING = path.join(ROOT, "marketing");
const ASSETS = path.join(MARKETING, "assets");
const TEMPLATES = path.join(MARKETING, "templates");

function assetUrl(...parts) {
  return pathToFileURL(path.join(ASSETS, ...parts)).href;
}

function templateUrl(name, params) {
  const base = pathToFileURL(path.join(TEMPLATES, name)).href;
  const qs = new URLSearchParams(params).toString();
  return `${base}?${qs}`;
}

/**
 * @param {import('playwright').Browser} browser
 * @param {{ template: string, params: Record<string,string>, width: number, height: number, out: string }} job
 */
async function renderOne(browser, job) {
  const page = await browser.newPage({
    viewport: { width: job.width, height: job.height },
    deviceScaleFactor: 1,
  });
  const url = templateUrl(job.template, job.params);
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.screenshot({ path: job.out, type: "png" });
  await page.close();
  console.log("✓", path.relative(ROOT, job.out));
}

async function main() {
  // === POST DO DIA — 2026-09-02 (quarta) ===
  // Pilar 1 — Atrativo em destaque (ontem 31/08 foi pilar 2)
  const date = "2026-09-02";
  const outDir = path.join(MARKETING, "posts", date);
  fs.mkdirSync(outDir, { recursive: true });

  const logoLight = assetUrl("logo-light.png");
  const logoDark = assetUrl("logo-dark.png");

  const bento1 = assetUrl("fotos", "atrativos", "mirante-bento-1.jpg");
  const bento2 = assetUrl("fotos", "atrativos", "mirante-bento-2.jpg");
  const vista = assetUrl("fotos", "atrativos", "mirante-vista.jpg");
  const ibiraquera = assetUrl("fotos", "natureza", "praia-ibiraquera.jpg");

  const slides = [
    {
      file: "carrossel-01-gancho.png",
      bg: bento1,
      brand: "dark",
      eyebrow: "Imbituba",
      title: "A costa inteira num olhar.",
      body: "Do Mirante Bento você enxerga Imbituba de cima.",
      page: "1",
    },
    {
      file: "carrossel-02-o-que-e.png",
      bg: bento2,
      brand: "dark",
      eyebrow: "Mirante Bento",
      title: "Panorama sem esforço",
      body: "Trilha curta, vista aberta — praia, morro e horizonte.",
      page: "2",
    },
    {
      file: "carrossel-03-horario.png",
      bg: vista,
      brand: "dark",
      eyebrow: "Melhor horário",
      title: "Manhã clara ou fim de tarde",
      body: "Luz boa pra foto e vento na cara sem pressa.",
      page: "3",
    },
    {
      file: "carrossel-04-cta.png",
      bg: ibiraquera,
      brand: "dark",
      eyebrow: "Guia de Bolso",
      title: "Como chegar sem chute",
      body: "Acesso, mapa e dicas no app — favorita e vai.",
      page: "4",
      cta: "1",
    },
  ];

  const stories = [
    {
      file: "story-1-teaser.png",
      bg: bento1,
      brand: "dark",
      eyebrow: "Guia de Bolso",
      title: "Mirante Bento no feed",
      body: "A vista que mostra a costa inteira — carrossel daqui a pouco.",
      hint: "Fica de olho no feed",
    },
  ];

  const total = String(slides.length);
  const browser = await chromium.launch({ headless: true });

  try {
    for (const slide of slides) {
      await renderOne(browser, {
        template: "carousel.html",
        width: 1080,
        height: 1350,
        out: path.join(outDir, slide.file),
        params: {
          bg: slide.bg,
          logo: slide.brand === "dark" ? logoDark : logoLight,
          brand: slide.brand,
          eyebrow: slide.eyebrow,
          title: slide.title,
          body: slide.body,
          page: slide.page,
          total,
          cta: slide.cta || "0",
        },
      });
    }

    for (const story of stories) {
      await renderOne(browser, {
        template: "story.html",
        width: 1080,
        height: 1920,
        out: path.join(outDir, story.file),
        params: {
          bg: story.bg,
          logo: story.brand === "dark" ? logoDark : logoLight,
          brand: story.brand,
          eyebrow: story.eyebrow,
          title: story.title,
          body: story.body,
          hint: story.hint,
        },
      });
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
