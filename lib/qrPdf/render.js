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
  appDomain: "app.guiadebolso.app",
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
 * Fundo branco com detalhes discretos da marca (sem interferir no QR).
 * @param {import('jspdf').jsPDF} doc
 * @param {number} pageW
 * @param {number} pageH
 */
function drawWhiteBackground(doc, pageW, pageH) {
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageW, pageH, "F");

  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  doc.setFillColor(brandRgb[0], brandRgb[1], brandRgb[2]);
  doc.setGState(doc.GState({ opacity: 0.04 }));
  doc.circle(pageW * 0.1, pageH * 0.06, pageW * 0.18, "F");
  doc.circle(pageW * 0.92, pageH * 0.14, pageW * 0.12, "F");
  doc.circle(pageW * 0.85, pageH * 0.9, pageW * 0.16, "F");
  doc.setGState(doc.GState({ opacity: 1 }));
}

/**
 * @param {import('jspdf').jsPDF} doc
 * @param {number} cx
 * @param {number} y
 * @param {string} label
 * @param {[number, number, number]} textRgb
 * @param {[number, number, number]} borderRgb
 * @param {[number, number, number]} [fillRgb]
 * @param {number} fontSize
 * @returns {number} altura do badge
 */
function drawBadge(doc, cx, y, label, textRgb, borderRgb, fillRgb, fontSize) {
  const badgeW = Math.min(Math.max(label.length * fontSize * 0.42, 28), 56);
  const badgeH = fontSize + 3.2;
  if (fillRgb) {
    doc.setFillColor(...fillRgb);
  } else {
    doc.setFillColor(255, 255, 255);
  }
  doc.setDrawColor(...borderRgb);
  doc.setLineWidth(0.25);
  doc.roundedRect(cx - badgeW / 2, y, badgeW, badgeH, badgeH / 2, badgeH / 2, "FD");
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...textRgb);
  doc.text(label, cx, y + badgeH * 0.72, { align: "center" });
  return badgeH;
}

/**
 * Mede altura do bloco de texto centralizado.
 * @param {import('jspdf').jsPDF} doc
 * @param {string[]} lines
 * @param {number} lineHeight
 * @returns {number}
 */
function measureTextBlock(lines, lineHeight) {
  return Math.max(lines.length, 1) * lineHeight;
}

/**
 * Card branco com nome, categoria, QR Code e instrução.
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
 *   compact?: boolean,
 * }} opts
 * @returns {number} y final dentro do card
 */
