import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { updateOrderStatus } from '@/server/repositories/orders';
import { assertTransition } from '@/server/domain/order-state-machine';
import type { OrderStatus, Actor } from '@/types/domain';

/**
 * Transición de estado AUDITADA de una orden. Valida contra la máquina de
 * estados (lanza InvalidTransitionError si no corresponde), persiste y audita.
 */
export async function transitionOrder(
  orderId: string,
  from: OrderStatus,
  to: OrderStatus,
  actor: Actor,
  reason: string,
): Promise<void> {
  assertTransition(from, to, actor);
  await updateOrderStatus(
    orderId,
    to,
    to === 'PAID' ? { paidAt: new Date().toISOString() } : undefined,
  );
  const supabase = createSupabaseAdminClient();
  await supabase.from('audit_logs').insert({
    actor_id: null,
    actor_role: actor,
    entity_type: 'order',
    entity_id: orderId,
    action: 'status_change',
    from_status: from,
    to_status: to,
    metadata: { reason },
  });
}
