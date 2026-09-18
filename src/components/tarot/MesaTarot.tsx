'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { RotateCcw, Undo2, Eye, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Carta } from '@/components/tarot/Carta';
import { TAROT_DECK, keywordsFor, type DeckCard } from '@/lib/tarot/deck';
import { shuffledIndices, orientationFor, generateSeed } from '@/lib/tarot/shuffle';
import type { SpreadDef } from '@/lib/tarot/spreads';
import type { Orientation } from '@/types/domain';

const questionSchema = z.object({
  question: z.string().trim().min(5, 'Escribí una pregunta de al menos 5 caracteres.').max(500),
  context: z.string().trim().max(2000).optional(),
});
type QuestionForm = z.infer<typeof questionSchema>;

interface ShuffledEntry {
  deckPosition: number;
  card: DeckCard;
  orientation: Orientation;
}

export interface MesaSelection {
  spreadSlug: string;
  seed: string;
  question: string;
  context?: string;
  cards: Array<{
    code: string;
    name: string;
    positionIndex: number;
    positionLabel: string;
    orientation: Orientation;
  }>;
}

interface MesaTarotProps {
  spread: SpreadDef;
  initialSeed: string;
  /** Plan elegido en el catálogo (opcional: sin plan no se puede pagar). */
  planSlug?: string;
  planLabel?: string;
  planPrice?: string;
}

interface CheckoutState {
  loading: boolean;
  error: string | null;
}

