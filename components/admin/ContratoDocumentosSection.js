"use client";

import { useRef, useState } from "react";
import {
  CONTRATO_DOC_TIPO,
  CONTRATO_DOC_TIPO_OPTIONS,
  getContratoDocTipoLabel,
} from "@/lib/contratoAdmin";

/**
 * Upload e lista de documentos de um contrato comercial.
 * @param {{
 *   contratoId: string,
 *   documentos: object[],
 *   onChange: () => void,
 * }} props
 * @returns {import("react").JSX.Element}
 */
export default function ContratoDocumentosSection({ contratoId, documentos, onChange }) {
  const inputRef = useRef(null);
  const [tipoUpload, setTipoUpload] = useState(CONTRATO_DOC_TIPO.CONTRATO_ASSINADO);
  const [uploading, setUploading] = useState(false);
  const [busyDocId, setBusyDocId] = useState(null);

  /**
   * @param {import("react").ChangeEvent<HTMLInputElement>} event
   * @returns {Promise<void>}
   */
  async function handleUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !contratoId) return;

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("tipo", tipoUpload);

      const response = await fetch(`/api/admin/contratos/${contratoId}/documentos`, {
        method: "POST",
        body,
      });

      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(json.error || "Não foi possível enviar o arquivo.");
        return;
      }

      onChange();
    } finally {
      setUploading(false);
    }
  }

  /**
   * @param {string} docId
   * @returns {Promise<void>}
   */
  async function handleDownload(docId) {
    setBusyDocId(docId);
    try {
      const response = await fetch(`/api/admin/contratos/documentos/${docId}`);
      const json = await response.json().catch(() => ({}));
      if (!response.ok || !json.url) {
        window.alert(json.error || "Não foi possível baixar o arquivo.");
        return;
      }
      window.open(json.url, "_blank", "noopener,noreferrer");
    } finally {
      setBusyDocId(null);
    }
  }

  /**
   * @param {string} docId
   * @returns {Promise<void>}
   */
  async function handleDelete(docId) {
    if (!window.confirm("Excluir este documento?")) return;

    setBusyDocId(docId);
    try {
      const response = await fetch(`/api/admin/contratos/documentos/${docId}`, {
        method: "DELETE",
      });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) {
        window.alert(json.error || "Não foi possível excluir.");
        return;
      }
      onChange();
    } finally {
      setBusyDocId(null);
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[#e3e9e6] bg-[#f7faf9] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor={`doc-tipo-${contratoId}`}
            className="text-xs font-semibold uppercase tracking-wide text-[#5a6b66]"
          >
            Tipo do arquivo
          </label>
          <select
            id={`doc-tipo-${contratoId}`}
            value={tipoUpload}
            onChange={(event) => setTipoUpload(event.target.value)}
            className="mt-1 w-full rounded-xl border border-[#e3e9e6] bg-white px-3 py-2 text-sm"
          >
            {CONTRATO_DOC_TIPO_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="rounded-xl bg-[#1a4a3a] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {uploading ? "Enviando…" : "Anexar documento"}
          </button>
        </div>
      </div>

      {documentos.length === 0 ? (
        <p className="text-sm text-[#5a6b66]">Nenhum documento anexado.</p>
      ) : (
        <ul className="divide-y divide-[#e3e9e6] rounded-xl bg-white">
          {documentos.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[#1a2e28]">
                  {doc.nome_arquivo}
                </p>
                <p className="text-xs text-[#5a6b66]">
                  {getContratoDocTipoLabel(doc.tipo)}
                  {doc.tamanho_bytes
                    ? ` · ${Math.round(Number(doc.tamanho_bytes) / 1024)} KB`
                    : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  disabled={busyDocId === doc.id}
                  onClick={() => handleDownload(doc.id)}
                  className="rounded-lg border border-[#1a4a3a] px-3 py-1.5 text-xs font-semibold text-[#1a4a3a]"
                >
                  Baixar
                </button>
                <button
                  type="button"
                  disabled={busyDocId === doc.id}
                  onClick={() => handleDelete(doc.id)}
                  className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700"
                >
                  Excluir
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
