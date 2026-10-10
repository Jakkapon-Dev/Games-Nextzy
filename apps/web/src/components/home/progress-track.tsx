import { CheckBadge } from '@/components/icons/check-badge';
import { CrownCoin } from '@/components/icons/crown-coin';
import type { Checkpoint } from '@/lib/api/types';
import { formatScore, toPercent } from '@/lib/format';

function CheckpointMarker({ checkpoint, isFinal }: { checkpoint: Checkpoint; isFinal: boolean }) {
  if (isFinal) return <CrownCoin size={30} />;
  if (checkpoint.status === 'CLAIMED') return <CheckBadge tone="claimed" />;
  if (checkpoint.status === 'CLAIMABLE') return <CheckBadge tone="claimable" />;
  return <span className="block size-3.5 rounded-full border-2 border-white bg-progress-track" />;
}

/**
 * Score bar with checkpoint markers placed by their share of the maximum score.
 * Side padding keeps the markers at 0% and 100% inside the card.
 */
export function ProgressTrack({
  totalScore,
  maxScore,
  checkpoints,
}: {
  totalScore: number;
  maxScore: number;
  checkpoints: Checkpoint[];
}) {
  const percent = toPercent(totalScore, maxScore);

  return (
    <div
      role="progressbar"
      aria-label="คะแนนสะสม"
      aria-valuemin={0}
      aria-valuemax={maxScore}
      aria-valuenow={totalScore}
      aria-valuetext={`${formatScore(totalScore)} จาก ${formatScore(maxScore)} คะแนน`}
      className="px-[15px]"
    >
      <div className="relative h-6" aria-hidden="true">
        {checkpoints.map((checkpoint) => (
          <span
            key={checkpoint.id}
            className="absolute top-0 -translate-x-1/2 text-[10px] leading-6 text-text-subtle"
            style={{ left: `${toPercent(checkpoint.requiredScore, maxScore)}%` }}
          >
            {formatScore(checkpoint.requiredScore)}
          </span>
        ))}
      </div>

      <div className="relative flex h-[30px] items-center" aria-hidden="true">
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-progress-track">
          <div
            className="h-full rounded-full bg-linear-to-r from-progress-from to-progress-to transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        {percent < 100 && (
          <span
            className="absolute size-[18px] -translate-x-1/2 rounded-full bg-linear-to-b from-progress-dot-from to-progress-dot-to"
            style={{ left: `${percent}%` }}
          />
        )}

        {checkpoints.map((checkpoint) => (
          <span
            key={checkpoint.id}
            className="absolute flex -translate-x-1/2 items-center justify-center"
            style={{ left: `${toPercent(checkpoint.requiredScore, maxScore)}%` }}
          >
            <CheckpointMarker
              checkpoint={checkpoint}
              isFinal={checkpoint.requiredScore >= maxScore}
            />
          </span>
        ))}
      </div>
    </div>
  );
}
