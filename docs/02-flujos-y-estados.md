# 02 · Flujo de Usuario y Máquina de Estados de Órdenes

---

## 1. Flujo completo del cliente

```mermaid
flowchart TD
    A["Ingresa a la plataforma"] --> B["Explora catálogo de servicios"]
    B --> C{"¿Premium o Express?"}
    C --> D["Selecciona cantidad de cartas y tipo de tirada"]
    D --> E["Mesa de tarot: elige N cartas (posición + orientación)"]
    E --> F["Escribe/elige su pregunta"]
    F --> G["Agrega contexto opcional"]
    G --> H["Selecciona medio de entrega"]
    H --> I["Resumen de compra (precio, plazo, modalidad)"]
    I --> J["Checkout: Mercado Pago"]
    J --> K{"Webhook verificado"}
    K -- aprobado --> L["Orden PAID · se encola generación IA"]
    K -- rechazado --> Z["PAYMENT_FAILED · reintentar pago"]
    L --> M["AI_GENERATING → AI_DRAFT_READY"]
    M --> N["HUMAN_REVIEW: tarotista edita"]
    N --> O["Adjunta audio (opcional)"]
    O --> P["APPROVED"]
    P --> Q["Retraso configurable (cola) según modalidad"]
    Q --> R["DELIVERED · notificación + enlace seguro"]
    R --> S["Cliente consulta historial y estado"]
```

### Reglas fundamentales del flujo
- **Nunca** marcar pagada una orden por el retorno del navegador; solo por **webhook verificado**.
- Una notificación de pago **no** confirma dos veces la misma orden (**idempotencia**).
- **No** se entrega la lectura antes de cumplir las condiciones del servicio (aprobación + retraso).
- Todo cambio de estado relevante se **registra** (`audit_logs` + timestamps por transición).
- El cliente **no** puede modificar precio, estado de pago ni aprobación desde el frontend.

---

## 2. Máquina de estados de la ORDEN

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT
    PENDING_PAYMENT --> PAID: webhook pago aprobado (idempotente)
    PENDING_PAYMENT --> PAYMENT_FAILED: webhook rechazado
    PENDING_PAYMENT --> EXPIRED: TTL sin pago
    PENDING_PAYMENT --> CANCELLED: cliente/admin cancela

    PAYMENT_FAILED --> PENDING_PAYMENT: reintento de pago
    PAYMENT_FAILED --> CANCELLED: abandono

    PAID --> QUEUED: encolado job IA
    QUEUED --> AI_GENERATING: worker toma el job
    AI_GENERATING --> AI_DRAFT_READY: borrador OK
    AI_GENERATING --> AI_ERROR: fallo LLM (tras reintentos)

    AI_ERROR --> QUEUED: reintento manual/automático
    AI_DRAFT_READY --> HUMAN_REVIEW: tarotista abre la orden

    HUMAN_REVIEW --> AI_DRAFT_READY: regenera borrador (con límite)
    HUMAN_REVIEW --> APPROVED: tarotista aprueba
    APPROVED --> DELIVERED: worker entrega (tras retraso)
    APPROVED --> DELIVERY_ERROR: fallo de entrega

    DELIVERY_ERROR --> APPROVED: reintento de entrega
    DELIVERED --> [*]

    PAID --> REFUNDED: reembolso (admin)
    APPROVED --> REFUNDED: reembolso (admin)
    DELIVERED --> REFUNDED: reembolso (admin)
    CANCELLED --> [*]
    EXPIRED --> [*]
    REFUNDED --> [*]
```

### Tabla de transiciones válidas

| Desde | Hacia | Disparador | Responsable | Efectos |
|-------|-------|-----------|-------------|---------|
| PENDING_PAYMENT | PAID | Webhook aprobado | Sistema (pagos) | Encola `ai-generate`; registra `payment_events` |
| PENDING_PAYMENT | PAYMENT_FAILED | Webhook rechazado | Sistema | Notifica; permite reintento |
| PENDING_PAYMENT | EXPIRED | TTL vencido | Sistema (job) | Libera orden |
| PENDING_PAYMENT | CANCELLED | Acción cliente/admin | Cliente/Admin | Auditoría |
| PAID | QUEUED | Enqueue | Sistema | Job en Redis |
| QUEUED | AI_GENERATING | Worker inicia | Worker | Lock idempotente |
| AI_GENERATING | AI_DRAFT_READY | Borrador OK | Worker | Guarda `ai_generations` |
| AI_GENERATING | AI_ERROR | Fallo tras N reintentos | Worker | Registra error |
| AI_DRAFT_READY | HUMAN_REVIEW | Abre orden | Tarotista | Lock de revisión |
| HUMAN_REVIEW | AI_DRAFT_READY | Regenera | Tarotista | Cuenta contra límite |
| HUMAN_REVIEW | APPROVED | Aprueba | Tarotista | Crea `reading_revision` final |
| APPROVED | DELIVERED | Entrega (post-retraso) | Worker | Notifica + enlace seguro |
| APPROVED | DELIVERY_ERROR | Fallo envío | Worker | Reintento con backoff |
| PAID/APPROVED/DELIVERED | REFUNDED | Reembolso | Admin | Ajuste de pago |

### Invariantes
- El **estado del pago** es independiente del **estado de la lectura** (columnas/tablas separadas).
- Toda transición registra `actor`, `from_status`, `to_status`, `reason`, `created_at`.
- Transiciones no listadas se **rechazan** en el servicio de dominio (no hay saltos arbitrarios).
- El retraso Premium/Express es **tiempo de cola simulado**, separado de los tiempos reales de IA
  y de revisión humana (se modela con `delay` del job, no bloqueando HTTP).

---

## 3. Estados del BORRADOR de IA (independiente de la orden)

```mermaid
stateDiagram-v2
    [*] --> PENDING
    PENDING --> GENERATING
    GENERATING --> GENERATED
    GENERATING --> ERROR
    GENERATED --> IN_REVIEW
    IN_REVIEW --> APPROVED
    IN_REVIEW --> REJECTED
    REJECTED --> PENDING: regenerar (con límite)
    ERROR --> PENDING: reintento
    APPROVED --> [*]
```

El contenido de IA permanece marcado como **borrador** (`is_ai_draft = true`) hasta que una
`reading_revision` humana lo aprueba; solo entonces la lectura es entregable.
