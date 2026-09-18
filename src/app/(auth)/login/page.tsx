import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = { title: 'Ingresar · Tarot Híbrido' };

interface LoginPageProps {
  searchParams: { next?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const next = searchParams.next ?? '/dashboard';

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-16">
      <h1 className="mb-1 font-display text-2xl text-mystic-text">Ingresar</h1>
      <p className="mb-6 text-sm text-mystic-muted">
        Acceso para clientes y tarotistas.
      </p>
      <LoginForm next={next} />
    </main>
  );
}
