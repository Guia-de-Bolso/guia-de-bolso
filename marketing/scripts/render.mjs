/**
 * Renderiza artes Instagram a partir dos templates HTML fixos (Playwright).
 * Uso: node marketing/scripts/render.mjs
 *
 * Edite o bloco POST do dia abaixo (data, pilar, slides, stories).
 * Regra: não reutilizar fotos do post do dia anterior.
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
  // === POST DO DIA — 2026-08-07 (sexta) — REVISÃO ===
  // Pilar 2 — Dica/utilidade
  // Fotos NOVAS do banco (não usar onboarding: praia/lagoa/montanha/cachoeira.jpg)
  const date = "2026-08-07";
  const outDir = path.join(MARKETING, "posts", date);
  fs.mkdirSync(outDir, { recursive: true });

  const logoLight = assetUrl("logo-light.png");
  const logoDark = assetUrl("logo-dark.png");

  const porto = assetUrl("fotos", "natureza", "praia-porto.jpg");
  const vila = assetUrl("fotos", "natureza", "praia-vila.jpg");
  const ribanceira = assetUrl("fotos", "natureza", "praia-ribanceira.jpg");
  const lagoaTimbe = assetUrl("fotos", "natureza", "lagoa-quintino.jpg");
  const mirantePorto = assetUrl("fotos", "atrativos", "mirante-da-praia-do-porto.jpg");

  // brand=dark → fundo claro (logo escura); brand=light → fundo escuro (logo clara)
  // Topos com céu claro → brand dark
  const slides = [
    {
      file: "carrossel-01-gancho.png",
      bg: porto,
      brand: "light",
      eyebrow: "Fim de semana",
      title: "Vento mudou? A praia também muda.",
      body: "Em Imbituba, o plano certo depende do vento.",
      page: "1",
    },
    {
      file: "carrossel-02-praia.png",
      bg: vila,
      brand: "dark",
      eyebrow: "1 · Praia",
      title: "Mar agitado? Troca de canto.",
      body: "Porto, Vila, Ribanceira… cada uma se comporta diferente com o vento.",
      page: "2",
    },
    {
      file: "carrossel-03-lagoa.png",
      bg: lagoaTimbe,
      brand: "dark",
      eyebrow: "2 · Lagoa",
      title: "Vento forte = dia de lagoa",
      body: "Quintino, Timbé e Ibiraquera — kite e fim de tarde sem pressa.",
      page: "3",
    },
    {
      file: "carrossel-04-trilha.png",
      bg: mirantePorto,
      brand: "dark",
      eyebrow: "3 · Vista",
      title: "Quer panorama? Sobe o mirante.",
      body: "Do alto você enxerga a costa inteira — e qual lado da praia está mais calmo.",
      page: "4",
    },
    {
      file: "carrossel-05-cta.png",
      bg: ribanceira,
      brand: "dark",
      eyebrow: "Guia de Bolso",
      title: "O fim de semana sem improvisar",
      body: "Abre o app, diz o que quer — e sai com o plano pronto.",
      page: "5",
      cta: "1",
    },
  ];

  const stories = [
    {
      file: "story-1-enquete.png",
      bg: porto,
      brand: "light",
      eyebrow: "Enquete",
      title: "Sexta: praia, lagoa ou trilha?",
      body: "Responde no sticker — a gente te ajuda a escolher.",
      hint: "Sticker: Praia / Lagoa / Trilha",
    },
    {
      file: "story-2-divulga.png",
      bg: mirantePorto,
      brand: "dark",
      eyebrow: "Novo no feed",
      title: "Vento mudou? Muda o plano.",
      body: "Salva o carrossel de hoje antes do fim de semana.",
      hint: "Arrasta pra cima · ver o post",
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
