# 04 · Estructura de Carpetas y Dependencias

---

## 1. Estructura propuesta (monorepo ligero, un solo `package.json` inicial)

```
tarot/
├─ docs/                          # Fase 0 (este material)
├─ supabase/
│  ├─ migrations/                 # SQL versionado (0001_init.sql, ...)
│  ├─ seed/                       # cartas, spreads, roles, prompt v1
│  └─ config.toml
├─ src/
│  ├─ app/                        # Next.js App Router
│  │  ├─ (marketing)/             # landing, catálogo
│  │  ├─ (client)/                # mesa, checkout, seguimiento, historial
│  │  │  ├─ mesa/
│  │  │  ├─ checkout/
│  │  │  └─ mis-lecturas/
│  │  ├─ (reader)/dashboard/      # panel tarotista (protegido)
│  │  ├─ (admin)/admin/           # panel admin (protegido)
│  │  └─ api/
│  │     ├─ orders/route.ts
│  │     ├─ readings/route.ts
│  │     └─ webhooks/
│  │        └─ mercadopago/route.ts
│  ├─ components/                 # UI reutilizable (Tarjeta, Mazo, Estados)
│  │  ├─ ui/                      # botones, inputs, toasts
│  │  └─ tarot/                   # MesaTarot, Carta, Tirada
│  ├─ features/                   # opcional: agrupación por dominio (UI+hooks)
│  ├─ server/
│  │  ├─ services/                # lógica de negocio (dominio)
│  │  │  ├─ orders/               # máquina de estados
│  │  │  ├─ payments/             # adapters MP/Stripe, verificación webhook
│  │  │  ├─ ai/                   # capa de abstracción LLM + prompts
│  │  │  ├─ readings/
│  │  │  ├─ notifications/
│  │  │  └─ users/
│  │  ├─ repositories/            # acceso a datos (Supabase/pg)
│  │  ├─ auth/                    # sesión, guards por rol
│  │  ├─ permissions/             # RBAC helpers
│  │  └─ queue/                   # BullMQ: colas + productores
│  ├─ workers/                    # proceso worker (consumidores de cola)
│  │  ├─ index.ts
│  │  ├─ ai-generate.worker.ts
│  │  ├─ deliver-reading.worker.ts
│  │  └─ send-notification.worker.ts
│  ├─ lib/                        # clientes (supabase, redis), utils
│  ├─ schemas/                    # validaciones Zod (compartidas)
│  ├─ types/                      # tipos compartidos (DB, dominio, API)
│  └─ config/                     # env tipado, constantes
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/                        # Playwright (flujos críticos)
├─ .env.example                   # solo nombres de variables, sin secretos
├─ package.json
├─ tsconfig.json
├─ tailwind.config.ts
├─ vitest.config.ts
└─ playwright.config.ts
```

Principio: **separar UI, servicios, repositorios, validaciones, integraciones, workers, auth y
permisos**. Nada de SQL en componentes ni lógica de negocio en rutas API.

---

## 2. Dependencias propuestas (a fijar versiones en Fase 1)

**Núcleo**
- `next`, `react`, `react-dom`, `typescript`
- `tailwindcss`, `postcss`, `autoprefixer`
- `zod` (validación), `@supabase/supabase-js`, `@supabase/ssr`

**Datos / colas**
- `bullmq`, `ioredis`
- (opción) `drizzle-orm` o `postgres` para repositorios tipados — ver `docs/05`

**Integraciones**
- `mercadopago` (SDK oficial); `stripe` (cuando se active)
- `openai` y/o `@google/generative-ai` detrás de una interfaz común
- `resend` (o nodemailer/SMTP) para email

**UI/UX**
- `framer-motion` (animaciones de cartas, sobrias)
- `lucide-react` (íconos), `clsx`/`tailwind-merge`
- `react-hook-form` + `@hookform/resolvers` (formularios con Zod)

**Calidad**
- `vitest` + `@testing-library/react` (unit/integration)
- `@playwright/test` (e2e; usar Chromium preinstalado del entorno)
- `eslint`, `prettier`, `typescript` estricto

---

## 3. Variables de entorno (`.env.example`, sin valores)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=            # solo servidor/worker

# Base de datos (si se usa cliente pg/drizzle directo)
DATABASE_URL=

# Redis / colas
REDIS_URL=

# Pagos
MP_ACCESS_TOKEN=
MP_WEBHOOK_SECRET=
STRIPE_SECRET_KEY=                    # futuro
STRIPE_WEBHOOK_SECRET=                # futuro

# IA
AI_PROVIDER=openai                    # openai | gemini
OPENAI_API_KEY=
GEMINI_API_KEY=

# Email
RESEND_API_KEY=
EMAIL_FROM=

# App
APP_BASE_URL=
SIGNED_URL_TTL_SECONDS=3600
```

> Ningún secreto se versiona. `.env.example` contiene **solo nombres**.
