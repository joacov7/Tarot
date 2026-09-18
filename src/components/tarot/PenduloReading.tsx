'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sparkles, Eye, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { generateSeed } from '@/lib/tarot/shuffle';
import type { SpreadDef } from '@/lib/tarot/spreads';

const questionSchema = z.object({
  question: z.string().trim().min(5, 'Escribí una pregunta de al menos 5 caracteres.').max(500),
  context: z.string().trim().max(2000).optional(),
});
type QuestionForm = z.infer<typeof questionSchema>;

interface PenduloReadingProps {
  spread: SpreadDef;
  planSlug?: string;
  planLabel?: string;
  planPrice?: string;
}

/**
 * Flujo de lectura con PÉNDULO: no hay selección de cartas. El cliente escribe
 * su pregunta y paga; la tarotista realiza la lectura con péndulo.
 */
export function PenduloReading({ spread, planSlug, planLabel, planPrice }: PenduloReadingProps) {
  const [summary, setSummary] = useState<QuestionForm | null>(null);
  const [checkout, setCheckout] = useState<{ loading: boolean; error: string | null }>({
    loading: false,
    error: null,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<QuestionForm>({ resolver: zodResolver(questionSchema) });

  async function startCheckout() {
    if (!summary || !planSlug) return;
    setCheckout({ loading: true, error: null });
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicePlanSlug: planSlug,
          spreadSlug: spread.slug,
          seed: generateSeed(),
          question: summary.question,
          context: summary.context,
          cards: [],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
      if (res.ok && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      setCheckout({ loading: false, error: data.error ?? 'No se pudo iniciar el pago.' });
    } catch {
      setCheckout({ loading: false, error: 'Error de red. Intentá de nuevo.' });
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start gap-3">
        <Sparkles className="mt-1 h-6 w-6 text-mystic-amethyst" aria-hidden />
        <div>
          <h1 className="font-display text-2xl text-mystic-text sm:text-3xl">{spread.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-mystic-muted">{spread.description}</p>
        </div>
      </header>

      <section className="rounded-xl border border-mystic-border bg-mystic-surface p-5">
        <p className="mb-4 text-sm text-mystic-muted">
          En esta lectura no elegís cartas: la tarotista trabaja con el péndulo a partir de tu
          pregunta. Contanos qué querés consultar.
        </p>

        <form onSubmit={handleSubmit(setSummary)} className="flex flex-col gap-4">
          <div>
            <label htmlFor="question" className="mb-1 block text-sm text-mystic-text">
              ¿Sobre qué querés consultar? <span className="text-mystic-gold">*</span>
            </label>
            <input
              id="question"
              {...register('question')}
              placeholder="Ej: ¿Qué energía predomina en mi relación actual?"
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
          </div>
          <div>
            <Button type="submit">
              <Eye className="h-4 w-4" /> Ver resumen
            </Button>
          </div>
        </form>
      </section>

      {summary && (
        <section
          aria-label="Resumen de la lectura"
          className="animate-fade-in rounded-xl border border-mystic-gold/40 bg-mystic-surface p-5"
        >
          <h2 className="mb-3 font-display text-lg text-mystic-gold">Resumen de tu lectura</h2>
          <dl className="grid gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-mystic-muted">Lectura</dt>
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
          </dl>

          <p className="mt-4 flex items-center gap-2 text-xs text-mystic-muted">
            <ShieldCheck className="h-4 w-4 text-mystic-amethyst" />
            Lectura con péndulo realizada por la tarotista.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {planSlug ? (
              <Button onClick={startCheckout} disabled={checkout.loading}>
                {checkout.loading
                  ? 'Redirigiendo…'
                  : `Continuar al pago${planPrice ? ` · ${planPrice}` : ''}`}
              </Button>
            ) : (
              <a
                href="/servicios"
                className="inline-flex items-center justify-center rounded-lg bg-mystic-gold px-5 py-2.5 text-sm font-medium text-mystic-bg transition hover:opacity-90"
              >
                Elegir un servicio para pagar
              </a>
            )}
          </div>
          {checkout.error && (
            <p className="mt-2 text-xs text-red-400" role="alert">
              {checkout.error}
            </p>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-mystic-muted/70">
            Experiencia recreativa y de reflexión. No garantiza predicciones ni resultados y no
            constituye asesoramiento médico, legal ni financiero.
          </p>
        </section>
      )}
    </div>
  );
}
