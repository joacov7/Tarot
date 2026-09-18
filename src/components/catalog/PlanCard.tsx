import Link from 'next/link';
import { Clock, Zap, Mic, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { formatPrice, formatDelay } from '@/lib/utils/format';
import type { ServicePlan } from '@/lib/tarot/service-plans';

interface PlanCardProps {
  plan: ServicePlan;
  featured?: boolean;
}

/** Tarjeta de servicio del catálogo. Presentacional (renderizable en el servidor). */
export function PlanCard({ plan, featured = false }: PlanCardProps) {
  const isExpress = plan.modality === 'express';

  const features: Array<{ icon: React.ReactNode; label: string }> = [
    {
      icon: <Clock className="h-4 w-4" />,
      label: `Entrega estimada: ${formatDelay(plan.deliveryDelaySeconds)}`,
    },
    ...(isExpress
      ? [{ icon: <Zap className="h-4 w-4" />, label: 'Prioridad de procesamiento' }]
      : []),
    {
      icon: <Mic className="h-4 w-4" />,
      label: plan.includesAudio ? 'Audio incluido' : 'Audio no incluido',
    },
    { icon: <Sparkles className="h-4 w-4" />, label: 'Borrador de IA revisado por un tarotista' },
  ];

  return (
    <div
      className={cn(
        'flex flex-col rounded-2xl border bg-mystic-surface p-6 transition',
        featured
          ? 'border-mystic-gold/60 shadow-[0_0_40px_-15px] shadow-mystic-gold/40'
          : 'border-mystic-border',
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-mystic-text">{plan.name}</h2>
        {featured && (
          <span className="rounded-full bg-mystic-gold/15 px-3 py-1 text-xs font-medium text-mystic-gold">
            Recomendado
          </span>
        )}
      </div>

      <p className="mt-1 text-sm text-mystic-muted">{plan.description}</p>

      <p className="mt-4">
        <span className="font-display text-3xl text-mystic-gold">
          {formatPrice(plan.price, plan.currency)}
        </span>
        <span className="ml-1 text-sm text-mystic-muted">/ lectura</span>
      </p>

      <ul className="mt-5 flex flex-1 flex-col gap-2 text-sm text-mystic-text">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="text-mystic-amethyst">{f.icon}</span>
            {f.label}
          </li>
        ))}
      </ul>

      <Link
        href={{ pathname: '/mesa', query: { plan: plan.slug } }}
        className={cn(
          'mt-6 inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium transition',
          featured
            ? 'bg-mystic-gold text-mystic-bg hover:opacity-90'
            : 'border border-mystic-border text-mystic-text hover:bg-mystic-bg',
        )}
      >
        Elegir y armar mi tirada
      </Link>
    </div>
  );
}
