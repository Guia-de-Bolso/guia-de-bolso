import { NextResponse } from "next/server";
import {
  CONTRATO_DOC_TIPO,
  buildContratoStoragePath,
  isAllowedContratoDocMime,
  isAllowedContratoDocSize,
  CONTRATOS_BUCKET,
} from "@/lib/contratoAdmin";
import { requireAdminOnlyApi } from "@/lib/requireAdminOnlyApi";
import { createServiceClient } from "@/lib/supabase/service";
import { USER_MESSAGES } from "@/lib/userMessages";

/**
 * Upload de documento comercial (PDF/DOCX/imagem).
 * @param {import('next/server').NextRequest} request
 * @param {{ params: Promise<{ id: string }> }} context
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function POST(request, { params }) {
  try {
    const auth = await requireAdminOnlyApi();
    if (auth.error) return auth.error;

    const { id: contratoId } = await params;

    const { data: contrato, error: contratoError } = await auth.supabase
      .from("contratos_comerciais")
      .select("id")
      .eq("id", contratoId)
      .maybeSingle();

    if (contratoError || !contrato) {
      return NextResponse.json(
        { error: "Contrato não encontrado.", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const tipoRaw = String(formData.get("tipo") || CONTRATO_DOC_TIPO.OUTRO);

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Envie um arquivo válido.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    if (!isAllowedContratoDocMime(file.type)) {
      return NextResponse.json(
        { error: "Use PDF, DOCX ou imagem (JPEG/PNG/WebP).", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    if (!isAllowedContratoDocSize(buffer.byteLength)) {
      return NextResponse.json(
        { error: "Arquivo grande demais (máx. 10 MB).", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const tipo = Object.values(CONTRATO_DOC_TIPO).includes(tipoRaw)
      ? tipoRaw
      : CONTRATO_DOC_TIPO.OUTRO;

    const storagePath = buildContratoStoragePath(contratoId, file.name);

    const serviceClient = createServiceClient();
    const storageClient = serviceClient || auth.supabase;

    const { error: uploadError } = await storageClient.storage
      .from(CONTRATOS_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("POST contratos documentos upload:", uploadError.message);
      return NextResponse.json(
        { error: "Não foi possível enviar o arquivo.", code: "STORAGE" },
        { status: 500 }
      );
    }

    const { data: docRow, error: insertError } = await auth.supabase
      .from("contrato_documentos")
      .insert({
        contrato_id: contratoId,
        tipo,
        nome_arquivo: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        tamanho_bytes: buffer.byteLength,
        uploaded_by: auth.adminUser.id,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("POST contratos documentos insert:", insertError.message);
      await storageClient.storage.from(CONTRATOS_BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: "Não foi possível registrar o documento.", code: "DB" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, documento: docRow });
  } catch (err) {
    const message = err instanceof Error ? err.message : USER_MESSAGES.SERVER;
    console.error("POST /api/admin/contratos/[id]/documentos:", message);
    return NextResponse.json({ error: USER_MESSAGES.SERVER, code: "SERVER" }, { status: 500 });
  }
}
