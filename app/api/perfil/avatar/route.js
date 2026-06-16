import { NextResponse } from "next/server";
import {
  isAllowedAvatarMime,
  isAllowedAvatarSize,
  uploadAvatarForUser,
} from "@/lib/avatarStorage";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import { USER_MESSAGES } from "@/lib/userMessages";

/**
 * Upload de avatar autenticado via service role (contorna RLS ausente no bucket legado).
 * @returns {Promise<import('next/server').NextResponse>}
 */
export async function POST(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: USER_MESSAGES.UNAUTHORIZED, code: "UNAUTHORIZED" },
        { status: 401 }
      );
    }

    const admin = createServiceClient();
    if (!admin) {
      console.error("POST /api/perfil/avatar: SUPABASE_SERVICE_ROLE_KEY ausente");
      return NextResponse.json(
        { error: USER_MESSAGES.SERVER, code: "SERVER" },
        { status: 503 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Envie um arquivo de imagem válido.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    if (!isAllowedAvatarMime(file.type)) {
      return NextResponse.json(
        { error: "Use JPEG, PNG ou WebP.", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    if (!isAllowedAvatarSize(buffer.byteLength)) {
      return NextResponse.json(
        { error: "A imagem é grande demais (máx. 5 MB).", code: "VALIDATION" },
        { status: 400 }
      );
    }

    const upload = await uploadAvatarForUser(admin, user.id, buffer, file.type);
    if (upload.error) {
      console.error("POST /api/perfil/avatar upload:", upload.error);
      return NextResponse.json(
        { error: "Não foi possível enviar a foto. Tente novamente.", code: "STORAGE" },
        { status: 500 }
      );
    }

    const nome =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Usuário";

    const { error: perfilError } = await supabase.from("perfis").upsert(
      {
        id: user.id,
        nome,
        foto_url: upload.foto_url,
      },
      { onConflict: "id" }
    );

    if (perfilError) {
      console.error("POST /api/perfil/avatar perfis:", perfilError);
      return NextResponse.json(
        {
          error: "Foto enviada, mas não foi possível salvar no perfil.",
          code: "PERFIL",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ foto_url: upload.foto_url, bucket: upload.bucket });
  } catch (err) {
    const message = err instanceof Error ? err.message : USER_MESSAGES.SERVER;
    console.error("POST /api/perfil/avatar:", message);
    return NextResponse.json(
      { error: USER_MESSAGES.SERVER, code: "SERVER" },
      { status: 500 }
    );
  }
}
