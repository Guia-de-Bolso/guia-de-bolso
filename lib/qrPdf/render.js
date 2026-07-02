import { getSiteDisplayDomain } from "../siteContact.js";
import { QR_PDF_THEME, hexToRgb } from "./theme.js";
import { resolveQrPdfFormat } from "./formats.js";

/** Textos institucionais — pt-BR, curtos para leitura em 3 segundos. */
export const QR_PDF_COPY = {
  headline: "Escaneie e conheça este lugar",
  subtitle:
    "Acesse fotos, localização, horários e informações atualizadas em poucos segundos.",
  instruction: "Aponte a câmera do celular para o QR Code",
  institutional:
    "Descubra os melhores lugares, atrações e experiências da região em um só app.",
  footer: "Explore mais no app",
  badge: "Guia local oficial",
  parceiroBadge: "Parceiro oficial",
};

/**
 * @param {string} [categoria]
 * @param {string} [subcategoria]
 * @returns {string}
 */
export function formatCategoriaLinha(categoria, subcategoria) {
  const cat = String(categoria || "").trim();
  const sub = String(subcategoria || "").trim();
  if (cat && sub) return `${cat} · ${sub}`;
  return cat || sub || "";
}

/**
 * Gradiente vertical simulado (jsPDF não tem gradiente nativo).
 * @param {import('jspdf').jsPDF} doc
 * @param {number} x
 * @param {number} y
 * @param {number} w
 * @param {number} h
 * @param {[number, number, number]} topRgb
 * @param {[number, number, number]} bottomRgb
 * @param {number} [steps]
 */
function drawVerticalGradient(doc, x, y, w, h, topRgb, bottomRgb, steps = 24) {
  const stepH = h / steps;
  for (let i = 0; i < steps; i += 1) {
    const t = i / (steps - 1);
    const r = Math.round(topRgb[0] + (bottomRgb[0] - topRgb[0]) * t);
    const g = Math.round(topRgb[1] + (bottomRgb[1] - topRgb[1]) * t);
    const b = Math.round(topRgb[2] + (bottomRgb[2] - topRgb[2]) * t);
    doc.setFillColor(r, g, b);
    doc.rect(x, y + i * stepH, w, stepH + 0.6, "F");
  }
}

/**
 * Elementos decorativos leves no fundo (sem interferir no QR).
 * @param {import('jspdf').jsPDF} doc
 * @param {number} pageW
 * @param {number} pageH
 */
function drawBackgroundDecor(doc, pageW, pageH) {
  doc.setFillColor(255, 255, 255);
  doc.setGState(doc.GState({ opacity: 0.06 }));
  doc.circle(pageW * 0.12, pageH * 0.08, pageW * 0.22, "F");
  doc.circle(pageW * 0.88, pageH * 0.18, pageW * 0.16, "F");
  doc.circle(pageW * 0.78, pageH * 0.92, pageW * 0.2, "F");
  doc.setGState(doc.GState({ opacity: 1 }));
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} cx
 * @param {number} y
 * @param {string} label
 * @param {[number, number, number]} textRgb
 * @param {[number, number, number]} borderRgb
 * @param {number} fontSize
 * @returns {number} altura do badge
 */
function drawBadge(doc, cx, y, label, textRgb, borderRgb, fontSize) {
  const badgeW = Math.min(Math.max(label.length * fontSize * 0.42, 28), 52);
  const badgeH = fontSize + 3.2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderRgb);
  doc.setLineWidth(0.2);
  doc.roundedRect(cx - badgeW / 2, y, badgeW, badgeH, badgeH / 2, badgeH / 2, "FD");
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textRgb);
  doc.text(label, cx, y + badgeH * 0.72, { align: "center" });
  return badgeH;
}

/**
 * Foto opcional do estabelecimento (cantos arredondados).
 * @param {import('jspdf').jsPDF} doc
 * @param {number} cx
 * @param {number} y
 * @param {number} size
 * @param {string} imageDataUrl
 * @returns {number} altura ocupada
 */
function drawEstablishmentPhoto(doc, cx, y, size, imageDataUrl) {
  if (!imageDataUrl || size <= 0) return 0;

  const x = cx - size / 2;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 234, 230);
  doc.setLineWidth(0.3);
  doc.roundedRect(x - 0.5, y - 0.5, size + 1, size + 1, 2, 2, "FD");

  try {
    doc.addImage(imageDataUrl, "JPEG", x, y, size, size, undefined, "FAST");
  } catch {
    try {
      doc.addImage(imageDataUrl, "PNG", x, y, size, size, undefined, "FAST");
    } catch {
      return 0;
    }
  }

  return size + 3;
}

