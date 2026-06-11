import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import {
  getMarketingRouteAction,
  getRequestHostname,
  isMarketingHost,
} from "@/lib/marketingHost";
import { SITE_DOMAIN } from "@/lib/siteContact";

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
 * Proxy: dominio de marketing (guiadebolso.app) so landing + legal; demais hosts = app completo.
 * @param {import("next/server").NextRequest} request - Incoming request.
 * @returns {Promise<import("next/server").NextResponse>} Response with updated session cookies.
 */
export async function proxy(request) {
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
    return applyPreviewRobots(NextResponse.next());
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production") {
    supabaseResponse.headers.set("X-Robots-Tag", "noindex, nofollow");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|html)$).*)",
  ],
};
