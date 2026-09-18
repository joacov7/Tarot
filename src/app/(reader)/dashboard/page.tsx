import Link from 'next/link';
import { listOrdersForReader } from '@/server/repositories/reader';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { cn } from '@/lib/utils/cn';
import { ORDER_STATUSES, type OrderStatus } from '@/types/domain';

export const dynamic = 'force-dynamic';

interface DashboardPageProps {
  searchParams: { estado?: string; modalidad?: string; q?: string };
}

const QUICK_FILTERS: Array<{ label: string; status?: OrderStatus }> = [
  { label: 'Todas' },
  { label: 'Borrador listo', status: 'AI_DRAFT_READY' },
  { label: 'En revisión', status: 'HUMAN_REVIEW' },
  { label: 'Aprobadas', status: 'APPROVED' },
  { label: 'Entregadas', status: 'DELIVERED' },
  { label: 'Con error', status: 'AI_ERROR' },
];

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const status =
    searchParams.estado && (ORDER_STATUSES as readonly string[]).includes(searchParams.estado)
      ? (searchParams.estado as OrderStatus)
      : undefined;
  const modality =
    searchParams.modalidad === 'premium' || searchParams.modalidad === 'express'
      ? searchParams.modalidad
      : undefined;
  const q = searchParams.q?.trim() || undefined;

  const orders = await listOrdersForReader({ status, modality, q });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {QUICK_FILTERS.map((f) => (
          <Link
            key={f.label}
            href={{ pathname: '/dashboard', query: f.status ? { estado: f.status } : {} }}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition',
              status === f.status || (!status && !f.status)
                ? 'border-mystic-gold bg-mystic-gold/10 text-mystic-gold'
                : 'border-mystic-border text-mystic-muted hover:text-mystic-text',
            )}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <form className="mb-6 flex gap-2" action="/dashboard">
        {status && <input type="hidden" name="estado" value={status} />}
        <input
          name="q"
          defaultValue={q}
          placeholder="Buscar por identificador de orden…"
          className="w-full max-w-md rounded-lg border border-mystic-border bg-mystic-bg px-3 py-2 text-sm text-mystic-text focus:border-mystic-amethyst focus:outline-none"
        />
        <button className="rounded-lg border border-mystic-border px-4 py-2 text-sm text-mystic-text hover:bg-mystic-surface">
          Buscar
        </button>
      </form>

      {orders.length === 0 ? (
        <p className="text-sm text-mystic-muted">No hay órdenes para este filtro.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-mystic-border">
          <table className="w-full text-sm">
            <thead className="bg-mystic-surface/60 text-left text-mystic-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Orden</th>
                <th className="px-4 py-2 font-medium">Pregunta</th>
                <th className="px-4 py-2 font-medium">Modalidad</th>
                <th className="px-4 py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-mystic-border hover:bg-mystic-surface/40">
                  <td className="px-4 py-2">
                    <Link href={`/dashboard/${o.id}`} className="text-mystic-gold hover:underline">
                      {o.id.slice(0, 8)}…
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-4 py-2 text-mystic-text">{o.question}</td>
                  <td className="px-4 py-2 capitalize text-mystic-muted">{o.modality}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
