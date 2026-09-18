import 'server-only';

import { redirect } from 'next/navigation';
import { getSessionUser, type SessionUser } from '@/server/auth/session';
import { isReader, isAdmin } from '@/server/permissions/rbac';

/** Exige sesión; si no hay, redirige al login conservando el destino. */
export async function requireUser(next = '/'): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

/** Exige rol reader o admin (dashboard del tarotista). */
export async function requireReader(next = '/dashboard'): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!isReader(user.role)) redirect('/');
  return user;
}

/** Exige rol admin (panel administrativo). */
export async function requireAdmin(next = '/admin'): Promise<SessionUser> {
  const user = await requireUser(next);
  if (!isAdmin(user.role)) redirect('/');
  return user;
}
