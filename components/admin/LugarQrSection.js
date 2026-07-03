"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { isParceiro } from "@/lib/lugarBadges";
import { buildQrUrl, isLugarElegivelQr } from "@/lib/lugarQr";
import { downloadQrPdf, generateQrDataUrl, QR_PDF_COPY } from "@/lib/qrPdf";
import { getClientSiteUrl } from "@/lib/siteUrl";

/**
 * Seção admin: preview do QR, URL curta e download PDF premium.
 * @param {{
 *   lugar: {
 *     id: string|number,
 *     nome: string,
 *     categoria?: string,
 *     subcategoria?: string,
 *     slug?: string|null,
 *     status?: string,
 *     imagemUrl?: string|null,
 *   },
 *   slugColumnReady?: boolean,
 * }} props
 * @returns {import("react").ReactElement|null}
 */
export default function LugarQrSection({ lugar, slugColumnReady = true }) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [baixando, setBaixando] = useState(false);
  const ehParceiro = isParceiro(lugar);

  const elegivel = isLugarElegivelQr(lugar);
  const slug = lugar?.slug?.trim() || "";
  const siteUrl = getClientSiteUrl();
  const qrUrl = slug ? buildQrUrl(slug, siteUrl) : "";

  const categoriaLinha = useMemo(() => {
    const cat = String(lugar?.categoria || "").trim();
    const sub = String(lugar?.subcategoria || "").trim();
    if (cat && sub) return `${cat} · ${sub}`;
    return cat || sub || "";
  }, [lugar?.categoria, lugar?.subcategoria]);

  useEffect(() => {
    if (!elegivel || !slug) {
      setQrDataUrl("");
      return;
    }

    let cancelled = false;

    generateQrDataUrl(siteUrl, slug)
      .then((dataUrl) => {
        if (!cancelled) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        if (!cancelled) {
          QRCode.toDataURL(qrUrl, {
            width: 280,
            margin: 2,
            errorCorrectionLevel: "H",
            color: { dark: "#000000", light: "#ffffff" },
          })
            .then((dataUrl) => {
              if (!cancelled) setQrDataUrl(dataUrl);
            })
            .catch(() => {
              if (!cancelled) setQrDataUrl("");
            });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [elegivel, slug, qrUrl, siteUrl]);

  if (!elegivel) return null;

  if (!slugColumnReady) {
    return (
      <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wide text-amber-900">
          QR Code do estabelecimento
        </h3>
        <p className="mt-2 text-sm text-amber-950">
          Rode{" "}
          <code className="rounded bg-white px-1 py-0.5 text-xs">supabase/lugares_qr_slug.sql</code>{" "}
          no SQL Editor do Supabase para criar a coluna <code className="text-xs">slug</code> e
          gerar o PDF.
        </p>
      </section>
    );
  }

  /**
   * @returns {Promise<void>}
   */
  async function handleCopiar() {
    if (!qrUrl) return;

    try {
      await navigator.clipboard.writeText(qrUrl);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      // Clipboard pode falhar em contextos restritos.
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async function handleBaixarPdf() {
    if (!slug || !lugar?.nome) return;

    setBaixando(true);
    try {
      await downloadQrPdf({
        nome: lugar.nome,
        categoria: lugar.categoria,
        subcategoria: lugar.subcategoria,
        slug,
        siteUrl,
        ehParceiro,
        imagemUrl: lugar.imagemUrl,
        format: "adesivo",
      });
    } finally {
      setBaixando(false);
    }
  }

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-[#1a4a3a]/15 bg-gradient-to-br from-[#1a4a3a] to-[#2d6b54] p-5 text-white shadow-sm">
      <div className="flex items-start gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="h-9 w-auto shrink-0 brightness-0 invert" />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/75">
            {QR_PDF_COPY.badge}
          </p>
          <h3 className="mt-0.5 text-base font-bold">{QR_PDF_COPY.headline}</h3>
          <p className="mt-1 text-xs leading-relaxed text-white/85">{QR_PDF_COPY.subtitle}</p>
        </div>
      </div>

      {!slug ? (
        <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-sm text-white/90">
          Salve o local para gerar o link curto e o PDF premium.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start">
          <div className="mx-auto w-full max-w-[220px] shrink-0 rounded-2xl bg-white p-4 text-center shadow-md lg:mx-0">
            {ehParceiro ? (
              <span className="mb-2 inline-block rounded-full border border-[#9a7b2f]/40 bg-[#f5f0e4] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#9a7b2f]">
                {QR_PDF_COPY.parceiroBadge}
              </span>
            ) : null}
            <p className="text-sm font-bold leading-snug text-[#1a2e28]">{lugar.nome}</p>
            {categoriaLinha ? (
              <p className="mt-1 text-xs text-[#5a6b66]">{categoriaLinha}</p>
            ) : null}
            <div className="mx-auto mt-3 inline-block rounded-xl border-2 border-[#1a4a3a] p-2">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={qrDataUrl}
                  alt={`QR Code de ${lugar.nome}`}
                  width={140}
                  height={140}
                  className="h-[140px] w-[140px]"
                />
              ) : (
                <div className="flex h-[140px] w-[140px] items-center justify-center text-xs text-[#5a6b66]">
                  Gerando preview…
                </div>
              )}
            </div>
            <p className="mt-3 text-[11px] font-semibold text-[#1a4a3a]">
              {QR_PDF_COPY.instruction}
            </p>
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                URL curta (abre o perfil no app)
              </p>
              <p className="mt-1 break-all rounded-xl bg-white/10 px-3 py-2 font-mono text-sm text-white">
                {qrUrl}
              </p>
            </div>

            <div className="rounded-xl bg-white/10 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">
                Formato de impressão
              </p>
              <p className="mt-0.5 text-sm text-white">Adesivo pequeno (8×8 cm)</p>
            </div>

            <p className="text-xs leading-relaxed text-white/80">{QR_PDF_COPY.institutional}</p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={handleCopiar}
                className="rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/20"
              >
                {copiado ? "Copiado!" : "Copiar link"}
              </button>
              <button
                type="button"
                onClick={handleBaixarPdf}
                disabled={baixando}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#1a4a3a] transition-colors hover:bg-[#f0f4f3] disabled:opacity-60"
              >
                {baixando ? "Gerando PDF…" : "Baixar PDF para impressão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