/**
 * Card branco premium com nome, categoria e QR Code.
 * @param {import('jspdf').jsPDF} doc
 * @param {{
 *   cardX: number,
 *   cardY: number,
 *   cardW: number,
 *   cardH: number,
 *   pageW: number,
 *   nome: string,
 *   categoriaLinha: string,
 *   qrDataUrl: string,
 *   ehParceiro: boolean,
 *   fotoDataUrl?: string|null,
 *   compact?: boolean,
 * }} opts
 */
function renderEstablishmentCard(doc, opts) {
  const {
    cardX,
    cardY,
    cardW,
    pageH: _pageH,
    pageW,
    nome,
    categoriaLinha,
    qrDataUrl,
    ehParceiro,
    fotoDataUrl,
    compact = false,
  } = opts;

  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  const inkRgb = hexToRgb(QR_PDF_THEME.ink);
  const mutedRgb = hexToRgb(QR_PDF_THEME.muted);
  const goldRgb = hexToRgb(QR_PDF_THEME.gold);
  const borderRgb = hexToRgb(QR_PDF_THEME.border);
  const cx = pageW / 2;

  const pad = compact ? 4 : 7;
  const innerW = cardW - pad * 2;
  let y = cardY + pad;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderRgb);
  doc.setLineWidth(0.25);
  doc.roundedRect(cardX, cardY, cardW, opts.cardH, compact ? 2.5 : 4, compact ? 2.5 : 4, "FD");

  if (ehParceiro && !compact) {
    const badgeH = drawBadge(
      doc,
      cx,
      y,
      QR_PDF_COPY.parceiroBadge,
      goldRgb,
      goldRgb,
      5
    );
    y += badgeH + 3;
  }

  if (fotoDataUrl && !compact) {
    const photoSize = Math.min(16, innerW * 0.28);
    y += drawEstablishmentPhoto(doc, cx, y + 1, photoSize, fotoDataUrl);
  }

  const nomeSize = compact ? 8 : 12;
  doc.setFontSize(nomeSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...inkRgb);
  const nomeLines = doc.splitTextToSize(nome, innerW);
  doc.text(nomeLines, cx, y, { align: "center" });
  y += nomeLines.length * (compact ? 3.8 : 5.2) + (compact ? 1 : 2);

  if (categoriaLinha) {
    doc.setFontSize(compact ? 5 : 7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedRgb);
    const catLines = doc.splitTextToSize(categoriaLinha, innerW);
    doc.text(catLines, cx, y, { align: "center" });
    y += catLines.length * (compact ? 3 : 3.8) + (compact ? 2 : 3);
  }

  const qrFramePad = compact ? 2 : 4;
  const qrMax = compact
    ? innerW - 4
    : Math.min(innerW - 6, opts.cardH * 0.42, 62);
  const qrSize = Math.max(qrMax, compact ? 28 : 40);
  const frameSize = qrSize + qrFramePad * 2;
  const frameX = cx - frameSize / 2;
  const frameY = y;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...brandRgb);
  doc.setLineWidth(compact ? 0.3 : 0.5);
  doc.roundedRect(frameX, frameY, frameSize, frameSize, 2, 2, "FD");

  doc.addImage(
    qrDataUrl,
    "PNG",
    frameX + qrFramePad,
    frameY + qrFramePad,
    qrSize,
    qrSize,
    undefined,
    "FAST"
  );

  y += frameSize + (compact ? 3 : 5);

  doc.setFontSize(compact ? 5.5 : 7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandRgb);
  const instrLines = doc.splitTextToSize(QR_PDF_COPY.instruction, innerW);
  doc.text(instrLines, cx, y, { align: "center" });
}

/**
 * Layout premium completo (mesa, A5, display, A4, quadrado).
 * @param {import('jspdf').jsPDF} doc
 * @param {object} params
 */
