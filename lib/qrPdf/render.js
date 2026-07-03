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
  badge: "Guia de Bolso",
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
 * Fundo premium do adesivo: papel leve + "bolas" da marca mais presentes,
 * emoldurando o cartão branco central sem interferir no QR.
 * @param {import('jspdf').jsPDF} doc
 * @param {number} pageW
 * @param {number} pageH
 */
function drawStickerBackground(doc, pageW, pageH) {
  const paperRgb = hexToRgb(QR_PDF_THEME.paper);
  doc.setFillColor(...paperRgb);
  doc.rect(0, 0, pageW, pageH, "F");

  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  const brandLightRgb = hexToRgb(QR_PDF_THEME.brandLight);

  // Bolas maiores da marca (verde escuro) nas diagonais.
  doc.setGState(doc.GState({ opacity: 0.16 }));
  doc.setFillColor(...brandRgb);
  doc.circle(pageW * 0.02, pageH * 0.03, pageW * 0.2, "F");
  doc.circle(pageW * 0.99, pageH * 0.98, pageW * 0.2, "F");

  // Bolas maiores da marca (verde claro) nas outras diagonais.
  doc.setGState(doc.GState({ opacity: 0.12 }));
  doc.setFillColor(...brandLightRgb);
  doc.circle(pageW * 1.0, pageH * 0.05, pageW * 0.13, "F");
  doc.circle(pageW * 0.0, pageH * 0.97, pageW * 0.13, "F");

  // Bolas menores em verde claro da marca, aninhadas nas maiores.
  doc.setGState(doc.GState({ opacity: 0.22 }));
  doc.setFillColor(...brandLightRgb);
  doc.circle(pageW * 0.09, pageH * 0.12, pageW * 0.05, "F");
  doc.circle(pageW * 0.91, pageH * 0.88, pageW * 0.05, "F");

  doc.setGState(doc.GState({ opacity: 1 }));
}

/**
 * Pílula da marca com logo + texto, ou só texto se não houver logo.
 * @param {import('jspdf').jsPDF} doc
 * @param {number} cx
 * @param {number} y
 * @param {string|null|undefined} logoDataUrl
 * @returns {number} altura do bloco
 */
function drawBrandHeader(doc, cx, y, logoDataUrl) {
  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  const label = "Guia de Bolso";
  const fontSize = 4.8;
  const charSpace = 0.15;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  const textW = doc.getTextWidth(label) + charSpace * Math.max(label.length - 1, 0);

  const logoH = 4.2;
  const logoW = logoDataUrl ? logoH * 1.05 : 0;
  const logoGap = logoDataUrl ? 1.6 : 0;
  const padX = fontSize * 0.85;
  const pillH = fontSize * 1.75;
  const pillW = padX * 2 + logoW + logoGap + textW;

  doc.setFillColor(...brandRgb);
  doc.roundedRect(cx - pillW / 2, y, pillW, pillH, pillH / 2, pillH / 2, "F");

  const centerY = y + pillH / 2;
  // Baseline centralizada verticalmente (metade da altura de capitular em mm).
  const baselineY = centerY + fontSize * 0.352778 * 0.35;

  let textX = cx;
  if (logoDataUrl) {
    const logoX = cx - pillW / 2 + padX;
    const logoY = centerY - logoH / 2;
    doc.addImage(logoDataUrl, "PNG", logoX, logoY, logoW, logoH);
    textX = logoX + logoW + logoGap + textW / 2;
  }

  doc.setTextColor(255, 255, 255);
  doc.text(label, textX, baselineY, { align: "center", charSpace });
  return pillH;
}

/**
 * Selo dourado "Parceiro oficial" — compacto para o adesivo.
 * @param {import('jspdf').jsPDF} doc
 * @param {number} cx
 * @param {number} y
 * @returns {number} altura do selo
 */
