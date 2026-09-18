import { describe, it, expect } from 'vitest';
import { formatPrice, formatDelay } from '@/lib/utils/format';

describe('formatPrice', () => {
  it('formatea ARS sin decimales', () => {
    const s = formatPrice(3500, 'ARS');
    expect(s).toMatch(/3\.500/); // separador de miles es-AR
    expect(s).toMatch(/\$/);
  });

  it('no rompe con una moneda inválida', () => {
    expect(() => formatPrice(1000, 'XXX')).not.toThrow();
  });
});

describe('formatDelay', () => {
  it('0 o negativo → inmediata', () => {
    expect(formatDelay(0)).toBe('inmediata');
    expect(formatDelay(-10)).toBe('inmediata');
  });

  it('minutos', () => {
    expect(formatDelay(1800)).toBe('30 min');
  });

  it('1 hora (singular)', () => {
    expect(formatDelay(3600)).toBe('1 hora');
  });

  it('varias horas', () => {
    expect(formatDelay(7200)).toBe('2 horas');
  });

  it('1 día (singular)', () => {
    expect(formatDelay(86400)).toBe('1 día');
    expect(formatDelay(90000)).toBe('1 día');
  });

  it('varios días', () => {
    expect(formatDelay(172800)).toBe('2 días');
  });
});
