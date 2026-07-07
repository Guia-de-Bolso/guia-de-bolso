import { buildAppleAppSiteAssociation } from "@/lib/appLinks";

export const dynamic = "force-static";

/**
 * iOS Universal Links — apple-app-site-association.
 * @returns {import("next/server").NextResponse}
 */
export function GET() {
  return Response.json(buildAppleAppSiteAssociation(), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
