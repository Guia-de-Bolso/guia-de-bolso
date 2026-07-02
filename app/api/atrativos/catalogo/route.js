import { NextResponse } from "next/server";
import { fetchAtrativosPageData } from "@/lib/atrativosPageData";
import { reportError } from "@/lib/observability";
import { createClient } from "@/lib/supabase/server";
import { buildApiErrorBody } from "@/lib/userMessages";

/**
 * GET /api/atrativos/catalogo — lista com tags + roteiros salvos do usuário.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const data = await fetchAtrativosPageData(supabase);
    return NextResponse.json(data);
  } catch (err) {
    reportError(err, { route: "GET /api/atrativos/catalogo" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
