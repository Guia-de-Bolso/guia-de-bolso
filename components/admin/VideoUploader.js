"use client";

import { useRef, useState } from "react";
import {
  LUGAR_VIDEO_LIMITS,
  formatVideoDuration,
  formatVideoFileSize,
  isAcceptedVideoFile,
  validateVideoFile,
} from "@/lib/videoUpload";

const ACCEPT = "video/mp4,video/webm,.mp4,.webm";

/**
 * Upload de um único vídeo por lugar (preview + remoção).
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
  const [validating, setValidating] = useState(false);
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
      setLocalError("Selecione um arquivo MP4 ou WebM.");
      return;
    }

    setValidating(true);
    setLocalError("");

    try {
      const { durationSeconds } = await validateVideoFile(file);
      const preview = URL.createObjectURL(file);
      onPendingChange({ file, preview, durationSeconds });
    } catch (err) {
      setLocalError(err?.message || "Não foi possível validar o vídeo.");
    } finally {
      setValidating(false);
    }
  }

  const displayError = error || localError;

  return (
    <div className="mt-4 rounded-xl border border-[#d4ede8] bg-[#f7faf9] p-4">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1a2e28]">Vídeo do lugar</p>
          <p className="mt-0.5 text-xs text-[#5a6b66]">
            Até {LUGAR_VIDEO_LIMITS.maxDurationSeconds}s · máx.{" "}
            {formatVideoFileSize(LUGAR_VIDEO_LIMITS.maxBytes)} · MP4 ou WebM. Comprima no
            celular ou no computador antes de enviar.
          </p>
        </div>
        {!hasVideo && (
          <button
            type="button"
            disabled={disabled || validating}
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-xl bg-[#1a4a3a] px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
          >
            {validating ? "Validando…" : "Selecionar vídeo"}
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        disabled={disabled || validating}
        onChange={handleFileChange}
      />

      {hasVideo && (
        <div className="mt-3 overflow-hidden rounded-2xl bg-black">
          <video
            src={previewSrc}
            controls
            playsInline
            preload="metadata"
            className="aspect-video w-full bg-black object-contain"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 bg-[#eef3f1] px-3 py-2 text-xs text-[#5a6b66]">
            <span>
              {pending
                ? `${formatVideoFileSize(pending.file.size)} · ${formatVideoDuration(pending.durationSeconds)}`
                : "Vídeo salvo"}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={disabled || validating}
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
