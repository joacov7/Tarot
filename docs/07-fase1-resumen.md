# 07 · Resumen Fase 1 — Fundación

Entregable de la **Fase 1**. Base del proyecto lista, verificada y reproducible.

---

## 1. Qué se implementó

### Configuración del proyecto
- **Next.js 14 (App Router)** + **React 18** + **TypeScript estricto**
  (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`).
- **Tailwind CSS** con tema oscuro/místico base y respeto a `prefers-reduced-motion`.
- **ESLint** (config Next) + **Prettier** (con plugin de Tailwind).
- **Vitest** (unit/integration) + **Playwright** preparado para e2e.
- Alias de imports `@/*` → `src/*`.
- `.env.example` con **solo nombres** de variables (sin secretos).
- `.npmrc` con `legacy-peer-deps` (resuelve un conflicto de peers opcionales de Inngest).

### Base de datos (migraciones versionadas + seed)
- `supabase/migrations/0001_init.sql`: **20 tablas** del esquema (docs/03) con PK/FK,
  índices, CHECKs, `UUID`, triggers de `updated_at`. Incluye `service_plans`
  (**precios configurables**).
- `supabase/migrations/0002_rls.sql`: **RLS deny-by-default** con helpers de rol
  (`current_role_name`, `is_admin`, `is_reader`) y políticas por tabla.
- `supabase/migrations/0003_storage.sql`: **bucket privado** `reading-audio` (acceso solo
  por URL firmada / reader-admin).
- `supabase/seed/seed.sql`: roles, tiradas `one-card` y `three-card` con posiciones,
  planes `express`/`premium` con **precios de ejemplo editables**, prompt v1 (con encuadre
  ético) y las **78 cartas**.

### Estructura modular (capas separadas)
- `src/config/env.ts`: validación tipada de entorno con **Zod** (público vs. servidor).
- `src/lib/supabase/`: clientes **browser**, **server (RLS)** y **admin (service role)**.
- `src/types/domain.ts`: enums de dominio (roles, estados de orden y de borrador, etc.).
- `src/server/domain/order-state-machine.ts`: **máquina de estados** (transiciones válidas,
  actor responsable, estados terminales, errores tipados).
- `src/server/auth/session.ts`: sesión + rol del usuario.
- `src/server/permissions/rbac.ts`: RBAC de aplicación (defensa en profundidad sobre RLS).
- `src/schemas/reading.ts`: validación Zod de la orden + coherencia de selección de cartas.
- **Contratos (interfaces) que fijan las fronteras** para fases siguientes, sin implementación
  falsa: `services/ai/provider.ts`, `services/payments/provider.ts`, `queue/queue.ts`,
  `services/notifications/channel.ts`.
- `src/app/`: layout, landing con disclaimers, `globals.css`.
- `src/middleware.ts`: refresco de sesión de Supabase.

---

## 2. Pruebas realizadas (éxito y error)

| Verificación | Resultado |
|--------------|-----------|
| `npm run typecheck` (tsc estricto) | ✅ sin errores |
| `npm run lint` (ESLint) | ✅ sin warnings ni errores |
| `npm run build` (producción) | ✅ compila y genera páginas |
| `npm run test` (Vitest) | ✅ **15/15** |

Cobertura de tests en esta fase:
- **Máquina de estados** (`tests/unit/order-state-machine.test.ts`): flujo feliz completo;
  rechazo de saltos arbitrarios; el cliente **no** puede aprobar; un reader **no** confirma
  pagos; estados terminales sin salida; mensaje de error con destinos válidos.
- **Selección de cartas** (`tests/unit/reading-selection.test.ts`): validación Zod de la orden;
  rechazo de pregunta corta y de selección vacía; cantidad de cartas incorrecta; **cartas y
  posiciones repetidas** rechazadas.

---

## 3. Cómo probarlo

```bash
npm install
npm run typecheck   # tipos estrictos
npm run lint        # estilo
npm run test        # unit/integration (no requiere DB ni red)
npm run build       # build de producción

# Para levantar la app (requiere .env.local con claves de Supabase):
cp .env.example .env.local   # y completar
npm run dev                  # http://localhost:3000
```

**Base de datos** (cuando conectes Supabase): aplicar en orden
`0001_init.sql`, `0002_rls.sql`, `0003_storage.sql` y luego `seed/seed.sql`
(vía Supabase CLI o el editor SQL del panel).

---

## 4. Pendientes / próximos pasos (Fase 2 — Experiencia del cliente)
- Landing definitiva, catálogo de servicios (lee `service_plans`), **mesa de tarot interactiva**
  (mazo de 78, selección con orientación, semilla verificable), formulario de pregunta y
  resumen de compra.
- Implementaciones reales de los contratos llegan en sus fases: pagos (Fase 3), IA + cola
  (Fase 4), dashboard humano (Fase 5).

> Nada de la lógica de pago/IA/entrega está "simulada como operativa": en esta fase son
> **interfaces** que fijan las fronteras del sistema; sus implementaciones se agregan por fase.
