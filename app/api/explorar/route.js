import { NextResponse } from "next/server";
import { fetchExplorarCategoryCounts } from "@/lib/explorarCategoryCounts";
import { reportError } from "@/lib/observability";
import { getAnonServerClient } from "@/lib/supabaseAnonServer";
import { buildApiErrorBody } from "@/lib/userMessages";

/**
 * GET /api/explorar — contagens e capas por categoria (todos os lugares ativos).
 */
export async function GET() {
  const supabase = getAnonServerClient();
  if (!supabase) {
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 503 });
  }

  try {
    const data = await fetchExplorarCategoryCounts(supabase);

    if (!data) {
      return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
    }

    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (err) {
    reportError(err, { route: "GET /api/explorar" });
    return NextResponse.json(buildApiErrorBody("SERVER"), { status: 500 });
  }
}
