import type { Metadata } from 'next';
import { PlanCard } from '@/components/catalog/PlanCard';
import { getServicePlans } from '@/server/repositories/catalog';

export const metadata: Metadata = {
  title: 'Servicios · Tarot Híbrido',
  description:
    'Elegí entre Tarot Express y Tarot Premium. Un borrador de IA revisado y personalizado ' +
    'por un tarotista humano.',
};

export const revalidate = 60; // los precios pueden cambiar desde el panel admin

export default async function ServiciosPage() {
  const plans = await getServicePlans();
  // Destacamos el plan Premium si existe.
  const featuredSlug = plans.find((p) => p.modality === 'premium')?.slug;

  return (
    <main className="mx-auto max-w-4xl px-4 py-14">
      <header className="mb-10 text-center">
        <h1 className="font-display text-3xl text-mystic-text sm:text-4xl">
          Elegí tu experiencia
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-mystic-muted">
          Ambas modalidades combinan un borrador generado por IA con la revisión y el toque
          personal de un tarotista humano. Vos elegís el ritmo.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2">
        {plans.map((plan) => (
          <PlanCard key={plan.slug} plan={plan} featured={plan.slug === featuredSlug} />
        ))}
      </div>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs leading-relaxed text-mystic-muted/70">
        Las lecturas se ofrecen como una experiencia espiritual, recreativa y de reflexión. No
        garantizan predicciones ni resultados y no constituyen asesoramiento médico, legal ni
        financiero. La IA no es una persona real ni posee poderes sobrenaturales.
      </p>
    </main>
  );
}
