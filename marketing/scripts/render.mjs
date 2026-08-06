/**
 * Renderiza artes Instagram a partir dos templates HTML fixos (Playwright).
 * Uso: node marketing/scripts/render.mjs
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
  const outDir = path.join(MARKETING, "posts", "2026-08-06");
  fs.mkdirSync(outDir, { recursive: true });

  const logo = assetUrl("logo-light.png");
  const lagoa = assetUrl("fotos", "natureza", "lagoa.jpg");
  const praia = assetUrl("fotos", "natureza", "praia.jpg");
  const montanha = assetUrl("fotos", "natureza", "montanha.jpg");
  const cachoeira = assetUrl("fotos", "natureza", "cachoeira.jpg");

  // Pilar 1 — Atrativo em destaque: Lagoa de Ibiraquera
  const slides = [
    {
      file: "carrossel-01-gancho.png",
      bg: lagoa,
      eyebrow: "Imbituba",
      title: "Essa lagoa muda de cor. Sério.",
      body: "E fica a poucos minutos do centro.",
      page: "1",
    },
    {
      file: "carrossel-02-o-que-e.png",
      bg: lagoa,
      eyebrow: "Lagoa de Ibiraquera",
      title: "Um dos cartões-postais da cidade",
      body: "Água rasa, vento constante e aquele azul-esverdeado que muda com o sol.",
      page: "2",
    },
    {
      file: "carrossel-03-horario.png",
      bg: praia,
      eyebrow: "Dica de local",
      title: "Fim de tarde = magia",
      body: "O pôr do sol na lagoa é o horário que mais vale a foto (e o silêncio).",
      page: "3",
    },
    {
      file: "carrossel-04-como.png",
      bg: montanha,
      eyebrow: "Como aproveitar",
      title: "Kite, stand-up ou só olhar",
      body: "No Guia você acha acesso, horário e o que fazer por perto.",
      page: "4",
    },
    {
      file: "carrossel-05-cta.png",
      bg: cachoeira,
      eyebrow: "Guia de Bolso",
      title: "Ibiraquera sem se perder",
      body: "Roteiro, mapa e favoritos — até offline.",
      page: "5",
      cta: "1",
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
          logo,
          eyebrow: slide.eyebrow,
          title: slide.title,
          body: slide.body,
          page: slide.page,
          total,
          cta: slide.cta || "0",
        },
      });
    }

    await renderOne(browser, {
      template: "story.html",
      width: 1080,
      height: 1920,
      out: path.join(outDir, "story-1-enquete.png"),
      params: {
        bg: lagoa,
        logo,
        eyebrow: "Enquete",
        title: "Você já foi na Lagoa de Ibiraquera?",
        body: "Responde no sticker — a gente monta o roteiro pra você.",
        hint: "Sticker: Sim / Ainda não",
      },
    });

    await renderOne(browser, {
      template: "story.html",
      width: 1080,
      height: 1920,
      out: path.join(outDir, "story-2-divulga.png"),
      params: {
        bg: praia,
        logo,
        eyebrow: "Novo no feed",
        title: "A lagoa que muda de cor",
        body: "Desliza o carrossel de hoje e salva pra quando for.",
        hint: "Arrasta pra cima · ver o post",
      },
    });
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
