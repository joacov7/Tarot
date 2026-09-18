/** Formatea un monto según su moneda (por defecto es-AR / ARS). */
export function formatPrice(amount: number, currency = 'ARS', locale = 'es-AR'): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString(locale)}`;
  }
}

/**
 * Convierte segundos en un plazo legible aproximado en español.
 * Ej: 3600 → "1 hora", 86400 → "24 horas", 172800 → "2 días".
 */
export function formatDelay(seconds: number): string {
  if (seconds <= 0) return 'inmediata';
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = seconds / 3600;
  if (hours < 24) {
    const h = Math.round(hours);
    return `${h} ${h === 1 ? 'hora' : 'horas'}`;
  }
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? 'día' : 'días'}`;
}
