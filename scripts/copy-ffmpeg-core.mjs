/**
 * Copia o core FFmpeg.wasm para public/ffmpeg (mesma origem — evita falha de CDN).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const srcDir = path.join(root, "node_modules", "@ffmpeg", "core", "dist", "esm");
const destDir = path.join(root, "public", "ffmpeg");
const files = ["ffmpeg-core.js", "ffmpeg-core.wasm"];

if (!fs.existsSync(srcDir)) {
  console.warn("[copy-ffmpeg-core] @ffmpeg/core não instalado — pulando.");
  process.exit(0);
}

fs.mkdirSync(destDir, { recursive: true });

for (const name of files) {
  const from = path.join(srcDir, name);
  const to = path.join(destDir, name);
  if (!fs.existsSync(from)) {
    console.warn(`[copy-ffmpeg-core] Arquivo ausente: ${from}`);
    continue;
  }
  fs.copyFileSync(from, to);
  console.log(`[copy-ffmpeg-core] ${name} → public/ffmpeg/`);
}
