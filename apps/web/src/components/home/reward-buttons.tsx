import type { Checkpoint } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { rewardButtonLabel } from '@/lib/rewards';

const tone = {
  CLAIMABLE: 'bg-reward-claimable hover:brightness-110',
  CLAIMED: 'bg-reward-claimed',
  LOCKED: 'bg-reward-locked',
} as const;

/**
 * One pill per checkpoint. Only claimable rewards are enabled; the visible pill stays small as in
 * the design, while the button's hit area is extended vertically for touch.
 */
export function RewardButtons({
  checkpoints,
  pendingId,
  onClaim,
}: {
  checkpoints: Checkpoint[];
  /** Checkpoint currently being claimed. */
  pendingId?: string;
  onClaim: (checkpoint: Checkpoint) => void;
}) {
  return (
    <ul className="flex flex-wrap justify-end gap-x-2 gap-y-1">
      {checkpoints.map((checkpoint) => {
        const isPending = checkpoint.id === pendingId;
        return (
          <li key={checkpoint.id}>
            <button
              type="button"
              disabled={checkpoint.status !== 'CLAIMABLE' || pendingId !== undefined}
              aria-busy={isPending || undefined}
              onClick={() => onClaim(checkpoint)}
              className={cn(
                'relative min-w-16 rounded-chip px-2 text-[10px] leading-6 font-bold whitespace-nowrap text-white',
                'before:absolute before:inset-x-0 before:-inset-y-2.5 before:content-[""]',
                'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-reward-claimable',
                'disabled:cursor-not-allowed',
                tone[checkpoint.status],
                isPending && 'opacity-70',
              )}
            >
              {isPending ? 'กำลังรับ…' : rewardButtonLabel(checkpoint)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
