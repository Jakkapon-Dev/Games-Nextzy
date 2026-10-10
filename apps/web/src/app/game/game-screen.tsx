'use client';

import { ScoreOptions } from '@/components/game/score-options';
import { ErrorState } from '@/components/ui/error-state';
import { formatScore } from '@/lib/format';
import { useProgress } from '@/lib/queries';

/** Game page content: total score, the four options and the random button. */
export function GameScreen() {
  const { data, error, isError, retry } = useProgress();

  if (isError) {
    return (
      <ErrorState
        className="px-4 pt-24"
        message={error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}
        onRetry={() => void retry()}
      />
    );
  }

  return (
    <div className="flex flex-col items-center px-2 pt-12 pb-8">
      <h1 className="text-center text-2xl leading-6 font-semibold text-ink" aria-live="polite">
        {data ? (
          `คะแนนสะสม ${formatScore(data.totalScore)}/${formatScore(data.maxScore)}`
        ) : (
          <span className="inline-block h-6 w-64 rounded bg-white/70 motion-safe:animate-pulse" />
        )}
      </h1>

      <div className="mt-[clamp(4rem,24vh,13rem)] w-full max-w-[360px]">
        <ScoreOptions options={data?.scoreOptions ?? [300, 500, 1000, 3000]} states={{}} />
      </div>

      <button
        type="button"
        disabled={!data}
        className="mt-[70px] h-[38px] min-w-[120px] rounded-chip bg-brand-red px-4 text-xl leading-6 font-bold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-30"
      >
        สุ่มคะแนน
      </button>
    </div>
  );
}
