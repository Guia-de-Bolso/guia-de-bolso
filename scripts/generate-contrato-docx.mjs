/**
 * Gera contratos parceiro (.docx) prontos para impressão e Google Docs.
 * Exclui instruções internas, referências a arquivos e avisos de revisão.
 *
 * Uso:
 *   node scripts/generate-contrato-docx.mjs
 *   node scripts/generate-contrato-docx.mjs [caminho-saida.docx] [caminho-entrada.md]
 */
import fs from "fs";
import path from "path";
import {
  AlignmentType,
  Document,
  Footer,
  Header,
  HeadingLevel,
  PageBreak,
  PageNumber,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "docx";

const ROOT = process.cwd();

const PRESETS = {
  pago: {
    md: "docs/contratos/MODELO-CONTRATO-PARCEIRO-GUIA-DE-BOLSO.md",
    out: "docs/contratos/MODELO-CONTRATO-PARCEIRO-GUIA-DE-BOLSO.docx",
    header: "Guia de Bolso — Contrato Parceiro",
    coverTitle: "Guia de Bolso",
    coverSubtitle: "Proposta Comercial e Contrato de Parceria",
    coverLine: "Plano Parceiro — Imbituba/SC",
    coverVersion: "Versão 1.1 · 2026",
    mergeAnnexesFromPago: false,
  },
  "6meses": {
    md: "docs/contratos/MODELO-CONTRATO-PARCEIRO-6-MESES-GRATIS.md",
    out: "docs/contratos/MODELO-CONTRATO-PARCEIRO-6-MESES-GRATIS.docx",
    header: "Guia de Bolso — Parceiro 6 meses grátis",
    coverTitle: "Guia de Bolso",
    coverSubtitle: "Programa Parceiro de Lançamento",
    coverLine: "6 meses grátis · sem compromisso de pagamento",
    coverVersion: "Versão 1.0 · 2026",
    mergeAnnexesFromPago: true,
  },
};

/** @param {string[]} argv */
function resolvePaths(argv) {
  const args = argv.slice(2);
  if (args.length === 0) {
    const p = PRESETS.pago;
    return { mdPath: path.join(ROOT, p.md), output: path.join(ROOT, p.out), preset: p };
  }

  const mdArg = args.find((a) => a.endsWith(".md"));
  const docxArg = args.find((a) => a.endsWith(".docx") || a.endsWith(".doc"));

  if (mdArg?.includes("6-MESES") || mdArg?.includes("6-MESES-GRATIS")) {
    const p = PRESETS["6meses"];
    return {
      mdPath: path.isAbsolute(mdArg) ? mdArg : path.join(ROOT, mdArg),
      output: docxArg
        ? path.isAbsolute(docxArg)
          ? docxArg
          : path.join(ROOT, docxArg)
        : path.join(ROOT, p.out),
      preset: p,
    };
  }

  if (mdArg) {
    const p = mdArg.includes("6-MESES") ? PRESETS["6meses"] : PRESETS.pago;
    return {
      mdPath: path.isAbsolute(mdArg) ? mdArg : path.join(ROOT, mdArg),
      output: docxArg
        ? path.isAbsolute(docxArg)
          ? docxArg
          : path.join(ROOT, docxArg)
        : path.join(ROOT, p.out),
      preset: p,
    };
  }

  if (docxArg?.includes("6-MESES")) {
    const p = PRESETS["6meses"];
    return {
      mdPath: path.join(ROOT, p.md),
      output: path.isAbsolute(docxArg) ? docxArg : path.join(ROOT, docxArg),
      preset: p,
    };
  }

  const p = PRESETS.pago;
  return {
    mdPath: path.join(ROOT, p.md),
    output: docxArg
      ? path.isAbsolute(docxArg)
        ? docxArg
        : path.join(ROOT, docxArg)
      : path.join(ROOT, p.out),
    preset: p,
  };
}

const { mdPath: MD_PATH, output: OUTPUT, preset: PRESET } = resolvePaths(process.argv);

const GREEN = "1A4A3A";
const GRAY = "5A6B66";
const GRAY_LIGHT = "F0F4F3";
const FONT = "Arial";

/** @param {string} text @param {object} [opts] */
function run(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? 22,
    bold: opts.bold,
    color: opts.color ?? GRAY,
    italics: opts.italics,
    underline: opts.underline ? {} : undefined,
  });
}

