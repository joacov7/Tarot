import Link from 'next/link';
import { requireReader } from '@/server/auth/guards';
import { signOutAction } from '@/server/auth/actions';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const reader = await requireReader();

  return (
    <div className="min-h-screen">
      <header className="border-b border-mystic-border bg-mystic-surface/60">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/dashboard" className="font-display text-lg text-mystic-gold">
            Panel del tarotista
          </Link>
          <div className="flex items-center gap-3 text-sm text-mystic-muted">
            <span>{reader.displayName ?? reader.email}</span>
            <form action={signOutAction}>
              <button className="rounded-lg border border-mystic-border px-3 py-1 text-mystic-text hover:bg-mystic-bg">
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
