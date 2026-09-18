import 'server-only';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

/** Repositorio de notificaciones (service role). */

export async function createNotification(params: {
  userId: string;
  orderId: string | null;
  type: string;
  channel: 'email' | 'in_app' | 'whatsapp';
  title: string;
  body: string;
}): Promise<string | null> {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: params.userId,
      order_id: params.orderId,
      type: params.type,
      channel: params.channel,
      title: params.title,
      body: params.body,
    })
    .select('id')
    .single();
  if (error) return null;
  return (data?.id as string | undefined) ?? null;
}
