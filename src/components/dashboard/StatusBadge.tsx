import { cn } from '@/lib/utils/cn';
import { ORDER_STATUS_LABEL } from '@/lib/tarot/order-status';
import type { OrderStatus } from '@/types/domain';

const TONE: Partial<Record<OrderStatus, string>> = {
  PAID: 'bg-emerald-500/15 text-emerald-300',
  QUEUED: 'bg-sky-500/15 text-sky-300',
  AI_GENERATING: 'bg-sky-500/15 text-sky-300',
  AI_DRAFT_READY: 'bg-amber-500/15 text-amber-300',
  HUMAN_REVIEW: 'bg-mystic-amethyst/20 text-mystic-amethyst',
  APPROVED: 'bg-emerald-500/15 text-emerald-300',
  DELIVERED: 'bg-emerald-600/20 text-emerald-300',
  AI_ERROR: 'bg-red-500/15 text-red-300',
  DELIVERY_ERROR: 'bg-red-500/15 text-red-300',
  PAYMENT_FAILED: 'bg-red-500/15 text-red-300',
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONE[status] ?? 'bg-mystic-border/50 text-mystic-muted',
      )}
    >
      {ORDER_STATUS_LABEL[status].label}
    </span>
  );
}
