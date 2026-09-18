# 05 · Decisiones Técnicas (comparativa y recomendación)

Cada decisión sigue el formato: **contexto → alternativas → recomendación → justificación
técnica y comercial**.

---

## D1. Arquitectura: monolito modular vs. microservicios
- **Alternativas**: (a) monolito modular en Next.js; (b) microservicios desde el día 1.
- **Recomendación**: **(a) monolito modular** con fronteras internas (servicios/repositorios) y
  un **worker separado** para colas.
- **Justificación**: menor coste operativo y despliegue simple (Vercel), velocidad de entrega
  para un MVP comercial. Las fronteras internas permiten extraer un servicio (p. ej. IA) a un
  proceso propio si el volumen lo exige, sin reescribir. Microservicios añaden complejidad
  (redes, observabilidad, orquestación) injustificada al inicio.

## D2. Trabajo asíncrono: BullMQ+Redis vs. Supabase-only vs. QStash/Inngest
- **Contexto**: Vercel serverless **no** mantiene procesos largos (IA + retraso 15–20 min).
- **Alternativas**:
  - (a) **BullMQ + Redis** con worker Node dedicado.
  - (b) Colas sobre Postgres (tabla + `pg_cron`/polling).
  - (c) Servicio gestionado tipo **Inngest/QStash** (HTTP + reintentos, sin infra propia).
- **Recomendación**: **(a) BullMQ + Redis** como diseño principal, con **(c) como alternativa
  válida** si no se quiere operar un worker/Redis.
- **Justificación**: BullMQ ofrece prioridades (Express > Premium), *delayed jobs* (retraso
  configurable), reintentos con backoff e idempotencia, todo estándar. Requiere un host para el
  worker (Railway/Render/Fly) y Redis gestionado (Upstash). Si se prefiere cero-ops, Inngest/QStash
  cubren reintentos y *delays* vía HTTP, a cambio de acoplarse al proveedor. **(b)** es viable
  pero reinventa scheduling y escala peor. **El código encapsula la cola tras una interfaz**
  (`server/queue`) para poder cambiar de (a) a (c) sin tocar el dominio.

## D3. Acceso a datos: SDK Supabase vs. ORM (Drizzle) vs. SQL crudo
- **Alternativas**: (a) `@supabase/supabase-js` en repositorios; (b) **Drizzle ORM**;
  (c) SQL crudo con `postgres`.
- **Recomendación**: **repositorios que usan el SDK de Supabase para lecturas con RLS** en el
  contexto del usuario, y **Drizzle (o SQL) con service role** para operaciones de dominio del
  servidor/worker (transiciones, pagos, generación).
- **Justificación**: aprovecha **RLS** para consultas del cliente (defensa en profundidad) y
  tipado/control fino para la lógica crítica del servidor. Drizzle da migraciones y tipos sin el
  peso de un ORM completo. Se mantiene todo el SQL detrás de la capa de repositorios.

## D4. Proveedor de IA: OpenAI vs. Gemini (capa de abstracción)
- **Recomendación**: **interfaz `AiProvider` común** (`generateReading(input): Draft`) con
  implementaciones intercambiables; proveedor por defecto configurable por env.
- **Justificación**: evita *lock-in*, permite comparar costo/calidad y hacer *failover*. Cada
  generación registra `model` y `prompt_version_id` (trazabilidad y reproducibilidad).

## D5. Pagos: Mercado Pago primero, Stripe por adapter
- **Recomendación**: interfaz `PaymentProvider` (`createPreference`, `verifyWebhook`,
  `getPayment`) con adapter **Mercado Pago** ahora y **Stripe** después.
- **Justificación**: MP es el estándar en Argentina (RNF-10). La abstracción permite sumar
  métodos sin reescribir el sistema. **La confirmación es siempre por webhook verificado**
  (firma + monto + moneda + orden) y **idempotente** (`payment_events` con clave única).

## D6. Autenticación: Supabase Auth
- **Recomendación**: **Supabase Auth** (email/OAuth) con JWT; roles en `profiles.role_id`.
- **Justificación**: integra RLS de forma nativa (el JWT lleva `auth.uid()`), reduce superficie
  propia de seguridad y sirve igual a web y futura app móvil.

## D7. Notificaciones: Resend/SMTP + in-app, WhatsApp extensible
- **Recomendación**: interfaz `NotificationChannel`; canales `email` (Resend o SMTP) e `in_app`
  al inicio; `whatsapp` como implementación futura **sin credenciales en el repo**.
- **Justificación**: extensibilidad sin acoplar el dominio; reintentos y registro por
  `notification_deliveries`.

## D8. Validación: Zod en el borde y compartido
- **Recomendación**: esquemas **Zod** en `src/schemas`, usados por formularios (react-hook-form)
  y por route handlers; inferencia de tipos a dominio.
- **Justificación**: una sola fuente de verdad de validación cliente/servidor.

## D9. Testing: Vitest + Testing Library + Playwright
- **Recomendación**: **Vitest** (unit/integration), **Playwright** (e2e de flujos críticos,
  usando el Chromium preinstalado del entorno). Cobertura obligatoria de: webhooks duplicados,
  transiciones de estado, control de acceso a archivos.
- **Justificación**: rápido, TS-nativo, e2e realista para el flujo pago→IA→revisión→entrega.

## D10. Animaciones: framer-motion sobrio
- **Recomendación**: `framer-motion` con animaciones limitadas (volteo/selección de cartas),
  respetando `prefers-reduced-motion` y rendimiento móvil (RNF-06).

---

## Resumen de recomendaciones

| Tema | Elección | Alternativa preparada |
|------|----------|------------------------|
| Arquitectura | Monolito modular + worker | Extraer servicios |
| Colas | BullMQ + Redis | Inngest/QStash (interfaz) |
| Datos | Supabase SDK (RLS) + Drizzle/SQL (server) | SQL crudo |
| IA | Abstracción OpenAI/Gemini | Cambio por env |
| Pagos | Mercado Pago (adapter) | Stripe (adapter) |
| Auth | Supabase Auth + RLS | — |
| Notificaciones | Email + in-app | WhatsApp |
| Validación | Zod compartido | — |
| Testing | Vitest + Playwright | — |
