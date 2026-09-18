'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import {
  saveEditAction,
  approveAction,
  uploadAudioAction,
  openReviewAction,
  regenerateAction,
  deliverNowAction,
  type ActionState,
} from '@/app/(reader)/dashboard/actions';
import type { OrderStatus } from '@/types/domain';

const initial: ActionState = { error: null };

function Pending({ children, idle }: { children: string; idle?: string }) {
  const { pending } = useFormStatus();
  return <span>{pending ? children : (idle ?? children)}</span>;
}

interface ReviewPanelProps {
  orderId: string;
  readingId: string;
  status: OrderStatus;
  initialContent: string;
  aiContent: string | null;
  audioUrls: string[];
}

export function ReviewPanel({
  orderId,
  readingId,
  status,
  initialContent,
  aiContent,
  audioUrls,
}: ReviewPanelProps) {
  const [content, setContent] = useState(initialContent);
  const [saveState, saveForm] = useFormState(saveEditAction, initial);
  const [approveState, approveForm] = useFormState(approveAction, initial);
  const [audioState, audioForm] = useFormState(uploadAudioAction, initial);

  const btn =
    'rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50';
  const primary = `${btn} bg-mystic-gold text-mystic-bg hover:opacity-90`;
  const secondary = `${btn} border border-mystic-border text-mystic-text hover:bg-mystic-bg`;

  if (status === 'AI_DRAFT_READY') {
    return (
      <form action={openReviewAction.bind(null, orderId)}>
        <p className="mb-3 text-sm text-mystic-muted">
          El borrador de IA está listo. Abrilo para revisarlo y personalizarlo.
        </p>
        <button className={primary}>
          <Pending>Abriendo…</Pending>
        </button>
      </form>
    );
  }

  if (status === 'APPROVED') {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-mystic-muted">
          Aprobada. La entrega está programada con el retraso del servicio.
        </p>
        <form action={deliverNowAction.bind(null, orderId)}>
          <button className={secondary}>
            <Pending idle="Entregar ahora">Entregando…</Pending>
          </button>
        </form>
      </div>
    );
  }

  if (status !== 'HUMAN_REVIEW') {
    return (
      <p className="text-sm text-mystic-muted">
        Esta orden no está en revisión (estado actual gestionado automáticamente).
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label htmlFor="content" className="mb-1 block text-sm text-mystic-text">
          Texto de la lectura (editable)
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={14}
          className="w-full rounded-lg border border-mystic-border bg-mystic-bg px-3 py-2 text-sm leading-relaxed text-mystic-text focus:border-mystic-amethyst focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {/* Guardar edición */}
        <form action={saveForm}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="readingId" value={readingId} />
          <input type="hidden" name="content" value={content} />
          <button className={secondary}>
            <Pending idle="Guardar borrador">Guardando…</Pending>
          </button>
        </form>

        {/* Regenerar con IA */}
        <form action={regenerateAction.bind(null, orderId)}>
          <button className={secondary}>
            <Pending idle="Regenerar con IA">Regenerando…</Pending>
          </button>
        </form>

        {/* Aprobar y entregar */}
        <form action={approveForm}>
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="readingId" value={readingId} />
          <input type="hidden" name="content" value={content} />
          <button className={primary}>
            <Pending idle="Aprobar y enviar">Aprobando…</Pending>
          </button>
        </form>
      </div>
      {(saveState.error || approveState.error) && (
        <p className="text-xs text-red-400" role="alert">
          {saveState.error ?? approveState.error}
        </p>
      )}
      {saveState.ok && !saveState.error && (
        <p className="text-xs text-emerald-400">Borrador guardado.</p>
      )}

      {/* Comparar con el borrador de IA */}
      {aiContent && (
        <details className="rounded-lg border border-mystic-border bg-mystic-surface p-3 text-sm">
          <summary className="cursor-pointer text-mystic-muted">Ver borrador original de IA</summary>
          <p className="mt-2 whitespace-pre-wrap text-mystic-muted">{aiContent}</p>
        </details>
      )}

      {/* Audio */}
      <div className="rounded-lg border border-mystic-border bg-mystic-surface p-4">
        <p className="mb-2 text-sm text-mystic-text">Audio de la lectura</p>
        {audioUrls.length > 0 && (
          <ul className="mb-3 space-y-2">
            {audioUrls.map((url, i) => (
              <li key={i}>
                {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                <audio controls src={url} className="w-full" />
              </li>
            ))}
          </ul>
        )}
        <form action={audioForm} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="orderId" value={orderId} />
          <input type="hidden" name="readingId" value={readingId} />
          <input
            type="file"
            name="audio"
            accept="audio/*"
            className="text-sm text-mystic-muted file:mr-3 file:rounded-md file:border-0 file:bg-mystic-border file:px-3 file:py-1.5 file:text-mystic-text"
          />
          <button className={secondary}>
            <Pending idle="Subir audio">Subiendo…</Pending>
          </button>
        </form>
        {audioState.error && <p className="mt-2 text-xs text-red-400">{audioState.error}</p>}
        {audioState.ok && !audioState.error && (
          <p className="mt-2 text-xs text-emerald-400">Audio adjuntado.</p>
        )}
      </div>
    </div>
  );
}
