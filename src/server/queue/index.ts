import 'server-only';

import type { Queue, JobName, EnqueueOptions } from '@/server/queue/queue';

/**
 * Binding de cola. La implementación real (Inngest) se conecta en la Fase 4.
 * Por ahora es un no-op EXPLÍCITO: registra la intención sin ejecutar el job.
 * No simula que el trabajo se realizó; solo evita acoplar el dominio al proveedor.
 *
 * Las órdenes quedan en PAID/QUEUED y el worker de la Fase 4 tomará esos estados.
 */
class LoggingQueue implements Queue {
  async enqueue<T extends Record<string, unknown>>(
    job: JobName,
    payload: T,
    options?: EnqueueOptions,
  ): Promise<void> {
    // eslint-disable-next-line no-console
    console.info('[queue:pendiente-fase4]', job, {
      payload,
      delaySeconds: options?.delaySeconds ?? 0,
      priority: options?.priority ?? 0,
      idempotencyKey: options?.idempotencyKey,
    });
  }
}

let queue: Queue | null = null;

export function getQueue(): Queue {
  if (!queue) queue = new LoggingQueue();
  return queue;
}
