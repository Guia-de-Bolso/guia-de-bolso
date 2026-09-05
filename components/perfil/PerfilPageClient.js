"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Capacitor } from "@capacitor/core";
import AppDeveloperCredit from "@/components/AppDeveloperCredit";
import PrefeituraSupportLine from "@/components/PrefeituraSupportLine";
import PremiumPaywallSheet from "@/components/PremiumPaywallSheet";
import PerfilHero from "@/components/perfil/PerfilHero";
import PerfilLoggedOut from "@/components/perfil/PerfilLoggedOut";
import PerfilNavAppSheet from "@/components/perfil/PerfilNavAppSheet";
import PerfilPremiumCard from "@/components/perfil/PerfilPremiumCard";
import PerfilQuickLinks from "@/components/perfil/PerfilQuickLinks";
import PerfilSettingsGroup from "@/components/perfil/PerfilSettingsGroup";
import PerfilPushToggleRow from "@/components/perfil/PerfilPushToggleRow";
import PerfilStats from "@/components/perfil/PerfilStats";
import PerfilBottomSheet from "@/components/perfil/PerfilBottomSheet";
import PerfilLogoutSheet from "@/components/perfil/PerfilLogoutSheet";
import {
  MAP_PREFERENCE_STORAGE_KEY,
  getNavAppLabel,
  getUserName,
  providerName,
  resolveAvatarUrl,
} from "@/lib/perfil";
import { isPremiumActive } from "@/lib/premium";
import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_PHONE_DISPLAY,
  SITE_WHATSAPP_URL,
  SOCIAL_LINKS,
  getSiteTelHref,
} from "@/lib/siteContact";
import { usePremiumUsage } from "@/lib/usePremiumUsage";
import { usePerfilPageData } from "@/hooks/usePerfilPageData";
import { createClient } from "@/lib/supabase";
import { useFeedback } from "@/components/FeedbackProvider";
import { mapApiErrorResponse, USER_MESSAGES } from "@/lib/userMessages";
import { registrarLog } from "@/lib/logs";
import { fetchApi } from "@/lib/fetchApi";
import { navigateAppPath } from "@/lib/capacitorNavigation";
import {
  disablePushNotifications,
  enablePushNotifications,
  getPushNotificationsPreference,
  isPushNotificationsAvailable,
} from "@/lib/pushNotifications";

/**
 * @param {import('@/lib/perfilPageData').PerfilPageInitialData} initialData
 * @returns {import('@supabase/supabase-js').User|null}
 */
function userFromInitialData(initialData) {
  return initialData.user;
}

/**
 * Aba Perfil — interações client-side; dados iniciais vêm do SSR.
 * @param {{ initialData: import('@/lib/perfilPageData').PerfilPageInitialData }} props
 * @returns {import("react").JSX.Element}
 */