/** @param {import('docx').ParagraphChild[]} children @param {object} [opts] */
function para(children, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.after ?? 120, before: opts.before ?? 0 },
    alignment: opts.alignment,
    children,
  });
}

/** @param {string} md @param {string} start @param {string|null} end */
function extractSection(md, start, end) {
  const startIdx = md.indexOf(start);
  if (startIdx < 0) return "";
  const from = startIdx;
  const to = end ? md.indexOf(end, from + start.length) : md.length;
  if (to < 0) return md.slice(from).trim();
  return md.slice(from, to).trim();
}

/** @param {string} line */
function isInternalLine(line) {
  const t = line.trim();
  if (!t) return false;
  if (t.startsWith("> ")) return true;
  if (/^## Instruções/i.test(t)) return true;
  if (/Documento para impressão/i.test(t)) return true;
  if (/Aviso legal/i.test(t)) return true;
  if (/advogado/i.test(t)) return true;
  if (/`docs\//.test(t) || /`MODELO-CONTRATO/.test(t)) return true;
  if (/\.md[`\)]/.test(t)) return true;
  if (/^\*Anexos II e III:/i.test(t)) return true;
  if (/^\*Fim do documento/i.test(t)) return true;
  if (t === "<br/>" || t === "<br>") return true;
  if (t.startsWith("**Proposta nº** `[Nº DA PROPOSTA]`")) return true;
  if (t.startsWith("**Versão do documento:**")) return true;
  return false;
}

/**
 * Prepara markdown apenas com conteúdo para impressão (a partir da Parte 1).
 * @param {string} md
 * @param {typeof PRESETS.pago} preset
 */
function preparePrintMarkdown(md, preset) {
  const partIdx = md.indexOf("# PARTE 1");
  if (partIdx < 0) return md;

  let printMd = md.slice(partIdx);

  printMd = printMd.replace(/\*Anexos II e III:[\s\S]*$/m, "").trim();
  printMd = printMd.replace(/\*Fim do documento[\s\S]*$/m, "").trim();

  if (preset.mergeAnnexesFromPago) {
    const pagoPath = path.join(ROOT, PRESETS.pago.md);
    const pagoMd = fs.readFileSync(pagoPath, "utf8");
    const anexoII = extractSection(pagoMd, "# ANEXO II", "# ANEXO III");
    const anexoIII = extractSection(pagoMd, "# ANEXO III", "*Fim do documento");
    printMd = `${printMd}\n\n---\n\n${anexoII}\n\n---\n\n${anexoIII}`;
  }

  return printMd;
}

/** @param {string} line */
function parseInline(line) {
  const runs = [];
  const pattern =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|__[^_]+__|\[[^\]]+\]\([^)]+\)|\[[^\]]+\]|https?:\/\/[^\s,)]+|[^*\[`_]+|\*+)/g;

  for (const match of line.matchAll(pattern)) {
    const chunk = match[0];
    if (!chunk) continue;

    if (chunk.startsWith("**") && chunk.endsWith("**")) {
      runs.push(run(chunk.slice(2, -2), { bold: true, color: "1A2E28" }));
    } else if (chunk.startsWith("*") && chunk.endsWith("*") && chunk.length > 2) {
      runs.push(run(chunk.slice(1, -1), { italics: true }));
    } else if (chunk.startsWith("__") && chunk.endsWith("__")) {
      runs.push(run(chunk.slice(2, -2), { underline: true }));
    } else if (chunk.startsWith("`") && chunk.endsWith("`")) {
      runs.push(run(chunk.slice(1, -1), { size: 20 }));
    } else if (/^\[[^\]]+\]\([^)]+\)$/.test(chunk)) {
      const label = chunk.match(/^\[([^\]]+)\]/)?.[1] ?? chunk;
      runs.push(run(label, { color: GREEN, underline: true }));
    } else if (/^\[[^\]]+\]$/.test(chunk)) {
      runs.push(run(chunk.slice(1, -1)));
    } else if (/^https?:\/\//.test(chunk)) {
      runs.push(run(chunk, { color: GREEN, underline: true, size: 20 }));
    } else {
      runs.push(run(chunk.replace(/<\/?sup>/g, "")));
    }
  }

  return runs.length ? runs : [run(line)];
}