function renderEstablishmentCard(doc, opts) {
  const {
    cardX,
    cardY,
    cardW,
    cardH,
    pageW,
    nome,
    categoriaLinha,
    qrDataUrl,
    ehParceiro,
    compact = false,
  } = opts;

  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  const inkRgb = hexToRgb(QR_PDF_THEME.ink);
  const mutedRgb = hexToRgb(QR_PDF_THEME.muted);
  const goldRgb = hexToRgb(QR_PDF_THEME.gold);
  const goldBgRgb = hexToRgb(QR_PDF_THEME.goldBg);
  const borderRgb = hexToRgb(QR_PDF_THEME.border);
  const badgeBgRgb = hexToRgb(QR_PDF_THEME.borderSoft);
  const cx = pageW / 2;

  const pad = compact ? 3.5 : 6;
  const innerW = cardW - pad * 2;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...borderRgb);
  doc.setLineWidth(0.3);
  doc.roundedRect(cardX, cardY, cardW, cardH, compact ? 2.5 : 4, compact ? 2.5 : 4, "FD");

  const nomeSize = compact ? 7.5 : 11;
  const catSize = compact ? 5 : 6.5;
  const instrSize = compact ? 5 : 6.5;
  const nomeLineH = compact ? 3.4 : 4.8;
  const catLineH = compact ? 2.8 : 3.4;
  const instrLineH = compact ? 2.8 : 3.2;
  const qrFramePad = compact ? 2 : 3.5;

  doc.setFontSize(nomeSize);
  doc.setFont("helvetica", "bold");
  const nomeLines = doc.splitTextToSize(nome, innerW);

  let catLines = [];
  if (categoriaLinha) {
    doc.setFontSize(catSize);
    doc.setFont("helvetica", "normal");
    catLines = doc.splitTextToSize(categoriaLinha, innerW);
  }

  doc.setFontSize(instrSize);
  doc.setFont("helvetica", "bold");
  const instrLines = doc.splitTextToSize(QR_PDF_COPY.instruction, innerW);

  const partnerBadgeH = ehParceiro && !compact ? 8.2 : 0;
  const partnerGap = partnerBadgeH ? 3 : 0;
  const nomeH = measureTextBlock(nomeLines, nomeLineH);
  const catH = catLines.length ? measureTextBlock(catLines, catLineH) + (compact ? 1.5 : 2) : 0;
  const instrH = measureTextBlock(instrLines, instrLineH);
  const gaps = (compact ? 2 : 3) + (catLines.length ? (compact ? 1.5 : 2) : 0) + (compact ? 2 : 3);

  const fixedH =
    pad * 2 + partnerBadgeH + partnerGap + nomeH + catH + instrH + gaps + qrFramePad * 2;
  const qrMax = Math.max(
    compact ? 24 : 34,
    Math.min(innerW - 4, cardH - fixedH, compact ? 42 : 72)
  );
  const frameSize = qrMax + qrFramePad * 2;

  let y = cardY + pad;

  if (partnerBadgeH) {
    const badgeH = drawBadge(
      doc,
      cx,
      y,
      QR_PDF_COPY.parceiroBadge,
      goldRgb,
      goldRgb,
      goldBgRgb,
      5
    );
    y += badgeH + partnerGap;
  }

  doc.setFontSize(nomeSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...inkRgb);
  doc.text(nomeLines, cx, y, { align: "center" });
  y += nomeH + (compact ? 1.5 : 2);

  if (catLines.length) {
    doc.setFontSize(catSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedRgb);
    doc.text(catLines, cx, y, { align: "center" });
    y += catH;
  }

  y += compact ? 1.5 : 2.5;

  const frameX = cx - frameSize / 2;
  const frameY = y;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...brandRgb);
  doc.setLineWidth(compact ? 0.35 : 0.45);
  doc.roundedRect(frameX, frameY, frameSize, frameSize, 2, 2, "FD");

  doc.addImage(
    qrDataUrl,
    "PNG",
    frameX + qrFramePad,
    frameY + qrFramePad,
    qrMax,
    qrMax,
    undefined,
    "FAST"
  );

  y += frameSize + (compact ? 2.5 : 3.5);

  doc.setFontSize(instrSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandRgb);
  doc.text(instrLines, cx, y, { align: "center" });

  return y + instrH;
}

/**
 * Rodapé institucional — sempre abaixo do card, nunca sobre o QR.
 * @param {import('jspdf').jsPDF} doc
 * @param {number} pageW
 * @param {number} pageH
 * @param {number} footerTopY
 * @param {string} siteDomain
 * @param {boolean} [compact]
 */
function renderFooter(doc, pageW, pageH, footerTopY, siteDomain, compact = false) {
  const cx = pageW / 2;
  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  const mutedRgb = hexToRgb(QR_PDF_THEME.muted);
  const borderRgb = hexToRgb(QR_PDF_THEME.border);
  const marginX = pageW * 0.08;

  const footerY = Math.max(footerTopY + (compact ? 2 : 4), pageH - (compact ? 12 : 16));

  doc.setDrawColor(...borderRgb);
  doc.setLineWidth(0.2);
  const lineW = Math.min(pageW - marginX * 2, 52);
  doc.line(cx - lineW / 2, footerY, cx + lineW / 2, footerY);

  doc.setFontSize(compact ? 5.5 : 7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...brandRgb);
  doc.text(QR_PDF_COPY.footer, cx, footerY + (compact ? 4 : 5), { align: "center" });

  const domain = QR_PDF_COPY.appDomain || siteDomain;
  if (domain) {
    doc.setFontSize(compact ? 5 : 5.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedRgb);
    doc.text(domain, cx, footerY + (compact ? 7.5 : 9), { align: "center" });
  }
}

/**
 * Layout premium completo (mesa, A5, display, A4, quadrado).
 * @param {import('jspdf').jsPDF} doc
 * @param {object} params
 */