export default function PerfilPageClient({ initialData }) {
  const router = useRouter();
  const feedback = useFeedback();
  const [user, setUser] = useState(() => userFromInitialData(initialData));
  const { data: cachedPerfil, mutate: mutatePerfilCache } = usePerfilPageData(
    initialData,
    user?.id ?? null
  );
  const [perfil, setPerfil] = useState(initialData.perfil);
  const [favoritosCount, setFavoritosCount] = useState(initialData.stats.favoritos);
  const [avaliacoesCount, setAvaliacoesCount] = useState(initialData.stats.avaliacoes);
  const [roteirosCount, setRoteirosCount] = useState(initialData.stats.roteiros);
  const [navPreference, setNavPreference] = useState(
    () => initialData.perfil?.maps_preferido || "google"
  );
  const [showNavSheet, setShowNavSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const showPushSettings =
    Boolean(user) && isPushNotificationsAvailable() && Capacitor.isNativePlatform();

  const { usage: premiumUsage, refresh: refreshPremiumUsage, setUsage: setPremiumUsage } =
    usePremiumUsage(user);
  const isPremium = isPremiumActive(perfil) || Boolean(premiumUsage?.premium);

  useEffect(() => {
    if (user?.id && cachedPerfil.user?.id && cachedPerfil.user.id !== user.id) {
      return;
    }
    if (!user?.id && cachedPerfil.user?.id) {
      return;
    }

    setPerfil(cachedPerfil.perfil);
    setFavoritosCount(cachedPerfil.stats.favoritos);
    setAvaliacoesCount(cachedPerfil.stats.avaliacoes);
    setRoteirosCount(cachedPerfil.stats.roteiros);
    if (cachedPerfil.perfil?.maps_preferido) {
      setNavPreference(cachedPerfil.perfil.maps_preferido);
    }
  }, [cachedPerfil, user?.id]);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem(MAP_PREFERENCE_STORAGE_KEY)
        : null;

    if (stored) {
      setNavPreference(stored);
      return;
    }

    if (initialData.perfil?.maps_preferido) {
      localStorage.setItem(
        MAP_PREFERENCE_STORAGE_KEY,
        initialData.perfil.maps_preferido
      );
    }
  }, [initialData.perfil?.maps_preferido]);

  useEffect(() => {
    if (!showPushSettings) return;
    setPushEnabled(getPushNotificationsPreference());
  }, [showPushSettings]);

  /** @returns {Promise<void>} */
  async function handleTogglePushNotifications(nextEnabled) {
    if (pushBusy) return;

    setPushBusy(true);
    setFeedbackMessage("");

    try {
      if (nextEnabled) {
        const result = await enablePushNotifications();
        if (!result.ok) {
          if (result.reason === "denied") {
            setFeedbackMessage(
              "Permissão negada. Ative notificações nas configurações do celular."
            );
          } else {
            setFeedbackMessage("Não foi possível ativar as notificações. Tente novamente.");
          }
          setPushEnabled(false);
          return;
        }
        setPushEnabled(true);
        return;
      }

      await disablePushNotifications();
      setPushEnabled(false);
    } catch {
      setFeedbackMessage("Não foi possível atualizar as notificações. Tente novamente.");
    } finally {
      setPushBusy(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setPerfil(null);
        setFavoritosCount(0);
        setAvaliacoesCount(0);
        setRoteirosCount(0);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  /** @returns {Promise<void>} */
  async function handleLogout() {
    if (!user || loggingOut) return;

    setLoggingOut(true);
    setFeedbackMessage("");

    try {
      const response = await fetchApi("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin",
      });

      if (!response.ok) {
        const supabase = createClient();
        if (!supabase) {
          setFeedbackMessage("Não foi possível sair. Tente novamente.");
          return;
        }
        await registrarLog(supabase, user, "logout");
        const { error } = await supabase.auth.signOut();
        if (error) {
          setFeedbackMessage("Não foi possível sair. Tente novamente.");
          return;
        }
      } else {
        const supabase = createClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      }

      setUser(null);
      setPerfil(null);
      setShowLogoutConfirm(false);
      router.refresh();
      navigateAppPath(router, "/login");
    } catch {
      setFeedbackMessage("Não foi possível sair. Tente novamente.");
    } finally {
      setLoggingOut(false);
    }
  }

  /** @returns {Promise<void>} */
  async function handleDeleteAccountRequest() {
    if (!user || deletingAccount) return;

    setDeletingAccount(true);
    setFeedbackMessage("");

    try {
      const supabase = createClient();
      await registrarLog(supabase, user, "deletou_conta");

      const response = await fetchApi("/api/conta", {
        method: "DELETE",
        credentials: "same-origin",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const mapped = mapApiErrorResponse(data, response.status);
        setFeedbackMessage(mapped.message);
        setDeletingAccount(false);
        return;
      }

      await supabase.auth.signOut();
      setUser(null);
      setPerfil(null);
      setShowDeleteConfirm(false);
      setFeedbackMessage("");
      router.push("/");
    } catch {
      setFeedbackMessage(USER_MESSAGES.NETWORK);
      setDeletingAccount(false);
    }
  }

  /**
   * @param {string} value
   */
  async function handleSelectNavigationApp(value) {
    localStorage.setItem(MAP_PREFERENCE_STORAGE_KEY, value);
    setNavPreference(value);
    setShowNavSheet(false);

    if (!user) return;

    const supabase = createClient();
    await supabase
      .from("perfis")
      .upsert({ id: user.id, maps_preferido: value }, { onConflict: "id" });
  }

  const nome = getUserName(user, perfil);
  const avatarUrl = resolveAvatarUrl(user, perfil);
  const membroDesde = perfil?.created_at || user?.created_at;

  return (
    <div className="min-h-screen bg-[#f0f4f3] text-[#1a2e28]">
      <header className="px-4 pb-4 pt-safe-top">
        <div className="mx-auto max-w-md">
          <h1 className="text-2xl font-bold tracking-tight text-[#1a2e28]">
            Perfil
          </h1>
          <p className="mt-1 text-sm text-[#5a6b66]">
            {user
              ? "Sua conta e preferências na região"
              : "Entre para personalizar o Guia."}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pb-32 pt-5">
        {!user ? (
          <PerfilLoggedOut />
        ) : (
          <div className="space-y-6">
            <PerfilHero
              nome={nome}
              email={user.email}
              avatarUrl={avatarUrl}
              membroDesde={membroDesde}
              isPremium={isPremium}
            />

            <PerfilStats
              favoritos={favoritosCount}
              avaliacoes={avaliacoesCount}
              roteiros={roteirosCount}
            />

            <PerfilPremiumCard
              isPremium={isPremium}
              usage={premiumUsage}
              onUpgrade={() => setPaywallOpen(true)}
            />

            <PerfilQuickLinks />

            <PerfilSettingsGroup
              title="Preferências"
              items={[
                {
                  key: "nav",
                  icon: "🗺️",
                  label: "App de navegação",
                  detail: getNavAppLabel(navPreference),
                  onClick: () => setShowNavSheet(true),
                },
              ]}
            />

            {showPushSettings && (
              <section aria-labelledby="perfil-group-notificacoes">
                <h2
                  id="perfil-group-notificacoes"
                  className="mb-2 px-1 text-xs font-bold uppercase tracking-[0.12em] text-[#5a6b66]"
                >
                  Notificações
                </h2>
                <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-[#e8eeee]">
                  <PerfilPushToggleRow
                    enabled={pushEnabled}
                    busy={pushBusy}
                    onChange={handleTogglePushNotifications}
                  />
                </div>
              </section>
            )}

            <PerfilSettingsGroup
              title="Conta"
              items={[
                {
                  key: "provider",
                  icon: "📱",
                  label: "Conta vinculada",
                  detail: providerName(user),
                },
              ]}
            />

            <PerfilSettingsGroup
              title="Ajuda e feedback"
              items={[
                {
                  key: "feedback",
                  icon: "💬",
                  label: "Enviar sugestão ou reportar problema",
                  onClick: () =>
                    feedback?.openFeedback({
                      pagina_origem: "/perfil",
                    }),
                },
              ]}
            />

            <PerfilSettingsGroup
              title="Legal"
              items={[
                {
                  key: "termos",
                  icon: "📄",
                  label: "Termos de Uso",
                  href: "/termos?from=perfil",
                },
                {
                  key: "privacidade",
                  icon: "🔒",
                  label: "Política de Privacidade",
                  href: "/privacidade?from=perfil",
                },
              ]}
            />

            <PerfilSettingsGroup
              title="Contato"
              items={[
                {
                  key: "telefone",
                  icon: "📞",
                  label: "Telefone",
                  detail: SITE_CONTACT_PHONE_DISPLAY,
                  onClick: () => {
                    window.location.href = getSiteTelHref();
                  },
                },
                {
                  key: "whatsapp",
                  icon: "💬",
                  label: "WhatsApp",
                  detail: SITE_CONTACT_PHONE_DISPLAY,
                  onClick: () => {
                    window.open(SITE_WHATSAPP_URL, "_blank", "noopener,noreferrer");
                  },
                },
                {
                  key: "email",
                  icon: "✉️",
                  label: "E-mail",
                  detail: SITE_CONTACT_EMAIL,
                  onClick: () => {
                    window.location.href = `mailto:${SITE_CONTACT_EMAIL}`;
                  },
                },
                {
                  key: "instagram",
                  icon: "📷",
                  label: "Instagram",
                  detail: "@guiadebolsoimbituba",
                  onClick: () => {
                    window.open(SOCIAL_LINKS.instagram, "_blank", "noopener,noreferrer");
                  },
                },
                {
                  key: "tiktok",
                  icon: "🎵",
                  label: "TikTok",
                  detail: "@guiadebolsoimbituba",
                  onClick: () => {
                    window.open(SOCIAL_LINKS.tiktok, "_blank", "noopener,noreferrer");
                  },
                },
              ]}
            />

            <PerfilSettingsGroup
              title="Sessão"
              items={[
                {
                  key: "logout",
                  icon: "🚪",
                  label: "Sair",
                  onClick: () => setShowLogoutConfirm(true),
                },
                {
                  key: "delete",
                  icon: "🗑️",
                  label: "Excluir conta",
                  detail: "Ação permanente",
                  danger: true,
                  onClick: () => setShowDeleteConfirm(true),
                },
              ]}
            />

            {feedbackMessage && (
              <p
                className="rounded-2xl bg-white p-4 text-sm text-[#5a6b66] shadow-sm ring-1 ring-[#e8eeee]"
                role="status"
              >
                {feedbackMessage}
              </p>
            )}

            <PrefeituraSupportLine variant="footer" showLink className="pb-2 text-center" />
            <AppDeveloperCredit showProductLine className="pb-2" />
          </div>
        )}
      </main>

      <PerfilNavAppSheet
        isOpen={showNavSheet}
        onClose={() => setShowNavSheet(false)}
        selected={navPreference}
        onSelect={handleSelectNavigationApp}
      />

      <PerfilBottomSheet
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Excluir conta"
      >
        <p className="text-sm leading-relaxed text-[#5a6b66]">
          Esta ação é permanente. Seus favoritos, avaliações e roteiros serão
          removidos.
        </p>
        <button
          type="button"
          data-sheet-action="true"
          onClick={handleDeleteAccountRequest}
          disabled={deletingAccount}
          className="mt-5 w-full rounded-xl bg-[#d9534f] py-3.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {deletingAccount ? "Excluindo conta…" : "Excluir permanentemente"}
        </button>
        <button
          type="button"
          data-sheet-action="true"
          onClick={() => setShowDeleteConfirm(false)}
          disabled={deletingAccount}
          className="mt-3 w-full rounded-xl bg-[#f0f4f3] py-3.5 text-sm font-semibold text-[#5a6b66] disabled:opacity-60"
        >
          Cancelar
        </button>
      </PerfilBottomSheet>

      <PerfilLogoutSheet
        isOpen={showLogoutConfirm}
        onClose={() => !loggingOut && setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        confirming={loggingOut}
      />

      <PremiumPaywallSheet
        isOpen={paywallOpen}
        feature="geral"
        user={user}
        onLoginRequired={() => {
          setPaywallOpen(false);
          navigateAppPath(router, "/login?next=/perfil");
        }}
        onPremiumActivated={async (nextUsage) => {
          if (nextUsage?.premium) {
            setPremiumUsage(nextUsage);
          } else {
            await refreshPremiumUsage();
          }

          if (user?.id) {
            const supabase = createClient();
            const { data: perfilData } = await supabase
              .from("perfis")
              .select("*")
              .eq("id", user.id)
              .maybeSingle();

            if (perfilData) {
              setPerfil(perfilData);
              mutatePerfilCache();
            }
          }
        }}
        onClose={() => setPaywallOpen(false)}
      />
    </div>
  );
}