/** @param {string} cell */
function cellParagraph(cell) {
  const cleaned = cell.replace(/\*\*/g, "").trim();
  return new Paragraph({
    spacing: { after: 40, before: 40 },
    children: parseInline(cleaned),
  });
}

/** @param {string[]} lines @param {number} start */
function readTable(lines, start) {
  const rows = [];
  let i = start;
  while (i < lines.length && lines[i].trim().startsWith("|")) {
    const cells = lines[i]
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (!cells.every((c) => /^[-:]+$/.test(c))) {
      rows.push(cells);
    }
    i++;
  }
  return { rows, next: i };
}

/** @param {string[][]} rows */
function tableFromRows(rows) {
  if (!rows.length) return para([], { after: 80 });

  const [header, ...bodyRows] = rows;
  const tableRows = [header, ...bodyRows].map((cells, rowIndex) => {
    const isHeader = rowIndex === 0;
    return new TableRow({
      children: cells.map(
        (cell) =>
          new TableCell({
            shading: isHeader
              ? { fill: GRAY_LIGHT, type: ShadingType.CLEAR }
              : undefined,
            verticalAlign: VerticalAlign.CENTER,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [cellParagraph(cell)],
          })
      ),
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows,
  });
}

/** @param {string} md */
function mdToDocxChildren(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  /** @type {import('docx').FileChild[]} */
  const blocks = [];
  let i = 0;
  let inCenter = false;
  let listItems = [];
  let listType = null;
  let olCounter = 0;
  let skipCapa = true;

  function flushList() {
    if (!listItems.length) return;
    for (const [idx, item] of listItems.entries()) {
      const prefix =
        listType === "ol" ? `${idx + 1}. ` : "• ";
      blocks.push(
        para(
          [
            run(prefix, { bold: true, color: GREEN }),
            ...parseInline(item),
          ],
          { after: 80 }
        )
      );
    }
    listItems = [];
    listType = null;
    olCounter = 0;
  }

  while (i < lines.length) {
    const raw = lines[i];
    const line = raw.trim();

    if (isInternalLine(line)) {
      i++;
      continue;
    }

    if (line === '<div align="center">') {
      flushList();
      inCenter = true;
      i++;
      continue;
    }
    if (line === "</div>") {
      inCenter = false;
      i++;
      continue;
    }

    if (!line) {
      flushList();
      i++;
      continue;
    }

    if (line.startsWith("|")) {
      flushList();
      const { rows, next } = readTable(lines, i);
      blocks.push(tableFromRows(rows));
      blocks.push(para([], { after: 120 }));
      i = next;
      continue;
    }

    if (/^-\s/.test(line) || /^-\s*\[\s?\]/.test(line)) {
      listType = "ul";
      listItems.push(line.replace(/^-\s*(\[\s?\]\s*)?/, ""));
      i++;
      continue;
    }

    if (/^\d+\.\s/.test(line)) {
      if (listType !== "ol") flushList();
      listType = "ol";
      listItems.push(line.replace(/^\d+\.\s*/, ""));
      i++;
      continue;
    }

    flushList();

    if (line === "---") {
      blocks.push(
        new Paragraph({
          spacing: { before: 200, after: 200 },
          border: {
            bottom: { color: GREEN, size: 6, style: "single" },
          },
          children: [],
        })
      );
      i++;
      continue;
    }

    if (line.startsWith("# ")) {
      const text = line.slice(2).replace(/\*\*/g, "");
      const isMajorBreak =
        text.startsWith("PARTE ") ||
        text.startsWith("ANEXO ") ||
        text.includes("CONTRATO DE PRESTAÇÃO");
      if (isMajorBreak) {
        blocks.push(new Paragraph({ children: [new PageBreak()] }));
      }
      blocks.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: inCenter ? AlignmentType.CENTER : undefined,
          spacing: { before: 280, after: 200 },
          children: [run(text, { size: 32, bold: true, color: GREEN })],
        })
      );
      i++;
      continue;
    }

    if (line.startsWith("## ")) {
      const title = line.slice(3).replace(/\*\*/g, "");
      if (skipCapa && title === "Capa") {
        i++;
        while (i < lines.length) {
          const inner = lines[i].trim();
          if (inner.startsWith("## ") || inner.startsWith("# ")) break;
          if (inner === "---") {
            i++;
            break;
          }
          i++;
        }
        continue;
      }
      blocks.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 140 },
          children: [run(title, { size: 26, bold: true, color: GREEN })],
        })
      );
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_3,
          spacing: { before: 200, after: 120 },
          children: [
            run(line.slice(4).replace(/\*\*/g, ""), {
              size: 24,
              bold: true,
              color: GREEN,
            }),
          ],
        })
      );
      i++;
      continue;
    }

    blocks.push(
      para(parseInline(line), {
        after: 140,
        alignment: inCenter ? AlignmentType.CENTER : undefined,
      })
    );
    i++;
  }

  flushList();
  return blocks;
}

