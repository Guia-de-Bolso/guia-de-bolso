import { jsPDF } from "jspdf";
import { notaParaEstrelas, resumirComentario } from "@/lib/adminRelatorios";

const BRAND = "#1a4a3a";
const MUTED = "#5a6b66";

/**
 * Converte hex para RGB para jsPDF.
 * @param {string} hex
 * @returns {[number, number, number]}
 */
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Gera PDF do relatório de estabelecimento.
 * @param {import("@/lib/adminRelatorios").RelatorioEstabelecimento} relatorio
 * @returns {jsPDF}
 */
export function buildRelatorioPdf(relatorio) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  const brandRgb = hexToRgb(BRAND);
  const mutedRgb = hexToRgb(MUTED);

  doc.setFillColor(...brandRgb);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("Guia de Bolso", margin, 18);

  y = 38;
  doc.setTextColor(...brandRgb);
  doc.setFontSize(14);
  doc.text(relatorio.lugarNome, margin, y);

  y += 8;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...mutedRgb);
  doc.text(`Período: ${relatorio.periodoLabel}`, margin, y);
  if (relatorio.planoTierLabel) {
    y += 6;
    doc.text(`Plano: ${relatorio.planoTierLabel}`, margin, y);
  }

  y += 14;
  const metrics = [
    {
      label: "Visualizações",
      value: String(relatorio.visualizacoes.value),
      sub: relatorio.visualizacoes.variation.text,
    },
    {
      label: "Escaneamentos QR",
      value: String(relatorio.qrScans.value),
      sub: relatorio.qrScans.variation.text,
    },
    {
      label: "IR AGORA",
      value: String(relatorio.irAgora.value),
      sub: relatorio.irAgora.variation.text,
    },
    {
      label: "Favoritos ativos",
      value: String(relatorio.favoritos.value),
      sub: relatorio.favoritos.variation.text,
    },
    {
      label: "Avaliações",
      value: String(relatorio.avaliacoes.value),
      sub:
        relatorio.avaliacoesMedia != null
          ? `Média ${relatorio.avaliacoesMedia} · ${relatorio.avaliacoes.variation.text}`
          : relatorio.avaliacoes.variation.text,
    },
    {
      label: "Pedidos de perfil",
      value: String(relatorio.claimPerfil.value),
      sub: relatorio.claimPerfil.variation.text,
    },
  ];

  const cardW = (pageW - margin * 2 - 6) / 2;
  const cardH = 28;

  metrics.forEach((metric, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = margin + col * (cardW + 6);
    const cardY = y + row * (cardH + 6);

    doc.setDrawColor(227, 233, 230);
    doc.setFillColor(247, 251, 249);
    doc.roundedRect(x, cardY, cardW, cardH, 3, 3, "FD");

    doc.setTextColor(...brandRgb);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(metric.value, x + 5, cardY + 12);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedRgb);
    doc.text(metric.label, x + 5, cardY + 18);

    doc.setFontSize(7);
    const subLines = doc.splitTextToSize(metric.sub, cardW - 10);
    doc.text(subLines, x + 5, cardY + 23);
  });

  y += Math.ceil(metrics.length / 2) * (cardH + 6) + 10;

  if (relatorio.comparativoCategoria) {
    const comp = relatorio.comparativoCategoria;
    doc.setTextColor(...brandRgb);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Comparativo · ${comp.categoria}`, margin, y);
    y += 7;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedRgb);
    doc.text(
      `${comp.totalEstabelecimentos} estabelecimentos na categoria · posição views #${comp.posicaoVisualizacoes} (média ${comp.mediaVisualizacoes}) · IR AGORA #${comp.posicaoIrAgora} (média ${comp.mediaIrAgora})`,
      margin,
      y,
      { maxWidth: pageW - margin * 2 }
    );
    y += 10;
    if (comp.topParceiroVisualizacoes != null) {
      doc.text(
        `Top parceiro: ${comp.topParceiroVisualizacoes} views · ${comp.topParceiroIrAgora} IR AGORA`,
        margin,
        y
      );
      y += 10;
    }
  }

  doc.setTextColor(...brandRgb);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Avaliações aprovadas no período", margin, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(40, 60, 55);

  if (relatorio.avaliacoesLista.length === 0) {
    doc.setTextColor(...mutedRgb);
    doc.text("Nenhuma avaliação aprovada neste período.", margin, y);
    y += 8;
  } else {
    for (const av of relatorio.avaliacoesLista) {
      if (y > 265) {
        doc.addPage();
        y = 20;
      }

      const data = new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/Sao_Paulo",
      }).format(new Date(av.created_at));

      doc.setFont("helvetica", "bold");
      doc.text(`${notaParaEstrelas(av.nota)} · ${data}`, margin, y);
      y += 5;

      doc.setFont("helvetica", "normal");
      const commentLines = doc.splitTextToSize(
        resumirComentario(av.comentario, 500),
        pageW - margin * 2
      );
      doc.text(commentLines, margin, y);
      y += commentLines.length * 4.5 + 6;
    }
  }

  const footerY = doc.internal.pageSize.getHeight() - 12;
  doc.setFontSize(8);
  doc.setTextColor(...mutedRgb);
  doc.text(
    "Guia de Bolso — App oficial de turismo de Imbituba",
    pageW / 2,
    footerY,
    { align: "center" }
  );

  return doc;
}

/**
 * Dispara download do PDF no navegador.
 * @param {import("@/lib/adminRelatorios").RelatorioEstabelecimento} relatorio
 */
export function downloadRelatorioPdf(relatorio) {
  const doc = buildRelatorioPdf(relatorio);
  const safeName = relatorio.lugarNome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  doc.save(`relatorio-guia-de-bolso-${safeName || "estabelecimento"}.pdf`);
}
