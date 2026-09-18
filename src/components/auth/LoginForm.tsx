'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { signInAction, type AuthActionState } from '@/server/auth/actions';

const initialState: AuthActionState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-mystic-gold px-5 py-2.5 text-sm font-medium text-mystic-bg transition hover:opacity-90 disabled:opacity-50"
    >
      {pending ? 'Ingresando…' : 'Ingresar'}
    </button>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, formAction] = useFormState(signInAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="mb-1 block text-sm text-mystic-text">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="w-full rounded-lg border border-mystic-border bg-mystic-bg px-3 py-2 text-mystic-text focus:border-mystic-amethyst focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm text-mystic-text">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-mystic-border bg-mystic-bg px-3 py-2 text-mystic-text focus:border-mystic-amethyst focus:outline-none"
        />
      </div>
      {state.error && (
        <p className="text-xs text-red-400" role="alert">
          {state.error}
        </p>
      )}
      <SubmitButton />
    </form>
  );
}
