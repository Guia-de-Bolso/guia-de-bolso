/**
 * Formatos de impressão do cartaz QR (mm).
 * @typedef {{ id: string, label: string, width: number, height: number, cardWidth?: number, compact?: boolean }} QrPdfFormat
 */

/** @type {Record<string, QrPdfFormat>} */
export const QR_PDF_FORMATS = {
  adesivo: {
    id: "adesivo",
    label: "Adesivo pequeno (8×8 cm)",
    width: 80,
    height: 80,
    compact: true,
  },
};

/** @type {QrPdfFormat[]} */
export const QR_PDF_FORMAT_LIST = Object.values(QR_PDF_FORMATS);

/**
 * @param {string} [formatId]
 * @returns {QrPdfFormat}
 */
export function resolveQrPdfFormat(formatId) {
  return QR_PDF_FORMATS[formatId] || QR_PDF_FORMATS.adesivo;
}
