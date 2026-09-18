# 06 · Riesgos, Costos y Escalabilidad

---

## 1. Riesgos técnicos y mitigaciones

| # | Riesgo | Impacto | Mitigación |
|---|--------|---------|------------|
| R1 | Confirmar orden por retorno del navegador (sin webhook) | Fraude / falsos pagos | Confirmación **solo** por webhook verificado; el retorno del navegador solo muestra "en proceso". |
| R2 | Webhook duplicado confirma dos veces | Doble generación / doble entrega | `payment_events UNIQUE (provider, provider_event_id)` + jobs con `idempotency_key`. |
| R3 | Proceso largo (IA + retraso 15–20 min) en función serverless | Timeouts / entregas fallidas | Todo el trabajo largo en **cola/worker**; el retraso es *delayed job*, no HTTP abierto. |
| R4 | Fallo del LLM (rate limit, error, coste) | Sin borrador | Reintentos con backoff, estado `AI_ERROR`, *fallback* de proveedor, límite de regeneración. |
| R5 | Acceso a órdenes/lecturas ajenas | Fuga de datos | **RLS** por `auth.uid()`, escrituras sensibles con service role en servidor, deny-by-default. |
| R6 | Audio accesible públicamente | Fuga de contenido privado | Bucket **privado** + **URLs firmadas** con expiración (`SIGNED_URL_TTL_SECONDS`). |
| R7 | Secretos en el repo | Compromiso total | `.env` fuera de git; `.env.example` solo con nombres; secretos en Vercel/host. |
| R8 | La IA parece humana o promete resultados | Riesgo legal/ético | Encuadre en `prompt_versions`; disclaimers; borrador marcado hasta aprobación humana. |
| R9 | Estados inconsistentes de orden | Datos corruptos | Máquina de estados centralizada, transiciones validadas, `audit_logs`. |
| R10 | Coste de IA no controlado | Gasto imprevisto | Registro de tokens en `ai_generations`, límites de regeneración, modelo por modalidad. |
| R11 | Datos personales (Ley 25.326 AR) | Incumplimiento legal | Consentimiento informado, minimización, *soft delete*/anonimización, auditoría. |
| R12 | Redis/worker caído | Colas detenidas | Redis gestionado (Upstash), reintentos, alertas; alternativa Inngest/QStash. |
| R13 | Cartas manipulables hacia un resultado | Pérdida de confianza | Registro verificable de selección (`drawn_seed`), sin sesgo determinista. |
| R14 | Race condition: dos readers editan la misma orden | Sobrescritura | *Lock* de revisión / `updated_at` optimista al aprobar. |

---

## 2. Costos estimados (orden de magnitud, MVP)

| Servicio | Plan inicial | Notas de costo |
|----------|--------------|----------------|
| Vercel | Hobby/Pro | Frontend + API; el trabajo pesado NO corre aquí. |
| Supabase | Free → Pro | DB + Auth + Storage; Pro al crecer datos/almacenamiento de audio. |
| Redis (Upstash) | Pay-as-you-go | Colas; bajo costo a volumen MVP. |
| Worker host (Railway/Render/Fly) | Instancia pequeña | Proceso Node siempre activo para BullMQ. |
| LLM (OpenAI/Gemini) | Por uso | **Variable dominante**; controlar con tokens y modelo por modalidad. |
| Email (Resend) | Free → por volumen | Confirmaciones y entregas. |
| Mercado Pago | Comisión por transacción | Sin costo fijo; comisión sobre ventas. |

**Principal palanca de costo**: consumo de LLM. Mitigar con prompts eficientes, límites de
regeneración, y elegir modelo por modalidad (Express puede usar un modelo más económico).

---

## 3. Escalabilidad (hacia miles de usuarios)

- **Frontend/API**: Vercel escala horizontalmente; SSR/edge para catálogo y seguimiento.
- **Base de datos**: índices definidos en `docs/03`; consultas por `status`+`priority` para la
  cola de trabajo; *connection pooling* (Supabase/pgbouncer) para serverless.
- **Colas**: BullMQ escala con más *workers* y **concurrencia** ajustable; prioridad para Express.
- **IA**: proceso desacoplado; se puede escalar/independizar sin tocar el resto.
- **Almacenamiento**: audio en Storage con CDN + URLs firmadas.
- **Observabilidad**: logs estructurados, métricas de cola (pendientes, fallidos, latencia),
  trazabilidad de estados por `audit_logs`.
- **Multi-región/móvil**: contratos JSON estables y Auth por JWT permiten sumar apps nativas y,
  eventualmente, regionalización de DB/lecturas.

---

## 4. Decisiones pendientes (requieren tu definición)

1. **Host del worker/Redis**: ¿BullMQ+Redis (Railway/Upstash) o servicio gestionado (Inngest/QStash)?
2. **Proveedor de IA por defecto**: ¿OpenAI o Gemini? ¿Modelo distinto para Express vs. Premium?
3. **Email**: ¿Resend o SMTP propio?
4. **Precios y plazos** concretos de Premium y Express (montos, moneda, tiempos de entrega).
5. **Tiradas iniciales** a soportar en el MVP (¿one-card, three-card, celtic-cross?).
6. **Alcance de audio** en Express (¿incluido, opcional pago, o no disponible?).
7. **Idiomas**: ¿solo `es-AR` en el MVP?

---

## 5. Estado y próximo paso

- **Fase 0 entregada**: arquitectura, componentes, flujos, estados, esquema de DB, relaciones,
  estructura de carpetas, decisiones técnicas, riesgos/costos/escalabilidad.
- **No se ha escrito código de aplicación** (regla del proyecto).
- **Próximo paso**: espero tu **aprobación** y tus definiciones de la sección 4 para iniciar la
  **Fase 1 — Fundación** (proyecto, TS, Tailwind, Supabase, migraciones, auth, roles, env, estructura).
