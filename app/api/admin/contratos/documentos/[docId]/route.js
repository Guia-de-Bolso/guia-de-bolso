import { NextResponse } from "next/server";
import { CONTRATOS_BUCKET } from "@/lib/contratoAdmin";
import { requireAdminOnlyApi } from "@/lib/requireAdminOnlyApi";
import { createServiceClient } from "@/lib/supabase/service";
import { USER_MESSAGES } from "@/lib/userMessages";

/**
 * Gera URL assinada para download de documento comercial.
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ docId: string }> }} context
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function GET(_request, { params }) {
  try {
    const auth = await requireAdminOnlyApi();
    if (auth.error) return auth.error;

    const { docId } = await params;

    const { data: doc, error: docError } = await auth.supabase
      .from("contrato_documentos")
      .select("*")
      .eq("id", docId)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Documento não encontrado.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const serviceClient = createServiceClient();
    const storageClient = serviceClient || auth.supabase;

    const { data: signed, error: signError } = await storageClient.storage
      .from(CONTRATOS_BUCKET)
      .createSignedUrl(doc.storage_path, 3600);

    if (signError || !signed?.signedUrl) {
      console.error("GET contrato documento signedUrl:", signError?.message);
      return NextResponse.json(
        { error: "Não foi possível gerar o link de download.", code: "STORAGE" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      url: signed.signedUrl,
      nome_arquivo: doc.nome_arquivo,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : USER_MESSAGES.SERVER;
    console.error("GET /api/admin/contratos/documentos/[docId]:", message);
    return NextResponse.json({ error: USER_MESSAGES.SERVER, code: "SERVER" }, { status: 500 });
  }
}

/**
 * Remove documento comercial.
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ docId: string }> }} context
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function DELETE(_request, { params }) {
  try {
    const auth = await requireAdminOnlyApi();
    if (auth.error) return auth.error;

    const { docId } = await params;

    const { data: doc, error: docError } = await auth.supabase
      .from("contrato_documentos")
      .select("*")
      .eq("id", docId)
      .maybeSingle();

    if (docError || !doc) {
      return NextResponse.json(
        { error: "Documento não encontrado.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const serviceClient = createServiceClient();
    const storageClient = serviceClient || auth.supabase;

    await storageClient.storage.from(CONTRATOS_BUCKET).remove([doc.storage_path]);

    const { error: deleteError } = await auth.supabase
      .from("contrato_documentos")
      .delete()
      .eq("id", docId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Não foi possível excluir o documento.", code: "DB" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : USER_MESSAGES.SERVER;
    console.error("DELETE /api/admin/contratos/documentos/[docId]:", message);
    return NextResponse.json({ error: USER_MESSAGES.SERVER, code: "SERVER" }, { status: 500 });
  }
}
