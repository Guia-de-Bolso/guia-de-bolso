/**
 * Transcodificação de vídeo no cliente (FFmpeg.wasm) para MP4 H.264 web-ready.
 * @module lib/videoCompress
 */

import { LUGAR_VIDEO_LIMITS } from "./videoUpload.js";

/** CDN do core FFmpeg (single-thread, sem COOP/COEP). */
const FFMPEG_CORE_VERSION = "0.12.6";
const FFMPEG_CDN = `https://cdn.jsdelivr.net/npm/@ffmpeg/core@${FFMPEG_CORE_VERSION}/dist/esm`;

/** @type {Promise<import('@ffmpeg/ffmpeg').FFmpeg>|null} */
let ffmpegLoadPromise = null;

/**
 * Preset de saída — boa qualidade visual com tamanho adequado para web.
 */
export const LUGAR_VIDEO_COMPRESS_PRESET = {
  maxWidth: LUGAR_VIDEO_LIMITS.maxWidth,
  maxHeight: LUGAR_VIDEO_LIMITS.maxHeight,
  crf: 22,
  audioBitrateKbps: 128,
  outputMime: "video/mp4",
};

/**
 * @param {File} file
 * @returns {boolean}
 */
export function isMp4VideoFile(file) {
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return file.type === "video/mp4" || ext === "mp4" || ext === "m4v";
}

/**
 * Indica se vale transcodificar antes do upload.
 * @param {File} file
 * @param {{ width?: number, height?: number }} [metadata]
 * @returns {boolean}
 */
export function needsVideoCompression(file, metadata = {}) {
  const { width = 0, height = 0 } = metadata;

  if (file.size > LUGAR_VIDEO_LIMITS.maxOutputBytes) return true;
  if (!isMp4VideoFile(file)) return true;
  if (width > LUGAR_VIDEO_LIMITS.maxWidth || height > LUGAR_VIDEO_LIMITS.maxHeight) {
    return true;
  }
  // Vídeos curtos em alta taxa de bits (ex.: 4K do celular) ainda beneficiam de normalização.
  if (file.size > 12 * 1024 * 1024) return true;

  return false;
}

/**
 * @param {File} file
 * @returns {string}
 */
function getInputExtension(file) {
  const ext = file.name?.split(".").pop()?.toLowerCase();
  if (ext === "mov" || ext === "qt" || file.type === "video/quicktime") return "mov";
  if (ext === "webm" || file.type === "video/webm") return "webm";
  if (ext === "m4v") return "m4v";
  return "mp4";
}

/**
 * Carrega FFmpeg.wasm uma única vez por sessão.
 * @param {(pct: number) => void} [onLoadProgress]
 * @returns {Promise<import('@ffmpeg/ffmpeg').FFmpeg>}
 */
