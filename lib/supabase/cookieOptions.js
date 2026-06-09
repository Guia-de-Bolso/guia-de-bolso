/**
 * Opções compartilhadas dos cookies de sessão Supabase.
 * Mantém refresh token persistente por ~400 dias, seguindo o padrão do
 * `@supabase/ssr`, mas de forma explícita em todos os clientes.
 */
export const SUPABASE_AUTH_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax",
  httpOnly: false,
  maxAge: 60 * 60 * 24 * 400,
};
