import type { ReactNode } from 'react';
import type { PlayerProgress } from '@/lib/api/types';
import { formatScore } from '@/lib/format';
import { ProgressTrack } from './progress-track';

/** The white card at the top of the home page: total score, progress and reward actions. */
export function ScoreCard({
  progress,
  shareAction,
  children,
}: {
  progress: PlayerProgress;
  /** Rendered as the tag in the top-left corner. */
  shareAction?: ReactNode;
  /** Reward buttons below the progress bar. */
  children?: ReactNode;
}) {
  return (
    <section
      aria-labelledby="score-card-title"
      className="relative overflow-hidden rounded-card border border-black bg-white px-3 pt-1 pb-4"
    >
      {shareAction && <div className="absolute top-5 left-0">{shareAction}</div>}

      <p className="text-center text-[10px] leading-4 text-[#d4d4d4]">“ชื่อ - นามสกุล”</p>

      <div className="mt-3 text-right">
        <h1 id="score-card-title" className="text-base leading-6 font-semibold text-ink">
          สะสมคะแนน
        </h1>
        <p className="text-sm leading-6 font-medium text-ink">คะแนนครบ 10,000 รับรางวัลใหญ่</p>
        <p className="text-2xl leading-8 font-semibold text-brand-red">
          {formatScore(progress.totalScore)}/{formatScore(progress.maxScore)}
        </p>
      </div>

      <div className="mt-2">
        <ProgressTrack
          totalScore={progress.totalScore}
          maxScore={progress.maxScore}
          checkpoints={progress.checkpoints}
        />
      </div>

      {children && <div className="mt-2">{children}</div>}
    </section>
  );
}