async function loadFFmpeg(onLoadProgress) {
  if (ffmpegLoadPromise) return ffmpegLoadPromise;

  ffmpegLoadPromise = (async () => {
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { toBlobURL } = await import("@ffmpeg/util");

    const ffmpeg = new FFmpeg();

    ffmpeg.on("log", ({ message }) => {
      if (message?.includes("error") || message?.includes("Error")) {
        console.warn("[videoCompress]", message);
      }
    });

    onLoadProgress?.(5);

    await ffmpeg.load({
      coreURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${FFMPEG_CDN}/ffmpeg-core.wasm`, "application/wasm"),
    });

    onLoadProgress?.(15);
    return ffmpeg;
  })().catch((error) => {
    ffmpegLoadPromise = null;
    throw error;
  });

  return ffmpegLoadPromise;
}

/**
 * Monta argumentos do ffmpeg para um passe de compressão.
 * @param {string} inputName
 * @param {string} outputName
 * @param {{ crf: number, maxWidth: number, maxHeight: number, audioBitrateKbps: number }} preset
 * @returns {string[]}
 */
function buildFfmpegArgs(inputName, outputName, preset) {
  const scale = `scale=${preset.maxWidth}:${preset.maxHeight}:force_original_aspect_ratio=decrease`;

  return [
    "-i",
    inputName,
    "-vf",
    scale,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    String(preset.crf),
    "-c:a",
    "aac",
    "-b:a",
    `${preset.audioBitrateKbps}k`,
    "-movflags",
    "+faststart",
    "-pix_fmt",
    "yuv420p",
    outputName,
  ];
}

/**
 * Executa um passe de transcodificação.
 * @param {import('@ffmpeg/ffmpeg').FFmpeg} ffmpeg
 * @param {File} file
 * @param {{ crf: number, maxWidth: number, maxHeight: number, audioBitrateKbps: number }} preset
 * @param {(pct: number) => void} [onProgress]
 * @returns {Promise<File>}
 */
async function runCompressionPass(ffmpeg, file, preset, onProgress) {
  const { fetchFile } = await import("@ffmpeg/util");

  const inputExt = getInputExtension(file);
  const inputName = `input.${inputExt}`;
  const outputName = "output.mp4";

  const progressHandler = ({ progress }) => {
    if (!Number.isFinite(progress)) return;
    const pct = Math.min(99, Math.max(16, Math.round(16 + progress * 83)));
    onProgress?.(pct);
  };

  ffmpeg.on("progress", progressHandler);

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(file));
    await ffmpeg.exec(buildFfmpegArgs(inputName, outputName, preset));

    const data = await ffmpeg.readFile(outputName);
    const bytes =
      data instanceof Uint8Array ? data : new Uint8Array(/** @type {ArrayBuffer} */ (data));

    const baseName = (file.name || "video").replace(/\.[^.]+$/, "") || "video";

    return new File([bytes], `${baseName}.mp4`, {
      type: LUGAR_VIDEO_COMPRESS_PRESET.outputMime,
      lastModified: Date.now(),
    });
  } finally {
    ffmpeg.off("progress", progressHandler);
    try {
      await ffmpeg.deleteFile(inputName);
    } catch {
      /* ignore */
    }
    try {
      await ffmpeg.deleteFile(outputName);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Comprime vídeo para MP4 H.264 otimizado para web.
 * Arquivos já leves e dentro dos limites são retornados sem alteração.
 * @param {File} file
 * @param {object} [options]
 * @param {{ width?: number, height?: number }} [options.metadata]
 * @param {(pct: number) => void} [options.onProgress] - 0–100
 * @returns {Promise<File>}
 */
export async function compressVideoFile(file, options = {}) {
  const { metadata = {}, onProgress } = options;

  if (!needsVideoCompression(file, metadata)) {
    onProgress?.(100);
    return file;
  }

  onProgress?.(0);

  let ffmpeg;
  try {
    ffmpeg = await loadFFmpeg((pct) => onProgress?.(Math.min(pct, 15)));
  } catch {
    throw new Error(
      "Não foi possível carregar o otimizador de vídeo. Verifique sua conexão e tente novamente."
    );
  }

  const primaryPreset = { ...LUGAR_VIDEO_COMPRESS_PRESET };
  let result = await runCompressionPass(ffmpeg, file, primaryPreset, onProgress);

  if (result.size > LUGAR_VIDEO_LIMITS.maxOutputBytes) {
    const fallbackPreset = {
      ...primaryPreset,
      crf: 26,
      maxWidth: 1280,
      maxHeight: 720,
      audioBitrateKbps: 96,
    };
    onProgress?.(16);
    result = await runCompressionPass(ffmpeg, file, fallbackPreset, onProgress);
  }

  if (result.size > LUGAR_VIDEO_LIMITS.maxOutputBytes) {
    throw new Error(
      `Mesmo após otimizar, o vídeo ficou grande demais (${Math.round(result.size / (1024 * 1024))} MB). ` +
        `Tente um clipe mais curto (máx. ${LUGAR_VIDEO_LIMITS.maxDurationSeconds}s).`
    );
  }

  onProgress?.(100);
  return result;
}
