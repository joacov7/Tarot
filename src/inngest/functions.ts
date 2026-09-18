import { inngest } from '@/inngest/client';
import { generateDraftForOrder } from '@/server/services/ai/generate';
import { deliverReading } from '@/server/services/readings/deliver';

/**
 * Genera el borrador de IA cuando una orden entra a la cola (evento emitido tras
 * confirmar el pago). Reintentos automáticos ante fallos del LLM; la idempotencia
 * la garantiza `ai_generations.idempotency_key` + el guard de estado QUEUED.
 */
export const aiGenerate = inngest.createFunction(
  { id: 'ai-generate', retries: 3 },
  { event: 'tarot/ai.generate' },
  async ({ event, step }) => {
    const { orderId } = event.data;
    const outcome = await step.run('generate-draft', () => generateDraftForOrder(orderId));
    return { orderId, outcome };
  },
);

/**
 * Entrega la lectura tras la aprobación humana. El retraso configurable ya se
 * aplicó al encolar (delaySeconds), así que aquí solo se ejecuta la entrega.
 */
export const deliverReadingFn = inngest.createFunction(
  { id: 'deliver-reading', retries: 3 },
  { event: 'tarot/reading.deliver' },
  async ({ event, step }) => {
    const { orderId } = event.data;
    const outcome = await step.run('deliver', () => deliverReading(orderId));
    return { orderId, outcome };
  },
);

/** Funciones registradas en el endpoint de Inngest. */
export const functions = [aiGenerate, deliverReadingFn];
