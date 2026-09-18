import { createHmac, timingSafeEqual } from 'node:crypto';
import type { PaymentStatus } from '@/types/domain';

/**
 * Verificación de webhooks de Mercado Pago (funciones PURAS, testeables).
 *
 * MP firma cada notificación con el header `x-signature: ts=<unix>,v1=<hmac>`.
 * El manifiesto a firmar es: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`
 * y el HMAC-SHA256 se calcula con el secreto del webhook.
 *
 * NUNCA se confía en el retorno del navegador: la confirmación de pago exige
 * firma válida + verificación de monto/moneda/orden.
 */

export interface ParsedSignature {
  ts: string;
  v1: string;
}

export function parseSignatureHeader(header: string | null): ParsedSignature | null {
  if (!header) return null;
  const parts = header.split(',').map((p) => p.trim());
  let ts: string | undefined;
  let v1: string | undefined;
  for (const part of parts) {
    const [key, ...rest] = part.split('=');
    const value = rest.join('=');
    if (key === 'ts') ts = value;
    if (key === 'v1') v1 = value;
  }
  if (!ts || !v1) return null;
  return { ts, v1 };
}

export function buildManifest(dataId: string, requestId: string | null, ts: string): string {
  // El request-id puede faltar; MP lo omite del manifiesto en ese caso.
  const reqPart = requestId ? `request-id:${requestId};` : '';
  return `id:${dataId};${reqPart}ts:${ts};`;
}

export function computeSignature(manifest: string, secret: string): string {
  return createHmac('sha256', secret).update(manifest).digest('hex');
}

/** Comparación en tiempo constante para evitar timing attacks. */
export function safeCompareHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}

export interface VerifySignatureParams {
  dataId: string;
  requestId: string | null;
  signatureHeader: string | null;
  secret: string;
}

export function verifyMpSignature(params: VerifySignatureParams): boolean {
  const { dataId, requestId, signatureHeader, secret } = params;
  if (!secret || !dataId) return false;
  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) return false;
  const manifest = buildManifest(dataId, requestId, parsed.ts);
  const expected = computeSignature(manifest, secret);
  return safeCompareHex(expected, parsed.v1);
}

/**
 * Verifica que el pago corresponde a la orden: mismo monto y moneda.
 * Tolerancia de centavos para evitar falsos negativos por redondeo.
 */
export function verifyAmountCurrency(
  order: { amountTotal: number; currency: string },
  payment: { amount: number | null; currency: string | null },
): { ok: true } | { ok: false; reason: string } {
  if (payment.amount == null || payment.currency == null) {
    return { ok: false, reason: 'Pago sin monto/moneda' };
  }
  if (payment.currency.toUpperCase() !== order.currency.toUpperCase()) {
    return { ok: false, reason: `Moneda no coincide: ${payment.currency} ≠ ${order.currency}` };
  }
  if (Math.abs(payment.amount - order.amountTotal) > 0.01) {
    return { ok: false, reason: `Monto no coincide: ${payment.amount} ≠ ${order.amountTotal}` };
  }
  return { ok: true };
}

/** Mapea el estado crudo de MP a nuestro PaymentStatus. */
export function mapMpStatus(raw: string): PaymentStatus {
  switch (raw) {
    case 'approved':
      return 'approved';
    case 'authorized':
      return 'approved';
    case 'refunded':
    case 'charged_back':
      return 'refunded';
    case 'cancelled':
      return 'cancelled';
    case 'rejected':
      return 'rejected';
    case 'pending':
    case 'in_process':
    case 'in_mediation':
    default:
      return 'pending';
  }
}
