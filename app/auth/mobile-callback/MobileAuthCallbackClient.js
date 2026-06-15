"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NATIVE_OAUTH_CALLBACK } from "@/lib/capacitorOAuth";

const ANDROID_PACKAGE = "app.guiadebolso";

/**
 * Monta URL para retornar ao app após OAuth na Custom Tab.
 * Intent URL costuma funcionar melhor que scheme puro no Android.
 * @param {string} query
 * @returns {string}
 */
function buildAppReturnUrl(query) {
  const isAndroid = /android/i.test(navigator.userAgent);
  if (isAndroid) {
    return `intent://auth/callback?${query}#Intent;scheme=app.guiadebolso;package=${ANDROID_PACKAGE};end`;
  }
  return `${NATIVE_OAUTH_CALLBACK}?${query}`;
}

/**
 * Ponte OAuth: Supabase redireciona aqui (HTTPS) e esta página reabre o app nativo.
 * @returns {import("react").ReactElement}
 */
export default function MobileAuthCallbackClient() {
  const searchParams = useSearchParams();
  const [hint, setHint] = useState("Concluindo login…");

  useEffect(() => {
    const query = searchParams.toString();
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      window.location.href = buildAppReturnUrl(`error=${encodeURIComponent(error)}`);
      return;
    }

    if (!code) {
      setHint("Não foi possível concluir o login. Volte ao app e tente novamente.");
      return;
    }

    const returnUrl = buildAppReturnUrl(query);
    window.location.replace(returnUrl);

    const timer = setTimeout(() => {
      setHint("Se o app não abriu, toque no botão abaixo.");
    }, 1800);

    return () => clearTimeout(timer);
  }, [searchParams]);

  const query = searchParams.toString();
  const code = searchParams.get("code");
  const manualHref = code ? buildAppReturnUrl(query) : undefined;

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#f0f4f3] px-6 text-center text-[#1a2e28]">
      <p className="text-sm text-[#5a6b66]">{hint}</p>
      {manualHref ? (
        <a
          href={manualHref}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#1a4a3a] px-6 text-sm font-semibold text-white"
        >
          Abrir o Guia de Bolso
        </a>
      ) : null}
    </div>
  );
}
