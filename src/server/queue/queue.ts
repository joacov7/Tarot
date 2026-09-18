/**
 * Contrato de la cola de trabajo. Implementación con Inngest en la Fase 4.
 * Encapsula el proveedor para poder migrar a BullMQ+Redis sin tocar el dominio.
 * Soporta retraso (delay) para la experiencia Premium/Express y prioridad.
 */

export type JobName = 'ai-generate' | 'deliver-reading' | 'send-notification';

export interface EnqueueOptions {
  /** Retraso en segundos (retraso simulado de entrega, NO bloquea HTTP). */
  delaySeconds?: number;
  /** Mayor = más prioridad (Express > Premium). */
  priority?: number;
  /** Clave de idempotencia para no duplicar el job. */
  idempotencyKey?: string;
}

export interface Queue {
  enqueue<T extends Record<string, unknown>>(
    job: JobName,
    payload: T,
    options?: EnqueueOptions,
  ): Promise<void>;
}
