import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getPublicEnv } from '@/config/env';

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Cliente de Supabase para Server Components / Route Handlers.
 * Respeta la sesión del usuario (JWT en cookies) → aplica RLS con `auth.uid()`.
 */
export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const env = getPublicEnv();

  return createServerClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Llamado desde un Server Component sin respuesta mutable: se ignora.
          // El refresco de sesión ocurre en middleware/route handlers.
        }
      },
    },
  });
}