function buildCoverBlock() {
  return [
    para([], { after: 800 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [run(PRESET.coverTitle, { size: 56, bold: true, color: GREEN })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [run(PRESET.coverSubtitle, { size: 30, color: GRAY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [run(PRESET.coverLine, { size: 24, color: GRAY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 480 },
      children: [run(PRESET.coverVersion, { size: 22, color: GRAY, italics: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        run("Proposta nº ", { size: 24, color: GRAY }),
        run("___________", { size: 24, underline: true }),
        run(" /2026", { size: 24, color: GRAY }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [run("Imbituba, Santa Catarina", { size: 22, color: GRAY })],
    }),
    para([], { after: 200 }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        run("Estabelecimento: ", { size: 22, color: GRAY }),
        run("_______________________________________________", {
          size: 22,
          underline: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        run("Data: ", { size: 22, color: GRAY }),
        run("____ / ____ / __________", { size: 22, underline: true }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [
        run("Validade desta proposta: 30 dias a partir da data acima", {
          size: 20,
          color: GRAY,
          italics: true,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        run("guiadebolso.app · contato@guiadebolso.app", {
          size: 22,
          color: GREEN,
          bold: true,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

const md = fs.readFileSync(MD_PATH, "utf8");
const printMd = preparePrintMarkdown(md, PRESET);

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 22, color: GRAY },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            para([run(PRESET.header, { size: 16, color: GREEN, italics: true })], {
              after: 0,
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                run("Página ", { size: 18, color: GRAY }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT,
                  size: 18,
                  color: GRAY,
                }),
              ],
            }),
          ],
        }),
      },
      children: [...buildCoverBlock(), ...mdToDocxChildren(printMd)],
    },
  ],
});

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
const buffer = await Packer.toBuffer(doc);
fs.writeFileSync(OUTPUT, buffer);
console.log(`Documento gerado: ${OUTPUT} (${(buffer.length / 1024).toFixed(1)} KB)`);
