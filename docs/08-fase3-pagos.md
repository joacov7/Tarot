# 08 · Resumen Fase 3 — Pagos

Integración de **Mercado Pago** con confirmación segura por **webhook verificado e idempotente**.
Stripe queda preparado por la misma abstracción (`PaymentProvider`).

---

## 1. Qué se implementó

### Flujo de checkout
- **`POST /api/checkout`** (requiere sesión): valida la selección (Zod `checkoutSchema`, con
  códigos de carta), crea la **orden en `PENDING_PAYMENT`** + lectura + cartas, y genera una
  **preferencia de pago** de Mercado Pago. Devuelve `{ orderId, checkoutUrl }`.
- **La mesa** ahora tiene un botón real "Continuar al pago" que llama a `/api/checkout` y
  redirige al checkout de MP (o muestra el error/authz si corresponde). Sin plan elegido,
  invita a elegir un servicio.
- **`/orden/[id]`**: página de seguimiento (destino de los `back_urls`) que muestra el estado
  de la orden con etiquetas amigables.

### Seguridad de pagos (reglas cumplidas)
- **El precio se toma del plan en la DB**, nunca del cliente (`createReadingOrder`).
- **Nunca se marca pagada una orden por el retorno del navegador**: la confirmación es solo por
  webhook (`/api/webhooks/mercadopago`).
- **Firma verificada**: HMAC-SHA256 del manifiesto `id;request-id;ts` con `MP_WEBHOOK_SECRET`,
  comparación en tiempo constante.
- **Verificación de monto/moneda/orden** antes de transicionar a `PAID` (se consulta el pago
  real en MP, no se confía en el cuerpo del webhook).
- **Idempotencia** por `payment_events UNIQUE(provider, provider_event_id)`: un evento duplicado
  no reprocesa; y a nivel estado, una orden ya avanzada no vuelve a transicionar.
- **Estado de pago separado del estado de la lectura** (tablas `payments` vs. `orders`).
- Al confirmar: `PENDING_PAYMENT → PAID → QUEUED` y se **encola `ai-generate`** (la cola real
  es Fase 4; hoy un binding no-op explícito registra la intención, sin simular el trabajo).

### Archivos clave
- `src/server/services/payments/webhook-verify.ts` — funciones **puras** (firma, monto, mapeo).
- `src/server/services/payments/mercadopago.ts` — adapter MP (`createPreference`, `verifyWebhook`).
- `src/server/services/payments/order-payment.ts` — orquestación idempotente y transiciones.
- `src/server/services/orders/create-order.ts` — creación de orden con precio de la DB.
- `src/server/repositories/orders.ts` — órdenes, pagos y eventos (service role).
- `src/app/api/checkout/route.ts`, `src/app/api/webhooks/mercadopago/route.ts`.

---

## 2. Pruebas (éxito y error) — 65 tests en total, +31 en esta fase

| Suite | Cubre |
|-------|-------|
| `webhook-verify` (16) | Firma válida/ inválida, data.id manipulado, header ausente, monto/moneda, mapeo de estados |
| `create-order` (7) | Precio desde la DB (no del cliente), plan inexistente, cantidad/repetición de cartas, posiciones, invertidas no permitidas, código desconocido |
| `order-payment` (8) | **Idempotencia (duplicado)**, firma inválida no confirma, monto/moneda no coincide, aprobado → PAID→QUEUED + encola IA, orden ya pagada no re-transiciona, rechazado → PAYMENT_FAILED, sin orden se ignora |

Todo verde: `typecheck`, `lint`, `build`, `test` (65/65).

---

## 3. Cómo probarlo

- **Unitario** (sin DB ni red): `npm run test`.
- **End-to-end real** (requiere entorno): configurar en `.env.local` `MP_ACCESS_TOKEN`,
  `MP_WEBHOOK_SECRET`, Supabase y `APP_BASE_URL`; aplicar migraciones + seed; iniciar sesión;
  desde la mesa elegir plan → "Continuar al pago" → checkout de MP (sandbox) → el webhook
  confirma y la orden pasa a `PAID`/`QUEUED`.
- **Webhook**: MP debe apuntar a `/api/webhooks/mercadopago`. Firma inválida → 401; evento
  duplicado → `duplicate` (200).

---

## 4. Pendientes (siguientes fases)
- **Fase 4**: conectar Inngest (reemplaza el binding no-op), servicio de IA (OpenAI) que toma
  las órdenes `QUEUED`, genera el borrador y aplica el retraso configurable.
- **Auth UI**: pantallas de registro/login (hoy el checkout exige sesión, creada por Supabase
  Auth, pero falta la UI de acceso).
- **Historial `/mis-lecturas`** del cliente.
