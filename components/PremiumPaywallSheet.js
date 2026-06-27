"use client";

import { useCallback, useEffect, useState } from "react";
import BottomSheetShell from "@/components/BottomSheetShell";
import DailyLimitCountdown from "@/components/DailyLimitCountdown";
import { useBottomSheetDrag } from "@/hooks/useBottomSheetDrag";
import { PREMIUM_BENEFITS } from "@/lib/premiumBenefits";
import { LIMITS, PREMIUM_PRICE_LABEL } from "@/lib/premium";
import {
  canPurchaseNativePremium,
  getNativePremiumBillingDisclaimer,
  getNativePremiumStoreProduct,
  purchaseNativePremium,
  restoreNativePremiumPurchases,
} from "@/lib/premiumNativePurchase";

const COPY = {
  busca: {
    title: "Limite diário de buscas atingido",
    description: `Você usou suas ${LIMITS.busca} buscas com IA gratuitas de hoje. O limite reinicia automaticamente todo dia à meia-noite (horário de Brasília). Com o Premium, busque quantos lugares quiser, sem limite diário.`,
  },
  roteiro: {
    title: "Limite diário de roteiros atingido",
    description: `Você usou seus ${LIMITS.roteiro} roteiros com IA gratuitos de hoje. Amanhã você terá novos usos disponíveis — ou assine o Premium e crie roteiros ilimitados quando quiser.`,
  },
  clima: {
    title: "Detalhes completos do clima",
    description:
      "Veja ondas nas próximas 24h, temperatura da água, índice UV, fase da lua e muito mais com o Guia Premium.",
  },
  geral: {
    title: "Guia Premium — uso ilimitado",
    description:
      "No plano gratuito, buscas e roteiros com IA têm limite diário que reinicia todo dia. O Premium remove completamente esse limite.",
  },
};

/**
 * PremiumPaywallSheet - Bottom sheet promoting Guia Premium when a daily limit is reached.
 * @param {object} props
 * @param {boolean} props.isOpen - Whether the sheet is visible.
 * @param {() => void} props.onClose - Called when the user dismisses the sheet.
 * @param {'busca'|'roteiro'|'clima'|'geral'} [props.feature] - Feature context for copy.
 * @param {boolean} [props.showCountdown=true] - Exibe contador até o reset diário.
 * @param {import('@supabase/supabase-js').User|null} [props.user] - Usuário logado (necessário para compra).
 * @param {() => void} [props.onLoginRequired] - Abre fluxo de login quando não autenticado.
 * @param {(usage: import('@/lib/premium').PremiumUsage|null) => void} [props.onPremiumActivated] - Callback após ativação.
 * @returns {import('react').ReactElement|null}
 */
