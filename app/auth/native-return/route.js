import { NATIVE_OAUTH_CALLBACK } from "@/lib/authOrigins";
import { NextResponse } from "next/server";

/**
 * Ponte OAuth para o app Capacitor.
 * Supabase redireciona aqui (HTTPS, na Custom Tab); esta rota reabre o app via deep link.
 * @param {import("next/server").NextRequest} request
 * @returns {import("next/server").NextResponse}
 */
export function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.toString();
  const deepLink = query ? `${NATIVE_OAUTH_CALLBACK}?${query}` : NATIVE_OAUTH_CALLBACK;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="0;url=${encodeURI(deepLink)}" />
  <title>Guia de Bolso</title>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; min-height: 100dvh;
      align-items: center; justify-content: center; margin: 0; background: #f0f4f3;
      color: #1a2e28; text-align: center; padding: 1.5rem; }
    a { color: #1a4a3a; font-weight: 600; }
  </style>
</head>
<body>
  <div>
    <p>Abrindo o Guia de Bolso…</p>
    <p><a href="${deepLink.replace(/"/g, "&quot;")}">Toque aqui se não abrir automaticamente</a></p>
  </div>
  <script>window.location.replace(${JSON.stringify(deepLink)});</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
