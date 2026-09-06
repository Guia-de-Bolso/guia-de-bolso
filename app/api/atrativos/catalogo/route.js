import { NextResponse } from "next/server";
import { lugaresApiCacheHeaders } from "@/lib/apiCacheHeaders";
import { fetchAtrativosPageData } from "@/lib/atrativosPageData";
import { reportError } from "@/lib/observability";
import { getAnonServerClient } from "@/lib/supabaseAnonServer";
import { buildApiErrorBody } from "@/lib/userMessages";

/**
 * GET /api/atrativos/catalogo — trilhas curadas com tags.
 */
export async function GET() {
  try {
    const supabase = getAnonServerClient();
    if (!supabase) {
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 503 });
    }
    const data = await fetchAtrativosPageData(supabase);
    return NextResponse.json(data, { headers: lugaresApiCacheHeaders() });
  } catch (err) {
    reportError(err, { route: "GET /api/atrativos/catalogo" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
