"use client";

import { useRef, useState } from "react";
import VideoPlayer from "@/components/VideoPlayer";
import { compressVideoFile } from "@/lib/videoCompress";
import {
  LUGAR_VIDEO_LIMITS,
  formatVideoDuration,
  formatVideoFileSize,
  isAcceptedVideoFile,
  validateVideoInputFile,
  validateVideoForStorage,
} from "@/lib/videoUpload";

const ACCEPT = "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v";

/**
 * Upload de um único vídeo por lugar (preview + remoção + otimização automática).
 * @param {object} props
 * @param {string|null} [props.currentUrl] - URL já salva no banco.
 * @param {{ file: File, preview: string, durationSeconds: number }|null} [props.pending] - Arquivo aguardando save.
 * @param {(pending: { file: File, preview: string, durationSeconds: number }) => void} props.onPendingChange
 * @param {() => void} props.onRemove
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.error=""]
 * @returns {import("react").JSX.Element}
 */
export default function VideoUploader({
  currentUrl = null,
  pending = null,
  onPendingChange,
  onRemove,
  disabled = false,
  error = "",
}) {
  const inputRef = useRef(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState("");

  const previewSrc = pending?.preview || currentUrl;
  const hasVideo = Boolean(previewSrc);

  /**
   * @param {import("react").ChangeEvent<HTMLInputElement>} event
   */
  async function handleFileChange(event) {
    const file = Array.from(event.target.files || []).find(isAcceptedVideoFile);
    event.target.value = "";
    if (!file) {
      setLocalError("Selecione um arquivo MP4, MOV ou WebM.");
      return;
    }

    setProcessing(true);
    setProgress(0);
    setLocalError("");

    try {
      const metadata = await validateVideoInputFile(file);
      const optimized = await compressVideoFile(file, {
        metadata,
        onProgress: setProgress,
      });
      const outputMeta = await validateVideoForStorage(optimized);
      const preview = URL.createObjectURL(optimized);
      onPendingChange({
        file: optimized,
        preview,
        durationSeconds: outputMeta.durationSeconds,
      });
    } catch (err) {
      setLocalError(err?.message || "Não foi possível preparar o vídeo.");
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  }

  const displayError = error || localError;
  const busy = processing || disabled;

  return (
    <div className="mt-4 rounded-xl border border-[#d4ede8] bg-[#f7faf9] p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1a2e28]">Vídeo do lugar</p>
          <p className="mt-0.5 text-xs text-[#5a6b66]">
            Até {LUGAR_VIDEO_LIMITS.maxDurationSeconds}s · até{" "}
            {formatVideoFileSize(LUGAR_VIDEO_LIMITS.maxInputBytes)} · MP4, MOV ou WebM.
            Arquivos acima de {formatVideoFileSize(LUGAR_VIDEO_LIMITS.maxOutputBytes)} são
            otimizados automaticamente quando possível.
          </p>
        </div>
        {!hasVideo && (
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-xl bg-[#1a4a3a] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {processing ? "Otimizando…" : "Selecionar vídeo"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={busy}
        onChange={handleFileChange}
      />

      {processing && (
        <div className="mt-3 rounded-xl bg-white px-4 py-3">
          <p className="text-xs font-semibold text-[#1a2e28]">
            Otimizando vídeo… {progress > 0 ? `${progress}%` : ""}
          </p>
          <p className="mt-1 text-xs text-[#5a6b66]">
            Pode levar um ou dois minutos em vídeos 4K. Não feche esta página.
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e8eeee]">
            <div
              className="h-full rounded-full bg-[#1a4a3a] transition-all duration-300"
              style={{ width: `${Math.max(progress, 8)}%` }}
            />
          </div>
        </div>
      )}

      {hasVideo && !processing && (
        <div className="mt-3 overflow-hidden rounded-2xl bg-black">
          <VideoPlayer src={previewSrc} ariaLabel="Prévia do vídeo do lugar" />
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#eef3f1] px-3 py-2 text-xs text-[#5a6b66]">
            <span>
              {pending
                ? `${formatVideoFileSize(pending.file.size)} · ${formatVideoDuration(pending.durationSeconds)}`
                : "Vídeo salvo"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => inputRef.current?.click()}
                className="font-semibold text-[#1a4a3a] underline disabled:opacity-60"
              >
                Substituir
              </button>
              <button
                type="button"
                disabled={disabled}
                onClick={onRemove}
                className="font-semibold text-[#d9534f] underline disabled:opacity-60"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {displayError && (
        <p className="mt-2 text-xs font-semibold text-[#d9534f]">{displayError}</p>
      )}
    </div>
  );
}
