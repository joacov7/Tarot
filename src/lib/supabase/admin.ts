import 'server-only';

import { createClient } from '@supabase/supabase-js';
import { getPublicEnv, getServerEnv } from '@/config/env';

/**
 * Cliente con SERVICE ROLE. IGNORA RLS. Uso EXCLUSIVO del servidor/worker para
 * operaciones de dominio sensibles (transiciones de estado, pagos, generación de IA,
 * auditoría). NUNCA exponer al cliente ni usar con datos no confiables sin validar.
 */
export function createSupabaseAdminClient() {
  const pub = getPublicEnv();
  const srv = getServerEnv();
  return createClient(pub.NEXT_PUBLIC_SUPABASE_URL, srv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
