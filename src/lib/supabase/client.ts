'use client';

import { createBrowserClient } from '@supabase/ssr';
import { getPublicEnv } from '@/config/env';

/** Cliente de Supabase para componentes del navegador (usa la anon key + sesión). */
export function createSupabaseBrowserClient() {
  const env = getPublicEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
