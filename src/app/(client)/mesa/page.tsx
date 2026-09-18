import Link from 'next/link';
import { MesaTarot } from '@/components/tarot/MesaTarot';
import { SPREADS, getSpread, DEFAULT_SPREAD_SLUG } from '@/lib/tarot/spreads';
import { generateSeed } from '@/lib/tarot/shuffle';
import { getServicePlan } from '@/server/repositories/catalog';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

export const dynamic = 'force-dynamic'; // seed nueva por visita

interface MesaPageProps {
  searchParams: { tirada?: string; plan?: string };
}

export default async function MesaPage({ searchParams }: MesaPageProps) {
  const spread = getSpread(searchParams.tirada ?? '') ?? getSpread(DEFAULT_SPREAD_SLUG)!;
  const seed = generateSeed();
  const plan = searchParams.plan ? await getServicePlan(searchParams.plan) : undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Selector de tirada */}
      <nav className="mb-6 flex flex-wrap items-center gap-2" aria-label="Elegir tirada">
        <span className="text-sm text-mystic-muted">Tirada:</span>
        {SPREADS.map((s) => (
          <Link
            key={s.slug}
            href={{ pathname: '/mesa', query: { tirada: s.slug } }}
            className={cn(
              'rounded-full border px-3 py-1 text-sm transition',
              s.slug === spread.slug
                ? 'border-mystic-gold bg-mystic-gold/10 text-mystic-gold'
                : 'border-mystic-border text-mystic-muted hover:text-mystic-text',
            )}
          >
            {s.name} · {s.cardCount}
          </Link>
        ))}
      </nav>

      {/* key = spread.slug para reiniciar el estado al cambiar de tirada */}
      <MesaTarot
        key={spread.slug}
        spread={spread}
        initialSeed={seed}
        planSlug={plan?.slug}
        planLabel={plan?.name}
        planPrice={plan ? formatPrice(plan.price, plan.currency) : undefined}
      />
    </main>
  );
}
