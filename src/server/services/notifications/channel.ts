/**
 * Contrato de canal de notificación. Email (Resend) e in-app en la Fase 5;
 * WhatsApp queda preparado por esta misma interfaz (sin credenciales en el repo).
 */

export type NotificationType =
  | 'purchase_confirmed'
  | 'in_review'
  | 'reading_ready'
  | 'payment_failed';

export interface NotificationMessage {
  to: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Enlace seguro (URL firmada) cuando corresponde. */
  link?: string;
}

export interface DeliveryResult {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface NotificationChannel {
  readonly channel: 'email' | 'in_app' | 'whatsapp';
  send(message: NotificationMessage): Promise<DeliveryResult>;
}
