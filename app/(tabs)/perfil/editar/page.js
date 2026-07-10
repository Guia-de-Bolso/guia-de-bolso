"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import IconBack from "@/components/IconBack";
import {
  AVATAR_COMPRESS_OPTIONS,
  compressImageFile,
} from "@/lib/imageCompress";
import { usesPhoneAuth } from "@/lib/perfil";
import { createClient } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase/session";
import { fetchApi } from "@/lib/fetchApi";

/**
 * Resolves display name from user metadata or email.
 * @param {import("@supabase/supabase-js").User | null} user - Auth user.
 * @returns {string} Display name (may be empty).
 */
function getUserName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email ||
    ""
  );
}

/**
 * First letter of the user's display name for avatar fallback.
 * @param {import("@supabase/supabase-js").User | null} user - Auth user.
 * @returns {string} Uppercase initial.
 */
function getInitial(user) {
  return (getUserName(user) || "?").charAt(0).toUpperCase();
}

/**
 * @param {string} message
 * @returns {boolean}
 */
function isSuccessMessage(message) {
  return /atualizad/i.test(message);
}

/**
 * Edit profile page: name and avatar upload to Supabase Storage.
 * @returns {import("react").ReactElement}
 */
export default function EditarPerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nome, setNome] = useState("");
  const [fotoUrl, setFotoUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const previewObjectUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const supabase = createClient();

    getSessionUser(supabase).then(async (currentUser) => {
      if (!currentUser) {
        router.replace("/perfil");
        return;
      }

      setUser(currentUser);
      setNome(getUserName(currentUser));
      setFotoUrl(
        currentUser.user_metadata?.avatar_url ||
          currentUser.user_metadata?.picture ||
          ""
      );
      setPreviewUrl(
        currentUser.user_metadata?.avatar_url ||
          currentUser.user_metadata?.picture ||
          ""
      );

      const { data: perfil } = await supabase
        .from("perfis")
        .select("nome,foto_url")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (perfil) {
        setNome(perfil.nome || getUserName(currentUser));
        setFotoUrl(perfil.foto_url || "");
        setPreviewUrl(perfil.foto_url || "");
      }

      setLoading(false);
    });
  }, [router]);

  /**
   * Uploads a new avatar to storage and syncs perfis + auth metadata.
   * @param {import("react").ChangeEvent<HTMLInputElement>} event - File input change.
   * @returns {Promise<void>}
   */
  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    previewObjectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
    setUploading(true);
    setMessage("");

    let uploadFile = file;

    try {
      uploadFile = await compressImageFile(file, AVATAR_COMPRESS_OPTIONS);
    } catch (error) {
      setMessage(
        error?.message || "Não foi possível preparar a foto. Tente outro arquivo."
      );
      setUploading(false);
      event.target.value = "";
      return;
    }

    const supabase = createClient();
    const formData = new FormData();
    formData.append("file", uploadFile, uploadFile.name || "avatar.jpg");

    const response = await fetchApi("/api/perfil/avatar", {
      method: "POST",
      body: formData,
      credentials: "same-origin",
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("[perfil] upload avatar:", payload);
      setMessage(payload.error || "Não foi possível enviar a foto. Tente novamente.");
      setUploading(false);
      event.target.value = "";
      return;
    }

    const publicUrl = payload.foto_url;
    const previewPublicUrl = `${publicUrl}?v=${Date.now()}`;

    await supabase.auth.updateUser({
      data: {
        avatar_url: publicUrl,
        picture: publicUrl,
      },
    });

    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }

    setFotoUrl(publicUrl);
    setPreviewUrl(previewPublicUrl);
    setMessage("Foto atualizada!");
    setUploading(false);
    event.target.value = "";
  }

  /**
   * Saves profile name to `perfis` and auth user metadata.
   * @param {import("react").FormEvent} event - Form submit.
   * @returns {Promise<void>}
   */
  async function handleSave(event) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("perfis").upsert(
      {
        id: user.id,
        nome: nome.trim(),
        foto_url: fotoUrl,
      },
      { onConflict: "id" }
    );

    if (error) {
      setMessage("Não foi possível salvar. Tente novamente.");
      setSaving(false);
      return;
    }

    await supabase.auth.updateUser({
      data: {
        full_name: nome.trim(),
        name: nome.trim(),
        avatar_url: fotoUrl,
        picture: fotoUrl,
      },
    });

    setSaving(false);
    setMessage("Perfil atualizado!");
    setTimeout(() => {
      router.push("/perfil");
    }, 650);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f4f3] text-[#5a6b66]">
        Carregando...
      </div>
    );
  }

  const avatarUrl = previewUrl || fotoUrl;
  const messageIsSuccess = message && isSuccessMessage(message);
  const loginPorSms = usesPhoneAuth(user);

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <div className="mx-auto max-w-md px-4 pb-36 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="mb-6 flex items-center gap-3">
          <Link
            href="/perfil"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#1a4a3a] shadow-sm transition active:scale-[0.98]"
            aria-label="Voltar ao perfil"
          >
            <IconBack />
          </Link>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#1a2e28]">
              Editar perfil
            </h1>
            <p className="mt-0.5 text-sm text-[#5a6b66]">Nome e foto de perfil</p>
          </div>
        </header>

        <form id="editar-perfil-form" onSubmit={handleSave}>
          <div className="rounded-3xl bg-white p-5 shadow-[0_2px_14px_-4px_rgba(26,46,40,0.08)]">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="group relative h-32 w-32 overflow-hidden rounded-full ring-4 ring-[#d4ede8] disabled:opacity-80"
                aria-label="Alterar foto de perfil"
              >
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt="Foto de perfil atual"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#1a4a3a] text-3xl font-bold text-white">
                    {getInitial(user)}
                  </div>
                )}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 text-xs font-semibold text-white transition-colors group-hover:bg-black/55">
                  {uploading ? (
                    <span
                      className="h-7 w-7 animate-spin rounded-full border-2 border-white/40 border-t-white"
                      aria-hidden
                    />
                  ) : (
                    <>
                      <svg className="mb-1 h-6 w-6" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M20 5h-3.17l-1.84-2H9.01L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13a5 5 0 110-10 5 5 0 010 10z" />
                      </svg>
                      Alterar foto
                    </>
                  )}
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                capture="user"
                hidden
                onChange={handlePhotoChange}
              />
              <p className="mt-3 text-center text-xs text-[#9aa8a3]">
                JPEG, PNG ou WebP · redimensionamos antes do envio
              </p>
            </div>

            <label className="mt-6 block text-sm font-semibold text-[#1a2e28]">
              Nome completo
              <input
                type="text"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                autoComplete="name"
                className="mt-2 w-full rounded-xl bg-[#f0f4f3] px-4 py-3 text-sm font-normal text-[#1a2e28] focus:outline-none focus:ring-2 focus:ring-[#1a4a3a]/30"
              />
            </label>

            {!loginPorSms && user.email ? (
              <label className="mt-4 block text-sm font-semibold text-[#1a2e28]">
                Email
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="mt-2 w-full cursor-not-allowed rounded-xl bg-zinc-100 px-4 py-3 text-sm font-normal text-zinc-500"
                />
              </label>
            ) : null}

            {message && (
              <p
                role="status"
                className={`mt-4 rounded-xl px-3 py-2.5 text-center text-sm font-medium ${
                  messageIsSuccess
                    ? "bg-[#d4ede8] text-[#1a4a3a]"
                    : "bg-red-50 text-red-800"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#e8eeee]/90 bg-[#f0f4f3]/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <div className="mx-auto max-w-md">
          <button
            type="submit"
            form="editar-perfil-form"
            disabled={saving || uploading}
            className="w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#153d30] active:bg-[#123528] disabled:opacity-70"
          >
            {saving ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
