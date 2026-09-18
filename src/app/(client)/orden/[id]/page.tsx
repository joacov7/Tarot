import Link from 'next/link';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { ORDER_STATUS_LABEL } from '@/lib/tarot/order-status';
import { formatPrice } from '@/lib/utils/format';
import type { OrderStatus } from '@/types/domain';

export const dynamic = 'force-dynamic';

interface OrderPageProps {
  params: { id: string };
  searchParams: { estado?: string };
}

interface OrderView {
  status: OrderStatus;
  amount_total: number;
  currency: string;
  created_at: string;
}

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const returnState = searchParams.estado;

  let order: OrderView | null = null;

  if (isSupabaseConfigured()) {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from('orders')
      .select('status, amount_total, currency, created_at')
      .eq('id', params.id)
      .maybeSingle();
    order = (data as OrderView | null) ?? null;
  }

  const info = order ? ORDER_STATUS_LABEL[order.status] : null;

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-2xl text-mystic-text">Seguimiento de tu lectura</h1>
      <p className="mt-1 text-sm text-mystic-muted">
        Orden <code className="text-mystic-text">{params.id}</code>
      </p>

      {returnState === 'exito' && (
        <p className="mt-4 rounded-lg border border-mystic-amethyst/40 bg-mystic-surface p-3 text-sm text-mystic-text">
          Recibimos tu regreso desde Mercado Pago. El pago se confirma de forma segura por
          notificación; el estado se actualiza automáticamente en cuanto se acredita.
        </p>
      )}
      {returnState === 'error' && (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-mystic-surface p-3 text-sm text-red-300">
          El pago no se completó. Podés intentar nuevamente desde el servicio elegido.
        </p>
      )}

      <div className="mt-6 rounded-xl border border-mystic-border bg-mystic-surface p-5">
        {info ? (
          <>
            <p className="text-xs uppercase tracking-wide text-mystic-amethyst">Estado</p>
            <p className="font-display text-xl text-mystic-gold">{info.label}</p>
            <p className="mt-1 text-sm text-mystic-muted">{info.description}</p>
            {order && (
              <p className="mt-3 text-sm text-mystic-text">
                Total: {formatPrice(order.amount_total, order.currency)}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-mystic-muted">
            No encontramos esta orden o todavía no hay conexión a la base de datos. Si acabás de
            pagar, el estado aparecerá aquí en breve.
          </p>
        )}
      </div>

      <div className="mt-6 flex gap-2">
        <Link
          href="/servicios"
          className="rounded-lg border border-mystic-border px-4 py-2 text-sm text-mystic-text hover:bg-mystic-surface"
        >
          Volver a servicios
        </Link>
      </div>
    </main>
  );
}
