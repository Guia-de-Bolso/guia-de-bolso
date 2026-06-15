import { Suspense } from "react";
import MobileAuthCallbackClient from "./MobileAuthCallbackClient";

/**
 * Callback OAuth intermediário para o app Capacitor (Custom Tab → deep link).
 * @returns {import("react").ReactElement}
 */
export default function MobileAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[100dvh] items-center justify-center bg-[#f0f4f3] px-6 text-center text-sm text-[#5a6b66]">
          Concluindo login…
        </div>
      }
    >
      <MobileAuthCallbackClient />
    </Suspense>
  );
}
