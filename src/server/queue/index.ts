import 'server-only';

import type { Queue, JobName, EnqueueOptions } from '@/server/queue/queue';
import { inngest } from '@/inngest/client';

/** Mapea nombres de job del dominio a eventos de Inngest. */
const JOB_EVENT: Record<JobName, string> = {
  'ai-generate': 'tarot/ai.generate',
  'deliver-reading': 'tarot/reading.deliver',
  'send-notification': 'tarot/notification.send',
};

/**
 * Cola sobre Inngest. `delaySeconds` se traduce a un envío diferido (`ts`),
 * que es como se implementa el RETRASO configurable de Premium/Express sin
 * mantener un proceso HTTP abierto.
 *
 * Si Inngest no está configurado o falla el envío, NO se rompe el flujo que
 * confirma el pago: se registra el error y la orden queda en QUEUED para que
 * un reintento la retome (no se simula que el job corrió).
 */
class InngestQueue implements Queue {
  async enqueue<T extends Record<string, unknown>>(
    job: JobName,
    payload: T,
    options?: EnqueueOptions,
  ): Promise<void> {
    const name = JOB_EVENT[job];
    const ts =
      options?.delaySeconds && options.delaySeconds > 0
        ? Date.now() + options.delaySeconds * 1000
        : undefined;

    try {
      const sendPayload = {
        name,
        data: payload,
        ...(ts ? { ts } : {}),
        ...(options?.idempotencyKey ? { id: options.idempotencyKey } : {}),
      } as unknown as Parameters<typeof inngest.send>[0];
      await inngest.send(sendPayload);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[queue] no se pudo encolar', name, err);
    }
  }
}

let queue: Queue | null = null;

export function getQueue(): Queue {
  if (!queue) queue = new InngestQueue();
  return queue;
}
