# 09 · Resumen Fase 4 — IA y Procesamiento

Generación asíncrona del borrador con **OpenAI** (detrás de la abstracción `AiProvider`),
orquestada por **Inngest**, con **System Prompt versionado**, reintentos, idempotencia y
límite de regeneración.

---

## 1. Qué se implementó

### Servicio de IA
- **`OpenAiProvider`** (`ai/openai.ts`): implementa `AiProvider`; usa el modelo del plan
  (`gpt-4o-mini` Express / `gpt-4o` Premium) y registra tokens del uso.
- **`buildUserPrompt`** (`ai/prompt.ts`): armado **puro** del prompt del usuario a partir de
  cartas + pregunta + contexto (respeta posición y orientación). El **System Prompt** es
  versionado y proviene de `prompt_versions`.
- **`generateDraftForOrder`** (`ai/generate.ts`): orquestación del borrador.

### Cola asíncrona (Inngest)
- **Cliente y funciones** (`src/inngest/`): evento `tarot/ai.generate` → `generateDraftForOrder`,
  con **reintentos automáticos** (3) y **pasos** (`step.run`).
- **Endpoint** `/api/inngest` (serve) para descubrir/ejecutar funciones.
- **Binding de cola real** (`server/queue/index.ts`): traduce jobs del dominio a eventos de
  Inngest; `delaySeconds` → envío diferido (así se implementa el **retraso configurable** de
  Premium/Express sin HTTP abierto); usa `idempotencyKey`. Si Inngest falla, no rompe el flujo
  de pago (la orden queda en `QUEUED` para reintento) — no se simula que el job corrió.

### Reglas de la generación
- Solo procesa órdenes en **`QUEUED`** (guard idempotente ante reintentos tardíos).
- **Idempotencia** por `ai_generations.idempotency_key` (`ai:<orderId>:<intento>`).
- **Límite de regeneración** `MAX_GENERATIONS = 3` → si se supera, `AI_ERROR`.
- **Trazabilidad**: registra `model` y `prompt_version_id` en cada `ai_generations`.
- **Transiciones**: `QUEUED → AI_GENERATING → AI_DRAFT_READY` (o `AI_ERROR` ante fallo), y
  `tarot_readings.draft_status` acompaña (`GENERATING`/`GENERATED`/`ERROR`).
- **IA vs. humano**: cada generación crea una `reading_revisions` con `source='ai'` y
  `action='draft'`/`'regenerate'`. El contenido queda como **borrador** hasta la aprobación
  humana (Fase 5).

### Refactor
- `transitionOrder` extraído a `server/services/orders/transition.ts` y reutilizado por pagos e IA.

---

## 2. Pruebas (éxito y error) — 75 en total, +10 en esta fase

| Suite | Cubre |
|-------|-------|
| `ai-prompt` (3) | Formato de cartas (posición/orientación/significado), integración de pregunta y contexto, omisión de contexto vacío |
| `ai-generate` (7) | **Generación OK** (transiciones + revisión IA `draft`), **regeneración** (`regenerate`), salto si no está en QUEUED, **límite → AI_ERROR**, sin prompt activo, **idempotencia (duplicado)**, **error del LLM → ERROR/AI_ERROR** |

Todo verde: `typecheck`, `lint`, `build`, `test` (75/75).

---

## 3. Cómo probarlo

- **Unitario** (sin red ni DB): `npm run test`.
- **End-to-end real** (requiere entorno):
  1. `.env.local` con `OPENAI_API_KEY`, `INNGEST_EVENT_KEY`/`INNGEST_SIGNING_KEY`, Supabase.
  2. Aplicar migraciones + seed.
  3. Levantar el dev server de Inngest apuntando a `/api/inngest`.
  4. Al confirmarse un pago (webhook), se emite `tarot/ai.generate`; la función genera el
     borrador y la orden pasa a `AI_DRAFT_READY`.

---

## 4. Pendientes (siguientes fases)
- **Fase 5 (Dashboard humano)**: revisión/edición del borrador, regeneración manual, adjuntar
  audio, aprobar y **encolar entrega** con el retraso configurable (`tarot/reading.deliver`).
- **Fase 5/10 (Entrega y notificaciones)**: función `deliver-reading`, canales de notificación
  (email/in-app) y enlace seguro.
- **Auth UI** para probar el flujo completo con un usuario real.
