import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Role } from '@/types/domain';

export interface SessionUser {
  id: string;
  email: string | null;
  role: Role;
  displayName: string | null;
}

/**
 * Devuelve el usuario autenticado y su rol de aplicación (desde `profiles`),
 * o `null` si no hay sesión. Usa el cliente con RLS del usuario.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, email, roles(name)')
    .eq('id', user.id)
    .single();

  // `roles` puede venir como objeto o arreglo según la relación inferida.
  const rel = profile?.roles as { name?: string } | { name?: string }[] | null | undefined;
  const roleName = Array.isArray(rel) ? rel[0]?.name : rel?.name;
  const role: Role =
    roleName === 'admin' || roleName === 'reader' || roleName === 'client' ? roleName : 'client';

  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    role,
    displayName: profile?.display_name ?? null,
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error('No autenticado');
  return user;
}
