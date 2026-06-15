import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Guia de Bolso Imbituba — guia turístico de Imbituba, SC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Imagem OG padrão (PNG) — turismo em Imbituba, desambiguação visual.
 * @returns {Promise<ImageResponse>}
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 72,
          background: "linear-gradient(135deg, #e8f4f8 0%, #f5ebe0 45%, #e2f0e8 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            color: "#1a4a3a",
            marginBottom: 16,
          }}
        >
          Turismo · Imbituba · SC
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 700,
            color: "#1a2e28",
            lineHeight: 1.1,
            maxWidth: 900,
          }}
        >
          Guia de Bolso Imbituba
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 34,
            color: "#1a4a3a",
            marginTop: 20,
            maxWidth: 880,
          }}
        >
          Praias · Gastronomia · Atrativos · Busca com IA
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 22,
            color: "#5a6b66",
            marginTop: 28,
            maxWidth: 900,
          }}
        >
          App de turismo local — não é o Guiabolso de finanças
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 40,
            width: 360,
            height: 12,
            borderRadius: 6,
            background: "linear-gradient(90deg, #0d5c7a, #1a4a3a)",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
