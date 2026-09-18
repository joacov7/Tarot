import { serve } from 'inngest/next';
import { inngest } from '@/inngest/client';
import { functions } from '@/inngest/functions';

export const runtime = 'nodejs';

/** Endpoint que Inngest usa para descubrir y ejecutar las funciones. */
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
