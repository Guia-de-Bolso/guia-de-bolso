import { buildAssetLinksJson } from "@/lib/appLinks";

export const dynamic = "force-static";

/**
 * Android App Links — verificação de domínio.
 * @returns {import("next/server").NextResponse}
 */
export function GET() {
  return Response.json(buildAssetLinksJson(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
