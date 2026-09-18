# 00 · Resumen del Producto y Requisitos

> Plataforma de **Tarot Híbrido (IA + Humano)**. Fase 0 — Análisis y Arquitectura.
> Este documento y los del directorio `docs/` constituyen el entregable de la Fase 0.
> **No se ha escrito código de aplicación.** Se espera aprobación antes de la Fase 1.

---

## 1. Resumen del producto

Plataforma web donde un cliente solicita una **lectura de tarot**. La **IA genera un borrador**
coherente con las cartas elegidas y el contexto, y un **tarotista humano** lo revisa, edita,
opcionalmente adjunta un audio, aprueba y entrega. El pago se confirma exclusivamente por
**webhook verificado** del proveedor (Mercado Pago primero; Stripe preparado por abstracción).

Dos modalidades comerciales:

| Modalidad | Prioridad de cola | Borrador IA | Revisión humana | Entrega | Precio |
|-----------|-------------------|-------------|-----------------|---------|--------|
| **Premium** | Normal | Sí | Completa y personalizada | Plazo mayor, más elaborada | Mayor |
| **Express** | Alta | Sí | Según servicio contratado | Más rápida | Diferenciado |

### Posicionamiento y encuadre ético (obligatorio)

- La IA **no** se presenta como persona real ni afirma poderes sobrenaturales.
- Las lecturas se ofrecen como **experiencia espiritual, recreativa y de reflexión**.
- **No** se garantizan predicciones ni resultados; **no** es asesoramiento médico, legal ni financiero.
- Todo contenido de IA queda **identificado como borrador** hasta la aprobación humana.
- Se distingue siempre lo generado por IA de las decisiones/modificaciones del tarotista.

---

## 2. Requisitos funcionales (RF)

| ID | Requisito |
|----|-----------|
| RF-01 | Registro / inicio de sesión de clientes (Supabase Auth). |
| RF-02 | Catálogo de servicios (Premium / Express) con precios y plazos. |
| RF-03 | Mesa de tarot interactiva: mazo de 78 cartas, selección de N cartas, orientación. |
| RF-04 | Captura de pregunta y contexto del cliente, con validación. |
| RF-05 | Resumen de compra previo al pago. |
| RF-06 | Checkout con Mercado Pago (Stripe por abstracción). |
| RF-07 | Confirmación de pago **solo** por webhook verificado e idempotente. |
| RF-08 | Creación de orden con máquina de estados validada y auditada. |
| RF-09 | Generación asíncrona de borrador por IA (cola), con reintentos e idempotencia. |
| RF-10 | Registro de modelo y versión de prompt en cada generación. |
| RF-11 | Dashboard del tarotista: listar, filtrar, buscar, abrir órdenes. |
| RF-12 | Edición del borrador, regeneración con límites, adjuntar audio, aprobar y entregar. |
| RF-13 | Historial de revisiones (diferencia IA vs. humano). |
| RF-14 | Notificaciones (email + in-app), extensible a WhatsApp, con reintentos y registro. |
| RF-15 | Retraso configurable de entrega para experiencia Premium/Express (por cola, no HTTP abierto). |
| RF-16 | Historial y seguimiento de estado para el cliente. |
| RF-17 | Enlace seguro y privado para acceder a la lectura y al audio. |
| RF-18 | Panel administrativo: gestión de servicios, precios, prompts, usuarios/roles. |
| RF-19 | Registro de auditoría de acciones sensibles. |

## 3. Requisitos no funcionales (RNF)

| ID | Requisito |
|----|-----------|
| RNF-01 | **Seguridad**: RLS en Supabase, autorización por roles, protección de órdenes ajenas. |
| RNF-02 | **Pagos**: nunca marcar pagada una orden por retorno del navegador; verificación de monto/moneda/orden. |
| RNF-03 | **Idempotencia**: webhooks y jobs no duplican confirmaciones ni generaciones. |
| RNF-04 | **Privacidad**: mínimos datos personales, audio en almacenamiento privado, anonimización cuando proceda. |
| RNF-05 | **Escalabilidad**: diseño apto para miles de usuarios; trabajo pesado fuera del request HTTP. |
| RNF-06 | **Rendimiento**: Mobile First, animaciones sobrias, TTFB bajo, imágenes/cartas optimizadas. |
| RNF-07 | **Mantenibilidad**: TypeScript estricto, capas separadas, errores centralizados. |
| RNF-08 | **Observabilidad**: logs estructurados, métricas de cola, trazabilidad de estados. |
| RNF-09 | **Confiabilidad**: reintentos con backoff, colas persistentes, sin estados inconsistentes. |
| RNF-10 | **Cumplimiento legal**: Ley 25.326 (Argentina) y encuadre de consentimiento informado. |
| RNF-11 | **Portabilidad móvil**: API y contratos preparados para futuras apps móviles. |

---

## 4. Actores y roles

- **Visitante**: navega el catálogo, arma una tirada, no autenticado.
- **Cliente** (`client`): compra, ve su historial y sus lecturas entregadas.
- **Tarotista** (`reader`): revisa/edita borradores, adjunta audio, aprueba y entrega.
- **Administrador** (`admin`): gestiona servicios, precios, prompts, usuarios y auditoría.
- **Sistema/Worker**: procesos de cola (IA, notificaciones, entrega diferida).

Ver detalle de permisos en `docs/03-esquema-base-datos.md` (RLS) y `docs/05-decisiones-tecnicas.md`.
