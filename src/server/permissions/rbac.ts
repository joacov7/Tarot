import type { Role } from '@/types/domain';

/**
 * RBAC mínimo. La autorización real se defiende en DB (RLS); esto es la capa de
 * aplicación para guards de rutas/acciones y para mensajes de error claros.
 */

export const ROLE_RANK: Record<Role, number> = {
  client: 1,
  reader: 2,
  admin: 3,
};

export function hasAtLeast(role: Role, required: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[required];
}

export function isReader(role: Role): boolean {
  return hasAtLeast(role, 'reader');
}

export function isAdmin(role: Role): boolean {
  return role === 'admin';
}

export class ForbiddenError extends Error {
  constructor(message = 'No autorizado') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function assertRole(role: Role, required: Role): void {
  if (!hasAtLeast(role, required)) {
    throw new ForbiddenError(`Requiere rol "${required}" o superior (actual: "${role}").`);
  }
}
