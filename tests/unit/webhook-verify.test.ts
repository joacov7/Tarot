import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import {
  parseSignatureHeader,
  buildManifest,
  computeSignature,
  verifyMpSignature,
  verifyAmountCurrency,
  mapMpStatus,
} from '@/server/services/payments/webhook-verify';

const SECRET = 'test-webhook-secret';

function signFor(dataId: string, requestId: string | null, ts: string): string {
  const reqPart = requestId ? `request-id:${requestId};` : '';
  const manifest = `id:${dataId};${reqPart}ts:${ts};`;
  const v1 = createHmac('sha256', SECRET).update(manifest).digest('hex');
  return `ts=${ts},v1=${v1}`;
}

describe('parseSignatureHeader', () => {
  it('extrae ts y v1', () => {
    expect(parseSignatureHeader('ts=123,v1=abc')).toEqual({ ts: '123', v1: 'abc' });
  });
  it('tolera espacios', () => {
    expect(parseSignatureHeader('ts=123, v1=abc')).toEqual({ ts: '123', v1: 'abc' });
  });
  it('devuelve null si falta v1 o el header', () => {
    expect(parseSignatureHeader('ts=123')).toBeNull();
    expect(parseSignatureHeader(null)).toBeNull();
  });
});

describe('buildManifest', () => {
  it('incluye request-id cuando existe', () => {
    expect(buildManifest('99', 'req-1', '123')).toBe('id:99;request-id:req-1;ts:123;');
  });
  it('omite request-id cuando es null', () => {
    expect(buildManifest('99', null, '123')).toBe('id:99;ts:123;');
  });
});

describe('verifyMpSignature', () => {
  it('acepta una firma válida', () => {
    const header = signFor('payment-123', 'req-1', '1700000000');
    expect(
      verifyMpSignature({
        dataId: 'payment-123',
        requestId: 'req-1',
        signatureHeader: header,
        secret: SECRET,
      }),
    ).toBe(true);
  });

  it('rechaza una firma con secreto incorrecto', () => {
    const header = signFor('payment-123', 'req-1', '1700000000');
    expect(
      verifyMpSignature({
        dataId: 'payment-123',
        requestId: 'req-1',
        signatureHeader: header,
        secret: 'otro-secreto',
      }),
    ).toBe(false);
  });

  it('rechaza si el data.id fue manipulado', () => {
    const header = signFor('payment-123', 'req-1', '1700000000');
    expect(
      verifyMpSignature({
        dataId: 'payment-999', // distinto al firmado
        requestId: 'req-1',
        signatureHeader: header,
        secret: SECRET,
      }),
    ).toBe(false);
  });

  it('rechaza header ausente o inválido', () => {
    expect(
      verifyMpSignature({ dataId: 'p', requestId: null, signatureHeader: null, secret: SECRET }),
    ).toBe(false);
  });

  it('la firma calculada coincide con el manifiesto esperado', () => {
    const manifest = buildManifest('p1', 'r1', '10');
    const expected = createHmac('sha256', SECRET).update(manifest).digest('hex');
    expect(computeSignature(manifest, SECRET)).toBe(expected);
  });
});

describe('verifyAmountCurrency', () => {
  const order = { amountTotal: 7900, currency: 'ARS' };

  it('acepta monto y moneda coincidentes', () => {
    expect(verifyAmountCurrency(order, { amount: 7900, currency: 'ARS' })).toEqual({ ok: true });
  });
  it('tolera diferencia de centavos', () => {
    expect(verifyAmountCurrency(order, { amount: 7900.005, currency: 'ARS' })).toEqual({ ok: true });
  });
  it('rechaza monto distinto', () => {
    const r = verifyAmountCurrency(order, { amount: 100, currency: 'ARS' });
    expect(r.ok).toBe(false);
  });
  it('rechaza moneda distinta', () => {
    const r = verifyAmountCurrency(order, { amount: 7900, currency: 'USD' });
    expect(r.ok).toBe(false);
  });
  it('rechaza pago sin monto', () => {
    const r = verifyAmountCurrency(order, { amount: null, currency: 'ARS' });
    expect(r.ok).toBe(false);
  });
});

describe('mapMpStatus', () => {
  it('mapea estados de MP a PaymentStatus', () => {
    expect(mapMpStatus('approved')).toBe('approved');
    expect(mapMpStatus('authorized')).toBe('approved');
    expect(mapMpStatus('rejected')).toBe('rejected');
    expect(mapMpStatus('refunded')).toBe('refunded');
    expect(mapMpStatus('charged_back')).toBe('refunded');
    expect(mapMpStatus('cancelled')).toBe('cancelled');
    expect(mapMpStatus('in_process')).toBe('pending');
    expect(mapMpStatus('cualquier-otro')).toBe('pending');
  });
});
