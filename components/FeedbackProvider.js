"use client";

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import FeedbackSheet from "@/components/FeedbackSheet";
import { createClient } from "@/lib/supabase";
import { getSessionUser } from "@/lib/supabase/session";

/** @type {import("react").Context<null|{ openFeedback: (opts?: object) => void, closeFeedback: () => void }>} */
const FeedbackContext = createContext(null);

/**
 * @returns {{ openFeedback: (opts?: object) => void, closeFeedback: () => void }|null}
 */
export function useFeedback() {
  return useContext(FeedbackContext);
}

/**
 * Abre sheet quando URL tem ?reportar=1
 * @returns {import("react").ReactElement|null}
 */
function FeedbackReportQueryListener({ onOpen }) {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get("reportar") === "1") {
      onOpen({ tipo: "erro" });
    }
  }, [searchParams, onOpen]);

  return null;
}

/**
 * Provider global do fluxo de feedback.
 * @param {object} props
 * @param {import("react").ReactNode} props.children
 * @returns {import("react").ReactElement}
 */
export default function FeedbackProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState(null);
  const [user, setUser] = useState(null);
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const supabase = createClient();

    getSessionUser(supabase).then(async (currentUser) => {
      setUser(currentUser ?? null);
      if (currentUser) {
        const { data } = await supabase
          .from("perfis")
          .select("nome")
          .eq("id", currentUser.id)
          .maybeSingle();
        setPerfil(data);
      } else {
        setPerfil(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setPerfil(null);
        return;
      }
      supabase
        .from("perfis")
        .select("nome")
        .eq("id", nextUser.id)
        .maybeSingle()
        .then(({ data }) => setPerfil(data));
    });

    return () => subscription.unsubscribe();
  }, []);

  const openFeedback = useCallback(
    (opts = {}) => {
      const nome =
        opts.contato?.nome ??
        perfil?.nome ??
        nextUserDisplayName(user) ??
        "";
      const email = opts.contato?.email ?? user?.email ?? "";

      setInitial({
        tipo: opts.tipo,
        mensagem: opts.mensagem,
        assunto: opts.assunto,
        contexto_tecnico: opts.contexto_tecnico,
        contato: { nome, email },
      });
      setOpen(true);
    },
    [user, perfil]
  );

  const closeFeedback = useCallback(() => {
    setOpen(false);
  }, []);

  const value = useMemo(
    () => ({ openFeedback, closeFeedback }),
    [openFeedback, closeFeedback]
  );

  const sheetInitial = useMemo(() => {
    if (!initial) return null;
    return {
      ...initial,
      contato: {
        nome: initial.contato?.nome ?? perfil?.nome ?? nextUserDisplayName(user) ?? "",
        email: initial.contato?.email ?? user?.email ?? "",
      },
    };
  }, [initial, user, perfil]);

  return (
    <FeedbackContext.Provider value={value}>
      <Suspense fallback={null}>
        <FeedbackReportQueryListener onOpen={openFeedback} />
      </Suspense>
      {children}
      <FeedbackSheet
        isOpen={open}
        onClose={closeFeedback}
        isLoggedIn={Boolean(user)}
        initial={sheetInitial}
      />
    </FeedbackContext.Provider>
  );
}

/**
 * @param {import('@supabase/supabase-js').User|null} user
 * @returns {string}
 */
function nextUserDisplayName(user) {
  if (!user) return "";
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    ""
  );
}
