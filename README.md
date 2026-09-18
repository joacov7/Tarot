# Tarot Híbrido (IA + Humano)

Plataforma web de lecturas de tarot donde la **IA genera un borrador** y un **tarotista humano**
lo revisa, personaliza, aprueba y entrega. Encuadre **recreativo/reflexivo**: la IA no se presenta
como persona real ni afirma poderes sobrenaturales; no se garantizan predicciones ni resultados.

> **Estado actual: Fase 0 — Análisis y Arquitectura.**
> Solo documentación de diseño. **No hay código de aplicación** todavía.
> Pendiente de aprobación para iniciar la Fase 1.

## Documentación de diseño (`docs/`)

| Doc | Contenido |
|-----|-----------|
| [00 · Resumen del producto](docs/00-resumen-producto.md) | Producto, requisitos funcionales/no funcionales, roles. |
| [01 · Arquitectura](docs/01-arquitectura.md) | Arquitectura del sistema y diagrama de componentes. |
| [02 · Flujos y estados](docs/02-flujos-y-estados.md) | Flujo de usuario y máquinas de estado (orden y borrador). |
| [03 · Base de datos](docs/03-esquema-base-datos.md) | Esquema PostgreSQL, ERD, relaciones y RLS. |
| [04 · Estructura de carpetas](docs/04-estructura-carpetas.md) | Organización del código y dependencias. |
| [05 · Decisiones técnicas](docs/05-decisiones-tecnicas.md) | Comparativas y recomendaciones. |
| [06 · Riesgos, costos y escalabilidad](docs/06-riesgos-costos-escalabilidad.md) | Riesgos, costos y decisiones pendientes. |

## Stack propuesto (resumen)

- **Frontend/API**: Next.js (App Router) + React + TypeScript + Tailwind (Mobile First).
- **Datos/Auth/Storage**: Supabase (PostgreSQL + RLS + Auth + Storage privado).
- **Asíncrono**: BullMQ + Redis (worker dedicado) para IA, notificaciones y entrega diferida.
- **Pagos**: Mercado Pago (adapter), Stripe preparado por abstracción.
- **IA**: capa de abstracción OpenAI/Gemini, con System Prompt versionado.

## Próximo paso

Revisar la documentación de `docs/` y aprobar para comenzar la **Fase 1 — Fundación**.
Ver decisiones pendientes en [docs/06 §4](docs/06-riesgos-costos-escalabilidad.md).
