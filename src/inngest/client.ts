import { Inngest, EventSchemas } from 'inngest';

/** Eventos tipados de la plataforma. */
type Events = {
  'tarot/ai.generate': { data: { orderId: string } };
  'tarot/reading.deliver': { data: { orderId: string } };
  'tarot/notification.send': { data: { notificationId: string } };
};

export const inngest = new Inngest({
  id: 'tarot-hibrido',
  schemas: new EventSchemas().fromRecord<Events>(),
});
