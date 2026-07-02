import { NextResponse } from "next/server";
import { AdminDeleteUsuarioError, adminDeleteUsuario } from "@/lib/adminDeleteUsuario";
import { requireAdminOnlyApi } from "@/lib/requireAdminOnlyApi";
import { createServiceClient } from "@/lib/supabase/service";
import { USER_MESSAGES } from "@/lib/userMessages";

/**
 * Exclui permanentemente a conta de um usuário (ação de suporte no painel admin).
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ id: string }> }} context
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function DELETE(request, { params }) {
  try {
    const auth = await requireAdminOnlyApi();
    if (auth.error) return auth.error;

    const { id: targetUserId } = await params;
    const body = await request.json().catch(() => ({}));

    const serviceClient = createServiceClient();
    if (!serviceClient) {
      console.error("DELETE /api/admin/usuarios/[id]: SUPABASE_SERVICE_ROLE_KEY ausente");
      return NextResponse.json(
        { error: USER_MESSAGES.SERVER, code: "SERVER" },
        { status: 503 }
      );
    }

    await adminDeleteUsuario(serviceClient, {
      auditSupabase: auth.supabase,
      adminUser: auth.adminUser,
      targetUserId,
      confirmation: {
        confirmEmail: body.confirmEmail,
        confirmNome: body.confirmNome,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AdminDeleteUsuarioError) {
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status: err.status }
      );
    }

    const message = err instanceof Error ? err.message : USER_MESSAGES.SERVER;
    console.error("DELETE /api/admin/usuarios/[id]:", message);
    return NextResponse.json(
      { error: message, code: "SERVER" },
      { status: 500 }
    );
  }
}
