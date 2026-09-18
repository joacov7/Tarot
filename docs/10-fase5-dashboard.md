# 10 · Resumen Fase 5 — Dashboard del Tarotista

Panel protegido para operadores humanos: revisar el borrador de IA, editarlo, regenerarlo,
adjuntar audio, aprobar y **programar la entrega** con el retraso configurable.

---

## 1. Qué se implementó

### Autenticación y autorización
- **Login** (`/login`) con Supabase Auth (email/contraseña), server actions `signInAction` /
  `signOutAction`.
- **Guards** por rol (`requireUser`, `requireReader`, `requireAdmin`): el dashboard exige rol
  `reader` o `admin`. Defensa en profundidad sobre las políticas RLS.

### Dashboard
- **Listado** (`/dashboard`): órdenes con **filtros** rápidos por estado, **búsqueda** por
  identificador de orden, prioridad primero (urgentes arriba). Lectura con cliente **RLS**.
- **Detalle** (`/dashboard/[orderId]`): pregunta, contexto, cartas, **historial de cambios**
  (diferencia IA vs. tarotista) y panel de revisión.

### Acciones del tarotista (server actions + servicios de dominio)
- **Abrir para revisión**: `AI_DRAFT_READY → HUMAN_REVIEW`.
- **Editar y guardar**: registra `reading_revisions` (`source='human'`, `action='edit'`).
- **Regenerar con IA**: nuevo borrador sin cambiar el estado (queda en `HUMAN_REVIEW`), respeta
  el límite y la idempotencia; registra revisión `source='ai'`, `action='regenerate'`.
- **Adjuntar audio**: subida al **bucket privado**; acceso solo por **URL firmada**.
- **Aprobar y enviar**: `HUMAN_REVIEW → APPROVED`, marca `is_ai_draft=false` y **encola la
  entrega** con `delaySeconds` = retraso del plan.
- **Entregar ahora** (operación): entrega inmediata omitiendo el retraso.

### Entrega (worker)
- **`deliverReading`** (`APPROVED → DELIVERED`): marca la lectura entregada, crea la
  notificación in-app y **encola el envío** por email (canal real en la fase de notificaciones).
  Idempotente. Función Inngest `deliver-reading` registrada en `/api/inngest`.

---

## 2. Pruebas (éxito y error) — 87 en total, +12 en esta fase

| Suite | Cubre |
|-------|-------|
| `review` (7) | Abrir (AI_DRAFT_READY→HUMAN_REVIEW / ya abierta / skip), guardar edición (revisión human/edit; rechazo fuera de revisión), **aprobar + programar entrega con el retraso del plan**, rechazo de aprobar fuera de revisión |
| `deliver` (2) | `APPROVED→DELIVERED` + notificación + encola envío; idempotencia si no está en APPROVED |
| `ai-generate` (+3) | Regeneración en revisión (sin cambiar estado, reemplaza texto, revisión `regenerate`), límite, skip fuera de revisión |

Todo verde: `typecheck`, `lint`, `build`, `test` (87/87). Login verificado visualmente.

---

## 3. Cómo probarlo

- **Unitario**: `npm run test`.
- **End-to-end** (requiere entorno): crear un usuario con rol `reader` en `profiles`, iniciar
  sesión en `/login`, y desde el dashboard abrir una orden en `AI_DRAFT_READY`, editar,
  (opcional) regenerar, adjuntar audio, aprobar → la entrega se programa por cola.

### Seguridad
- Solo `reader`/`admin` acceden al dashboard (guard + RLS).
- El cliente **no** puede cambiar estados ni aprobar (todo pasa por server actions con guard).
- Audio en bucket privado, servido por URL firmada temporal.
- Toda edición/aprobación queda auditada (`reading_revisions` + `audit_logs`).

---

## 4. Pendientes (siguientes fases)
- **Notificaciones (email/in-app) reales** y **enlace seguro** de entrega (Fase 10).
- **Historial del cliente** `/mis-lecturas` y vista de la lectura entregada.
- **Panel administrativo**: servicios/precios, versiones de prompt, usuarios/roles.
- **Registro de usuarios** (signup) además del login.