function drawParceiroBadge(doc, cx, y) {
  const goldRgb = hexToRgb(QR_PDF_THEME.gold);
  const goldBgRgb = hexToRgb(QR_PDF_THEME.goldBg);
  const fontSize = 4.2;
  const label = QR_PDF_COPY.parceiroBadge;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(fontSize);
  const textW = doc.getTextWidth(label);
  const padX = fontSize * 0.9;
  const badgeW = textW + padX * 2;
  const badgeH = fontSize * 1.65;

  doc.setFillColor(...goldBgRgb);
  doc.setDrawColor(...goldRgb);
  doc.setLineWidth(0.28);
  doc.roundedRect(cx - badgeW / 2, y, badgeW, badgeH, badgeH / 2, badgeH / 2, "FD");
  doc.setTextColor(...goldRgb);
  doc.text(label, cx, y + badgeH * 0.72, { align: "center" });
  return badgeH;
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
 * Layout premium do adesivo pequeno (8×8 cm) — QR em destaque, marca no topo.
 * @param {import('jspdf').jsPDF} doc
 * @param {object} params
 */
function renderCompactLayout(doc, params) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const cx = pageW / 2;

  const brandRgb = hexToRgb(QR_PDF_THEME.brand);
  const inkRgb = hexToRgb(QR_PDF_THEME.ink);
  const mutedRgb = hexToRgb(QR_PDF_THEME.muted);

  drawStickerBackground(doc, pageW, pageH);

  const pad = 6;
  const innerW = pageW - pad * 2;
  const contentTop = pad;
  const contentBottom = pageH - pad;

  let y = contentTop;

  // Marca no topo — logo + "Guia de Bolso" na pílula verde.
  const brandH = drawBrandHeader(doc, cx, y, params.logoDataUrl);
  y += brandH + 2.4;

  // Selo dourado para parceiros oficiais.
  if (params.ehParceiro) {
    const parceiroH = drawParceiroBadge(doc, cx, y);
    y += parceiroH + 2.2;
  }

  // Nome do estabelecimento.
  const nomeSize = 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(nomeSize);
  doc.setTextColor(...inkRgb);
  const nomeLines = doc.splitTextToSize(params.nome, innerW);
  const nomeLineH = 4.2;
  doc.text(nomeLines, cx, y + nomeLineH * 0.6, { align: "center" });
  y += nomeLines.length * nomeLineH;

  // Categoria.
  if (params.categoriaLinha) {
    const catSize = 5.2;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(catSize);
    doc.setTextColor(...mutedRgb);
    const catLines = doc.splitTextToSize(params.categoriaLinha, innerW);
    y += 0.6;
    doc.text(catLines, cx, y + 1.9, { align: "center" });
    y += catLines.length * 2.9;
  }

  // Rodapé enxuto ancorado na base (instrução + domínio).
  const domain = QR_PDF_COPY.appDomain || params.siteDomain;
  const domainH = domain ? 3.6 : 0;
  const instrSize = 5.4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(instrSize);
  const instrLines = doc.splitTextToSize(QR_PDF_COPY.instruction, innerW);
  const instrH = instrLines.length * 3;
  const footerH = instrH + (domain ? 1.6 + domainH : 0);
  const footerTop = contentBottom - footerH;

  // QR em destaque, ocupando o miolo disponível.
  const qrTop = y + 3;
  const qrRegionH = footerTop - qrTop - 3;
  const framePad = 2.8;
  const frameSize = Math.min(innerW, qrRegionH);
  const frameX = cx - frameSize / 2;
  const frameY = qrTop + Math.max(0, (qrRegionH - frameSize) / 2);

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...brandRgb);
  doc.setLineWidth(0.6);
  doc.roundedRect(frameX, frameY, frameSize, frameSize, 3.2, 3.2, "FD");
  doc.addImage(
    params.qrDataUrl,
    "PNG",
    frameX + framePad,
    frameY + framePad,
    frameSize - framePad * 2,
    frameSize - framePad * 2,
    undefined,
    "FAST"
  );

  // Instrução (destaque) e domínio.
  doc.setFont("helvetica", "bold");
  doc.setFontSize(instrSize);
  doc.setTextColor(...brandRgb);
  doc.text(instrLines, cx, footerTop + 2.4, { align: "center" });

  if (domain) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.9);
    doc.setTextColor(...mutedRgb);
    doc.text(domain, cx, footerTop + instrH + 1.6 + 2.6, { align: "center" });
  }
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
