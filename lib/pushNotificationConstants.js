/** Preferência local — usuário quer receber notificações push. */
export const PUSH_PREFERENCE_STORAGE_KEY = "gb_push_notifications_enabled";

/** Token FCM/APNs registrado no dispositivo (para unregister no logout). */
export const PUSH_DEVICE_TOKEN_STORAGE_KEY = "gb_push_device_token";

/** Plataformas suportadas pelo app nativo. */
export const PUSH_PLATFORMS = ["ios", "android"];

/** Tamanho máximo aceito para token FCM/APNs. */
export const PUSH_TOKEN_MAX_LENGTH = 4096;

/** Limites de payload para envio admin. */
export const PUSH_TITLE_MAX_LENGTH = 120;
export const PUSH_BODY_MAX_LENGTH = 500;
export const PUSH_URL_MAX_LENGTH = 500;
export const PUSH_MAX_RECIPIENTS = 500;