function renderFullLayout(doc, params) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  const brandLightRgb = hexToRgb(QR_PDF_THEME.brandLight);
  const whiteRgb = hexToRgb(QR_PDF_THEME.white);

  drawVerticalGradient(doc, 0, 0, pageW, pageH, brandRgb, brandLightRgb);
  drawBackgroundDecor(doc, pageW, pageH);

  const marginX = pageW * 0.07;
  const topPad = pageH * 0.045;
  let y = topPad;

  if (params.logoDataUrl) {
    const logoH = Math.min(pageH * 0.055, 9);
    const logoW = logoH * 1.15;
    doc.addImage(params.logoDataUrl, "PNG", cx - logoW / 2, y, logoW, logoH);
    y += logoH + 2.5;
  } else {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...whiteRgb);
    doc.text("Guia de Bolso", cx, y + 4, { align: "center" });
    y += 8;
  }

  const badgeH = drawBadge(doc, cx, y, QR_PDF_COPY.badge, brandRgb, whiteRgb, 5);
  y += badgeH + (pageH > 120 ? 5 : 3.5);

  const headlineSize = pageH > 120 ? 13 : pageH > 90 ? 11 : 9;
  doc.setFontSize(headlineSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...whiteRgb);
  const headlineLines = doc.splitTextToSize(QR_PDF_COPY.headline, pageW - marginX * 2);
  doc.text(headlineLines, cx, y, { align: "center" });
  y += headlineLines.length * (headlineSize * 0.42) + 2;

  if (pageH > 100) {
    doc.setFontSize(pageH > 140 ? 7.5 : 6.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(230, 240, 236);
    const subLines = doc.splitTextToSize(QR_PDF_COPY.subtitle, pageW - marginX * 2.2);
    doc.text(subLines, cx, y, { align: "center" });
    y += subLines.length * 3.6 + 4;
  } else {
    y += 2;
  }

  const cardW = pageW - marginX * 2;
  const cardY = y;
  const cardH = pageH - cardY - (pageH > 100 ? 28 : 18);

  renderEstablishmentCard(doc, {
    cardX: marginX,
    cardY,
    cardW,
    cardH,
    pageW,
    pageH,
    nome: params.nome,
    categoriaLinha: params.categoriaLinha,
    qrDataUrl: params.qrDataUrl,
    ehParceiro: params.ehParceiro,
    fotoDataUrl: params.fotoDataUrl,
    compact: false,
  });

  const footerY = pageH - (pageH > 120 ? 22 : 14);

  if (pageH > 100) {
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(210, 225, 218);
    const instLines = doc.splitTextToSize(QR_PDF_COPY.institutional, pageW - marginX * 2);
    doc.text(instLines, cx, footerY - 10, { align: "center" });
  }

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.15);
  doc.setGState(doc.GState({ opacity: 0.35 }));
  const lineW = Math.min(pageW * 0.35, 40);
  doc.line(cx - lineW / 2, footerY - 3, cx + lineW / 2, footerY - 3);
  doc.setGState(doc.GState({ opacity: 1 }));

  doc.setFontSize(pageH > 100 ? 7.5 : 6);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...whiteRgb);
  doc.text(QR_PDF_COPY.footer, cx, footerY + 2, { align: "center" });

  if (params.siteDomain && pageH > 90) {
    doc.setFontSize(5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(190, 210, 202);
    doc.text(params.siteDomain, cx, footerY + 6.5, { align: "center" });
  }
}

/**
 * Layout compacto para adesivos pequenos.
 * @param {import('jspdf').jsPDF} doc
 * @param {object} params
 */
function renderCompactLayout(doc, params) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  const brandLightRgb = hexToRgb(QR_PDF_THEME.brandLight);
  const whiteRgb = hexToRgb(QR_PDF_THEME.white);

  drawVerticalGradient(doc, 0, 0, pageW, pageH, brandRgb, brandLightRgb);

  let y = 3;
  if (params.logoDataUrl) {
    const logoH = 4.5;
    const logoW = logoH * 1.1;
    doc.addImage(params.logoDataUrl, "PNG", cx - logoW / 2, y, logoW, logoH);
    y += logoH + 1.5;
  } else {
    doc.setFontSize(5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...whiteRgb);
    doc.text("Guia de Bolso", cx, y + 2.5, { align: "center" });
    y += 4;
  }

  const cardPad = 3;
  const cardW = pageW - cardPad * 2;
  const cardY = y;
  const cardH = pageH - cardY - 3;

  renderEstablishmentCard(doc, {
    cardX: cardPad,
    cardY,
    cardW,
    cardH,
    pageW,
    pageH,
    nome: params.nome,
    categoriaLinha: params.categoriaLinha,
    qrDataUrl: params.qrDataUrl,
    ehParceiro: false,
    fotoDataUrl: null,
    compact: true,
  });
}

/**
 * Renderiza cartaz premium no documento jsPDF.
 * @param {import('jspdf').jsPDF} doc
 * @param {{
 *   nome: string,
 *   categoria?: string,
 *   subcategoria?: string,
 *   slug: string,
 *   qrDataUrl: string,
 *   siteUrl: string,
 *   ehParceiro?: boolean,
 *   logoDataUrl?: string|null,
 *   fotoDataUrl?: string|null,
 *   format?: string,
 * }} params
 */
export function renderPremiumQrPdf(doc, params) {
  const format = resolveQrPdfFormat(params.format);
  const categoriaLinha = formatCategoriaLinha(params.categoria, params.subcategoria);
  const siteDomain = getSiteDisplayDomain(params.siteUrl);

  const renderParams = {
    nome: params.nome,
    categoriaLinha,
    qrDataUrl: params.qrDataUrl,
    ehParceiro: Boolean(params.ehParceiro),
    logoDataUrl: params.logoDataUrl,
    fotoDataUrl: params.fotoDataUrl,
    siteDomain,
  };

  if (format.compact) {
    renderCompactLayout(doc, renderParams);
    return;
  }

  renderFullLayout(doc, renderParams);
}
