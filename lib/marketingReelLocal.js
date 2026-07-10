import { spawn } from "node:child_process";
import fs from "node:fs";

/**
 * Gera MP4 simples a partir de uma imagem (Ken Burns leve) para upload de Reels.
 * Usa ffmpeg-static — não depende de ffmpeg instalado no sistema.
 *
 * @param {{ inputPath: string, outputPath: string, durationSec?: number }} params
 * @returns {Promise<void>}
 */
export async function generateReelFromImage({ inputPath, outputPath, durationSec = 12 }) {
  if (!fs.existsSync(inputPath)) {
    throw new Error(`Imagem de capa não encontrada: ${inputPath}`);
  }

  const ffmpegModule = await import("ffmpeg-static");
  const ffmpegPath = ffmpegModule.default;
  if (!ffmpegPath || !fs.existsSync(ffmpegPath)) {
    throw new Error("ffmpeg-static não disponível. Rode: npm install");
  }

  const frames = Math.max(1, Math.round(durationSec * 30));
  const filter = [
    "scale=1080:1920:force_original_aspect_ratio=increase",
    "crop=1080:1920",
    `zoompan=z='min(zoom+0.00045,1.12)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=30`,
  ].join(",");

  await runFfmpeg(ffmpegPath, [
    "-y",
    "-loop",
    "1",
    "-i",
    inputPath,
    "-vf",
    filter,
    "-t",
    String(durationSec),
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    outputPath,
  ]);
}

/**
 * @param {string} ffmpegPath
 * @param {string[]} args
 * @returns {Promise<void>}
 */
function runFfmpeg(ffmpegPath, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args, { stdio: ["ignore", "pipe", "pipe"] });
    /** @type {Buffer[]} */
    const stderrChunks = [];

    proc.stderr.on("data", (chunk) => stderrChunks.push(chunk));
    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      const stderr = Buffer.concat(stderrChunks).toString("utf8").trim();
      reject(new Error(stderr || `ffmpeg saiu com código ${code}`));
    });
  });
}

/**
 * @param {unknown} error
 * @returns {boolean}
 */
export function isPlacidCreditsError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /not enough credits/i.test(message);
}
