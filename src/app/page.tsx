import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-4 py-16 text-center">
      <span className="rounded-full border border-mystic-border bg-mystic-surface px-4 py-1 text-xs uppercase tracking-widest text-mystic-muted">
        Tarot Híbrido · IA + Tarotista
      </span>

      <h1 className="font-display text-4xl leading-tight text-mystic-text sm:text-5xl">
        Una lectura que <span className="text-mystic-gold">une intuición y cuidado humano</span>
      </h1>

      <p className="max-w-xl text-balance text-mystic-muted">
        Elegís tu tirada, la IA prepara un borrador y un tarotista lo revisa, personaliza y te lo
        entrega. Una experiencia espiritual, recreativa y de reflexión.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/servicios"
          className="rounded-lg bg-mystic-gold px-6 py-3 font-medium text-mystic-bg transition hover:opacity-90"
        >
          Ver servicios
        </Link>
        <Link
          href="/mesa"
          className="rounded-lg border border-mystic-border px-6 py-3 font-medium text-mystic-text transition hover:bg-mystic-surface"
        >
          Probar la mesa de tarot
        </Link>
      </div>

      <p className="mt-8 max-w-lg text-xs leading-relaxed text-mystic-muted/70">
        Las lecturas no garantizan predicciones ni resultados y no constituyen asesoramiento
        médico, legal ni financiero. La IA no es una persona real ni posee poderes sobrenaturales.
      </p>
    </main>
  );
}
