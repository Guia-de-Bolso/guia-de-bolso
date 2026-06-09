import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import {
  getMarketingRouteAction,
  getRequestHostname,
  isMarketingHost,
} from "@/lib/marketingHost";
import { SITE_DOMAIN } from "@/lib/siteContact";
import { SUPABASE_AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookieOptions";

/**
 * @param {import('next/server').NextResponse} response
 * @returns {import('next/server').NextResponse}
 */
function applyPreviewRobots(response) {
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

/**
 * Atualiza cookies de sessão Supabase para evitar logout após expiração do access token.
 * @param {import("next/server").NextRequest} request
 * @returns {Promise<import("next/server").NextResponse>}
 */
async function updateSupabaseSession(request) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return applyPreviewRobots(supabaseResponse);
}

/**
 * Middleware: domínio de marketing (guiadebolso.app) só landing + legal; demais hosts = app completo.
 * @param {import("next/server").NextRequest} request - Incoming request.
 * @returns {Promise<import("next/server").NextResponse>} Response with updated session cookies.
 */
export async function middleware(request) {
  const host = getRequestHostname(request);

  if (host === `www.${SITE_DOMAIN}`) {
    const apex = new URL(request.url);
    apex.host = SITE_DOMAIN;
    return applyPreviewRobots(NextResponse.redirect(apex, 308));
  }

  if (isMarketingHost(host)) {
    const action = getMarketingRouteAction(request.nextUrl.pathname);

    if (action === "redirect-root") {
      return applyPreviewRobots(NextResponse.redirect(new URL("/", request.url), 308));
    }
    if (action === "rewrite-landing") {
      return applyPreviewRobots(NextResponse.rewrite(new URL("/landing", request.url)));
    }
    if (action === "redirect-home") {
      return applyPreviewRobots(NextResponse.redirect(new URL("/", request.url), 307));
    }
    return updateSupabaseSession(request);
  }

  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
