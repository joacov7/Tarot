import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getReadingDetailForReader } from '@/server/repositories/reader';
import { listAudioForReading, getSignedAudioUrl } from '@/server/services/readings/audio';
import { StatusBadge } from '@/components/dashboard/StatusBadge';
import { ReviewPanel } from '@/components/dashboard/ReviewPanel';

export const dynamic = 'force-dynamic';

interface DetailPageProps {
  params: { orderId: string };
}

export default async function ReadingDetailPage({ params }: DetailPageProps) {
  const detail = await getReadingDetailForReader(params.orderId);
  if (!detail) notFound();

  const { order, reading, cards, latestAiContent, revisions } = detail;

  const audios = await listAudioForReading(reading.id);
  const audioUrls = (
    await Promise.all(audios.map((a) => getSignedAudioUrl(a.path)))
  ).filter((u): u is string => Boolean(u));

  const workingContent = reading.finalContent ?? latestAiContent ?? '';

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-sm text-mystic-muted hover:text-mystic-text">
          ← Volver al panel
        </Link>
        <StatusBadge status={order.status} />
      </div>

      <h1 className="font-display text-2xl text-mystic-text">Orden {order.id.slice(0, 8)}…</h1>
      <p className="mt-1 text-sm capitalize text-mystic-muted">Modalidad: {order.modality}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Columna izquierda: contexto de la lectura */}
        <section className="flex flex-col gap-4">
          <div className="rounded-xl border border-mystic-border bg-mystic-surface p-4">
            <p className="text-xs uppercase tracking-wide text-mystic-amethyst">Pregunta</p>
            <p className="mt-1 text-mystic-text">{reading.question}</p>
            {reading.context && (
              <>
                <p className="mt-3 text-xs uppercase tracking-wide text-mystic-amethyst">Contexto</p>
                <p className="mt-1 text-sm text-mystic-muted">{reading.context}</p>
              </>
            )}
          </div>

          <div className="rounded-xl border border-mystic-border bg-mystic-surface p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-mystic-amethyst">Cartas</p>
            <ul className="space-y-1 text-sm">
              {cards.map((c, i) => (
                <li key={i} className="text-mystic-text">
                  <span className="text-mystic-muted">{c.positionLabel}:</span> {c.name}
                  {c.orientation === 'reversed' && (
                    <span className="text-mystic-muted"> (invertida)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-mystic-border bg-mystic-surface p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-mystic-amethyst">
              Historial de cambios
            </p>
            {revisions.length === 0 ? (
              <p className="text-sm text-mystic-muted">Sin revisiones aún.</p>
            ) : (
              <ul className="space-y-1 text-xs text-mystic-muted">
                {revisions.map((r, i) => (
                  <li key={i}>
                    <span
                      className={
                        r.source === 'ai' ? 'text-sky-300' : 'text-mystic-gold'
                      }
                    >
                      {r.source === 'ai' ? 'IA' : 'Tarotista'}
                    </span>{' '}
                    · {r.action} · {new Date(r.createdAt).toLocaleString('es-AR')}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Columna derecha: revisión y acciones */}
        <section className="rounded-xl border border-mystic-border bg-mystic-surface p-5">
          <ReviewPanel
            orderId={order.id}
            readingId={reading.id}
            status={order.status}
            initialContent={workingContent}
            aiContent={latestAiContent}
            audioUrls={audioUrls}
          />
        </section>
      </div>
    </main>
  );
}