function renderFullLayout(doc, params) {
  const format = resolveQrPdfFormat(params.format);
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  const inkRgb = hexToRgb(QR_PDF_THEME.ink);
  const mutedRgb = hexToRgb(QR_PDF_THEME.muted);
  const badgeBgRgb = hexToRgb(QR_PDF_THEME.borderSoft);

  drawWhiteBackground(doc, pageW, pageH);

  const marginX = pageW * 0.08;
  const safeTop = pageH * 0.04;
  const footerReserve = pageH > 100 ? 18 : 14;
  let y = safeTop;

  if (params.logoDataUrl) {
    const logoH = Math.min(pageH * 0.065, pageH > 120 ? 11 : 9);
    const logoW = logoH * 1.15;
    doc.addImage(params.logoDataUrl, "PNG", cx - logoW / 2, y, logoW, logoH);
    y += logoH + (pageH > 100 ? 4 : 3);
  } else {
    doc.setFontSize(pageH > 100 ? 10 : 8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandRgb);
    doc.text("Guia de Bolso", cx, y + 4, { align: "center" });
    y += pageH > 100 ? 9 : 7;
  }

  const badgeH = drawBadge(
    doc,
    cx,
    y,
    QR_PDF_COPY.badge,
    brandRgb,
    brandRgb,
    badgeBgRgb,
    pageH > 100 ? 5 : 4.5
  );
  y += badgeH + (pageH > 100 ? 6 : 4);

  const headlineSize = pageH > 140 ? 14 : pageH > 110 ? 12 : pageH > 90 ? 10 : 8.5;
  doc.setFontSize(headlineSize);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...inkRgb);
  const headlineLines = doc.splitTextToSize(QR_PDF_COPY.headline, pageW - marginX * 2);
  doc.text(headlineLines, cx, y, { align: "center" });
  y += measureTextBlock(headlineLines, headlineSize * 0.42) + (pageH > 100 ? 3 : 2);

  if (pageH > 90) {
    const subSize = pageH > 140 ? 7.5 : pageH > 110 ? 7 : 6;
    doc.setFontSize(subSize);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedRgb);
    const subLines = doc.splitTextToSize(QR_PDF_COPY.subtitle, pageW - marginX * 2);
    doc.text(subLines, cx, y, { align: "center" });
    y += measureTextBlock(subLines, subSize * 0.46) + (pageH > 100 ? 6 : 4);
  }

  const cardW = format.cardWidth
    ? Math.min(format.cardWidth, pageW - marginX * 2)
    : pageW - marginX * 2;
  const cardX = (pageW - cardW) / 2;
  const cardGapBelow = pageH > 100 ? 5 : 3;
  const cardY = y;
  const cardH = pageH - footerReserve - cardY - cardGapBelow;

  renderEstablishmentCard(doc, {
    cardX,
    cardY,
    cardW,
    cardH,
    pageW,
    pageH,
    nome: params.nome,
    categoriaLinha: params.categoriaLinha,
    qrDataUrl: params.qrDataUrl,
    ehParceiro: params.ehParceiro,
    compact: false,
  });

  renderFooter(doc, pageW, pageH, cardY + cardH, params.siteDomain, false);
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

  drawWhiteBackground(doc, pageW, pageH);

  let y = 2.5;
  if (params.logoDataUrl) {
    const logoH = 4;
    const logoW = logoH * 1.1;
    doc.addImage(params.logoDataUrl, "PNG", cx - logoW / 2, y, logoW, logoH);
    y += logoH + 1.2;
  } else {
    doc.setFontSize(4.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...brandRgb);
    doc.text("Guia de Bolso", cx, y + 2, { align: "center" });
    y += 3.5;
  }

  const cardPad = 2.5;
  const cardW = pageW - cardPad * 2;
  const cardY = y;
  const cardH = pageH - cardY - 10;

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
    compact: true,
  });

  renderFooter(doc, pageW, pageH, cardY + cardH, params.siteDomain, true);
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
    siteDomain,
    format: params.format,
  };

  if (format.compact) {
    renderCompactLayout(doc, renderParams);
    return;
  }

  renderFullLayout(doc, renderParams);
}
