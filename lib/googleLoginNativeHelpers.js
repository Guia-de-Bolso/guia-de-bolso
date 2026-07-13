import { isUserCancelledError } from "./nativeSocialLoginInit.js";

export const GOOGLE_LOGIN_TIMEOUT_MS = 60_000;

export const ANDROID_GOOGLE_SHA1_HINT =
  "Confira: package `app.guiadebolso` no cliente Android OAuth, Web Client ID na Vercel (não o ID Android), e-mail em Usuários de teste. Se instalou pelo Android Studio, cadastre também o SHA-1 de debug (`cd android && ./gradlew signingReport`).";

/**
 * No Android, USER_CANCELLED após escolher a conta costuma ser SHA-1/client ID errado (Capgo).
 * @param {unknown} error
 * @param {string} [platform]
 * @returns {Error | null}
 */
export function mapAndroidGoogleCancelToError(error, platform = "web") {
  if (!isUserCancelledError(error)) return null;
  if (platform !== "android") return null;

  return new Error(
    `Login não concluído após escolher a conta. ${ANDROID_GOOGLE_SHA1_HINT}`
  );
}

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} message
 * @returns {Promise<T>}
 */
export function withGoogleLoginTimeout(promise, ms, message) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(message));
    }, ms);

    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
