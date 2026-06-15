import { ensurePerfil } from "@/lib/ensurePerfil";
import { APP_AUTH_ORIGIN } from "@/lib/authOrigins";
import { isMarketingHost } from "@/lib/marketingHost";
import { registrarLog } from "@/lib/logs";
import { safeRedirectPath } from "@/lib/safeRedirectPath";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * @param {string} origin
 * @returns {string}
 */
function resolvePostAuthOrigin(origin) {
  try {
    const host = new URL(origin).hostname;
    return isMarketingHost(host) ? APP_AUTH_ORIGIN : origin;
  } catch {
    return APP_AUTH_ORIGIN;
  }
}

/**
 * OAuth callback: exchanges the auth code for a session and redirects on success.
 * @param {import("next/server").NextRequest} request - Request with `code` and optional `next` query params.
 * @returns {Promise<import("next/server").NextResponse>} Redirect to app or login with error.
 */
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await ensurePerfil(supabase, user);
      }
      await registrarLog(supabase, user, "login", {
        provider: user?.app_metadata?.provider,
      });
      const redirectOrigin = resolvePostAuthOrigin(origin);
      return NextResponse.redirect(`${redirectOrigin}${next}`);
    }
  }

  const redirectOrigin = resolvePostAuthOrigin(origin);
  return NextResponse.redirect(`${redirectOrigin}/login?error=auth`);
}
