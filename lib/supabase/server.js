import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_AUTH_COOKIE_OPTIONS } from "@/lib/supabase/cookieOptions";

/**
 * Cria cliente Supabase para Server Components, Route Handlers e Server Actions.
 * Gerencia cookies de sessão via `next/headers`.
 * @returns {Promise<import('@supabase/supabase-js').SupabaseClient>}
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions: SUPABASE_AUTH_COOKIE_OPTIONS,
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignorado em Server Components sem mutação de cookies
          }
        },
      },
    }
  );
}
