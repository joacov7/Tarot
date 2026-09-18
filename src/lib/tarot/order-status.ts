import type { OrderStatus } from '@/types/domain';

/** Etiqueta y descripción amigable de cada estado, para el seguimiento del cliente. */
export const ORDER_STATUS_LABEL: Record<OrderStatus, { label: string; description: string }> = {
  PENDING_PAYMENT: { label: 'Pago pendiente', description: 'Estamos esperando la confirmación del pago.' },
  PAID: { label: 'Pago confirmado', description: 'Recibimos tu pago. Preparando tu lectura.' },
  QUEUED: { label: 'En cola', description: 'Tu lectura está en la fila de preparación.' },
  AI_GENERATING: { label: 'Preparando borrador', description: 'Generando el borrador de tu lectura.' },
  AI_DRAFT_READY: { label: 'Borrador listo', description: 'El borrador está listo para la revisión del tarotista.' },
  HUMAN_REVIEW: { label: 'En revisión', description: 'Un tarotista está revisando y personalizando tu lectura.' },
  APPROVED: { label: 'Aprobada', description: 'Tu lectura fue aprobada y se enviará pronto.' },
  DELIVERED: { label: 'Entregada', description: 'Tu lectura ya está disponible.' },
  PAYMENT_FAILED: { label: 'Pago rechazado', description: 'El pago no se pudo procesar. Podés intentar de nuevo.' },
  CANCELLED: { label: 'Cancelada', description: 'La orden fue cancelada.' },
  REFUNDED: { label: 'Reembolsada', description: 'Se procesó un reembolso de esta orden.' },
  AI_ERROR: { label: 'Demorada', description: 'Hubo un inconveniente al preparar el borrador; lo estamos reintentando.' },
  DELIVERY_ERROR: { label: 'Reintentando envío', description: 'Estamos reintentando la entrega de tu lectura.' },
  EXPIRED: { label: 'Expirada', description: 'La orden expiró sin completarse el pago.' },
};