export function MesaTarot({ spread, initialSeed, planSlug, planLabel, planPrice }: MesaTarotProps) {
  const [seed, setSeed] = useState(initialSeed);
  const [picks, setPicks] = useState<number[]>([]);
  const [summary, setSummary] = useState<MesaSelection | null>(null);
  const [checkout, setCheckout] = useState<CheckoutState>({ loading: false, error: null });

  const shuffled = useMemo<ShuffledEntry[]>(() => {
    const order = shuffledIndices(TAROT_DECK.length, seed);
    return order.map((originalIndex, deckPosition) => ({
      deckPosition,
      card: TAROT_DECK[originalIndex]!,
      orientation: orientationFor(seed, deckPosition, spread.allowsReversed),
    }));
  }, [seed, spread.allowsReversed]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionForm>({ resolver: zodResolver(questionSchema) });

  const complete = picks.length === spread.cardCount;

  function pick(deckPosition: number) {
    if (picks.includes(deckPosition) || picks.length >= spread.cardCount) return;
    setPicks((prev) => [...prev, deckPosition]);
  }

  function undo() {
    setPicks((prev) => prev.slice(0, -1));
    setSummary(null);
  }

  function reshuffle() {
    setSeed(generateSeed());
    setPicks([]);
    setSummary(null);
  }

  function positionIndexForPick(deckPosition: number): number | undefined {
    const order = picks.indexOf(deckPosition);
    return order === -1 ? undefined : order + 1;
  }

  function onConfirm(form: QuestionForm) {
    const cards = picks.map((deckPosition, i) => {
      const entry = shuffled[deckPosition]!;
      const position = spread.positions[i]!;
      return {
        code: entry.card.code,
        name: entry.card.name,
        positionIndex: position.index,
        positionLabel: position.label,
        orientation: entry.orientation,
      };
    });
    const selection: MesaSelection = {
      spreadSlug: spread.slug,
      seed,
      question: form.question,
      context: form.context,
      cards,
    };
    // Se guarda para el checkout (Fase 3). No crea orden ni pago todavía.
    try {
      sessionStorage.setItem('tarot:selection', JSON.stringify(selection));
    } catch {
      /* almacenamiento no disponible: el resumen igual se muestra */
    }
    setSummary(selection);
  }

  async function startCheckout() {
    if (!summary || !planSlug) return;
    setCheckout({ loading: true, error: null });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicePlanSlug: planSlug,
          spreadSlug: summary.spreadSlug,
          seed: summary.seed,
          question: summary.question,
          context: summary.context,
          cards: summary.cards.map((c) => ({
            code: c.code,
            positionIndex: c.positionIndex,
            orientation: c.orientation,
          })),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setCheckout({
        loading: false,
        error: data.error ?? 'No se pudo iniciar el pago. Intentá de nuevo.',
      });
    } catch {
      setCheckout({ loading: false, error: 'Error de red. Intentá de nuevo.' });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Encabezado + estado */}
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl text-mystic-text sm:text-3xl">
            Mesa de tarot · {spread.name}
          </h1>
          <p className="text-sm text-mystic-muted">{spread.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={undo} disabled={picks.length === 0}>
            <Undo2 className="h-4 w-4" /> Deshacer
          </Button>
          <Button variant="secondary" onClick={reshuffle}>
            <RotateCcw className="h-4 w-4" /> Barajar
          </Button>
        </div>
      </header>

      <p className="text-sm text-mystic-muted" aria-live="polite">
        Elegí <span className="font-semibold text-mystic-gold">{spread.cardCount}</span>{' '}
        {spread.cardCount === 1 ? 'carta' : 'cartas'}. Seleccionadas:{' '}
        <span className="font-semibold text-mystic-text">
          {picks.length}/{spread.cardCount}
        </span>
      </p>

      {/* Mazo boca abajo */}
      <section aria-label="Mazo de cartas">
        <div className="grid grid-cols-6 gap-2 sm:grid-cols-9 sm:gap-3 lg:grid-cols-13">
          {shuffled.map((entry) => {
            const pickedPos = positionIndexForPick(entry.deckPosition);
            const isPicked = pickedPos !== undefined;
            return (
              <Carta
                key={entry.deckPosition}
                card={entry.card}
                orientation={entry.orientation}
                revealed={isPicked}
                selected={isPicked}
                disabled={!isPicked && complete}
                positionLabel={
                  isPicked ? spread.positions[pickedPos! - 1]?.label : undefined
                }
                onSelect={() => pick(entry.deckPosition)}
              />
            );
          })}
        </div>
      </section>

      {/* Cartas elegidas + significados */}
      {picks.length > 0 && (
        <section aria-label="Cartas elegidas" className="animate-fade-in">
          <h2 className="mb-3 font-display text-lg text-mystic-text">Tu tirada</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {picks.map((deckPosition, i) => {
              const entry = shuffled[deckPosition]!;
              const position = spread.positions[i]!;
              return (
                <div
                  key={deckPosition}
                  className="rounded-lg border border-mystic-border bg-mystic-surface p-4"
                >
                  <p className="text-xs uppercase tracking-wide text-mystic-amethyst">
                    {position.label}
                  </p>
                  <p className="font-display text-mystic-gold">
                    {entry.card.name}
                    {entry.orientation === 'reversed' && (
                      <span className="ml-1 text-xs text-mystic-muted">(invertida)</span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-mystic-muted">
                    {keywordsFor(entry.card, entry.orientation)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Formulario de pregunta (aparece al completar la selección) */}
      {complete && (
        <section aria-label="Tu pregunta" className="animate-fade-in">
          <form onSubmit={handleSubmit(onConfirm)} className="flex flex-col gap-4">
            <div>
              <label htmlFor="question" className="mb-1 block text-sm text-mystic-text">
                ¿Sobre qué querés reflexionar? <span className="text-mystic-gold">*</span>
              </label>
              <input
                id="question"
                {...register('question')}
                placeholder="Ej: ¿Qué debería tener en cuenta este mes en mi trabajo?"
                className="w-full rounded-lg border border-mystic-border bg-mystic-bg px-3 py-2 text-mystic-text placeholder:text-mystic-muted/60 focus:border-mystic-amethyst focus:outline-none"
              />
              {errors.question && (
                <p className="mt-1 text-xs text-red-400">{errors.question.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="context" className="mb-1 block text-sm text-mystic-text">
                Contexto (opcional)
              </label>
              <textarea
                id="context"
                {...register('context')}
                rows={3}
                placeholder="Cualquier detalle que ayude a la lectura."
                className="w-full rounded-lg border border-mystic-border bg-mystic-bg px-3 py-2 text-mystic-text placeholder:text-mystic-muted/60 focus:border-mystic-amethyst focus:outline-none"
              />
              {errors.context && (
                <p className="mt-1 text-xs text-red-400">{errors.context.message}</p>
              )}
            </div>
            <div>
              <Button type="submit">
                <Eye className="h-4 w-4" /> Ver resumen
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Resumen antes del pago */}
      {summary && (
        <section
          aria-label="Resumen de la lectura"
          className="animate-fade-in rounded-xl border border-mystic-gold/40 bg-mystic-surface p-5"
        >
          <h2 className="mb-3 font-display text-lg text-mystic-gold">Resumen de tu lectura</h2>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-mystic-muted">Tirada</dt>
              <dd className="text-mystic-text">{spread.name}</dd>
            </div>
            {planLabel && (
              <div className="flex justify-between gap-4">
                <dt className="text-mystic-muted">Servicio</dt>
                <dd className="text-mystic-text">
                  {planLabel} {planPrice && <span className="text-mystic-gold">· {planPrice}</span>}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-mystic-muted">Pregunta</dt>
              <dd className="max-w-[60%] text-right text-mystic-text">{summary.question}</dd>
            </div>
            <div>
              <dt className="mb-1 text-mystic-muted">Cartas</dt>
              <dd>
                <ul className="space-y-1">
                  {summary.cards.map((c) => (
                    <li key={c.positionIndex} className="text-mystic-text">
                      <span className="text-mystic-amethyst">{c.positionLabel}:</span> {c.name}
                      {c.orientation === 'reversed' && (
                        <span className="text-mystic-muted"> (invertida)</span>
                      )}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
          </dl>

          <p className="mt-4 flex items-center gap-2 text-xs text-mystic-muted">
            <ShieldCheck className="h-4 w-4 text-mystic-amethyst" />
            Selección verificable · semilla <code className="text-mystic-text">{summary.seed}</code>
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {planSlug ? (
              <Button onClick={startCheckout} disabled={checkout.loading}>
                {checkout.loading ? 'Redirigiendo…' : `Continuar al pago${planPrice ? ` · ${planPrice}` : ''}`}
              </Button>
            ) : (
              <a
                href="/servicios"
                className="inline-flex items-center justify-center rounded-lg bg-mystic-gold px-5 py-2.5 text-sm font-medium text-mystic-bg transition hover:opacity-90"
              >
                Elegir un servicio para pagar
              </a>
            )}
            <Button variant="secondary" onClick={reshuffle}>
              Empezar de nuevo
            </Button>
          </div>
          {checkout.error && (
            <p className="mt-2 text-xs text-red-400" role="alert">
              {checkout.error}
            </p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-mystic-muted/70">
            Esta es una experiencia recreativa y de reflexión. No garantiza predicciones ni
            resultados y no constituye asesoramiento médico, legal ni financiero.
          </p>
        </section>
      )}
    </div>
  );
}