export default function PremiumPaywallSheet({
  isOpen,
  onClose,
  feature = "geral",
  showCountdown = true,
  user = null,
  onLoginRequired,
  onPremiumActivated,
}) {
  const { sheetRef, scrollAreaRef, dragY, isDragging, sheetMotionStyle } = useBottomSheetDrag({
    isOpen,
    onClose,
  });

  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [storePriceLabel, setStorePriceLabel] = useState(null);

  const copy = COPY[feature] ?? COPY.geral;
  const isLimitFeature = feature === "busca" || feature === "roteiro";
  const canPurchase = canPurchaseNativePremium();
  const isBusy = purchasing || restoring;
  const priceLabel = storePriceLabel ?? PREMIUM_PRICE_LABEL;
  const billingDisclaimer = getNativePremiumBillingDisclaimer();

  useEffect(() => {
    if (!isOpen || !canPurchase) {
      setStorePriceLabel(null);
      return undefined;
    }

    let cancelled = false;

    getNativePremiumStoreProduct().then(({ priceString }) => {
      if (!cancelled && priceString) {
        setStorePriceLabel(`${priceString}/mês`);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, canPurchase]);

  const handlePurchase = useCallback(async () => {
    setPurchaseError("");

    if (!user?.id) {
      onLoginRequired?.();
      return;
    }

    setPurchasing(true);
    try {
      const result = await purchaseNativePremium({ userId: user.id });

      if (result.cancelled) return;

      if (!result.ok) {
        setPurchaseError(result.message ?? "Não foi possível concluir a compra.");
        return;
      }

      onPremiumActivated?.(result.usage ?? null);
      onClose();
    } catch {
      setPurchaseError("Não foi possível concluir a compra. Tente novamente.");
    } finally {
      setPurchasing(false);
    }
  }, [user, onLoginRequired, onPremiumActivated, onClose]);

  const handleRestore = useCallback(async () => {
    setPurchaseError("");

    if (!user?.id) {
      onLoginRequired?.();
      return;
    }

    setRestoring(true);
    try {
      const result = await restoreNativePremiumPurchases();

      if (!result.ok) {
        setPurchaseError(result.message ?? "Não foi possível restaurar a assinatura.");
        return;
      }

      onPremiumActivated?.(result.usage ?? null);
      onClose();
    } catch {
      setPurchaseError("Não foi possível restaurar a assinatura.");
    } finally {
      setRestoring(false);
    }
  }, [user, onLoginRequired, onPremiumActivated, onClose]);

  const primaryLabel = purchasing
    ? "Processando…"
    : user
      ? `Assinar Premium · ${priceLabel}`
      : "Entrar para assinar";

  return (
    <BottomSheetShell
      isOpen={isOpen}
      onClose={onClose}
      zIndex={60}
      ariaLabelledBy="premium-paywall-title"
      sheetRef={sheetRef}
      scrollRef={scrollAreaRef}
      sheetStyle={sheetMotionStyle}
      isDragging={isDragging}
      dragY={dragY}
      footer={
        <div className="shrink-0 border-t border-gray-100 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-3 touch-auto">
          {canPurchase ? (
            <>
              <button
                type="button"
                disabled={isBusy}
                onClick={handlePurchase}
                className="w-full rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {primaryLabel}
              </button>

              <button
                type="button"
                disabled={isBusy}
                onClick={handleRestore}
                className="mt-2 w-full py-2 text-sm text-[#1a4a3a] underline-offset-2 hover:underline disabled:opacity-50"
              >
                {restoring ? "Restaurando…" : "Restaurar assinatura"}
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className="w-full cursor-not-allowed rounded-xl bg-[#1a4a3a] py-3.5 text-sm font-semibold text-white opacity-50"
            >
              Pagamento em breve na web
            </button>
          )}

          {purchaseError ? (
            <p className="mt-3 text-center text-xs leading-relaxed text-red-600" role="alert">
              {purchaseError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="mt-2 w-full py-2 text-sm text-[#5a6b66] disabled:opacity-50"
          >
            Agora não
          </button>
        </div>
      }
    >
      <div className="px-6 pt-1">
        <div className="text-center">
          <span className="text-3xl" aria-hidden>
            ✨
          </span>
          <h2 id="premium-paywall-title" className="mt-2 text-xl font-bold text-[#1a2e28]">
            {copy.title}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#5a6b66]">{copy.description}</p>
        </div>

        {showCountdown && isLimitFeature && (
          <div className="mt-5">
            <DailyLimitCountdown />
          </div>
        )}

        <ul className="mt-5 space-y-2.5 rounded-2xl bg-[#f0f4f3] p-4 text-sm text-[#1a4a3a]">
          {PREMIUM_BENEFITS.map((item) => (
            <li key={item} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-bold text-emerald-700"
                aria-hidden
              >
                ✓
              </span>
              <span className="leading-snug">{item}</span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-center text-xs leading-relaxed text-[#5a6b66]">
          Plano gratuito: até {LIMITS.busca} buscas e {LIMITS.roteiro} roteiros com IA por dia,
          renovados à meia-noite.
        </p>

        <p className="mt-4 text-center text-2xl font-bold text-[#1a4a3a]">{priceLabel}</p>
        <p className="mt-1 pb-2 text-center text-xs text-[#5a6b66]">
          Uso ilimitado · Pagamento recorrente · Cancele quando quiser
        </p>

        {canPurchase && billingDisclaimer ? (
          <p className="pb-2 text-center text-[10px] leading-relaxed text-[#8a9a94]">
            {billingDisclaimer}
          </p>
        ) : null}
      </div>
    </BottomSheetShell>
  );
}
