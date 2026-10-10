'use client';

import { useEffect, useRef, useState } from 'react';
import { type OptionState, ScoreOptions } from '@/components/game/score-options';
import { ErrorState } from '@/components/ui/error-state';
import { Modal } from '@/components/ui/modal';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ApiError } from '@/lib/api/api-error';
import type { PlayedRound } from '@/lib/api/types';
import { formatScore } from '@/lib/format';
import { ELIMINATION_INTERVAL_MS, eliminationOrder, RESULT_PAUSE_MS } from '@/lib/game';
import { usePlayRound, useProgress } from '@/lib/queries';

type Phase = 'ready' | 'playing' | 'finished';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Game page content: total score, the four options and the random button. */
export function GameScreen() {
  const { data, error, isError, retry } = useProgress();
  const play = usePlayRound();
  const [phase, setPhase] = useState<Phase>('ready');
  const [states, setStates] = useState<Record<number, OptionState>>({});
  const [result, setResult] = useState<PlayedRound | null>(null);
  /** Score shown in the title; frozen while a round is animating. */
  const [shownTotal, setShownTotal] = useState<number | null>(null);
  /** Request id of a round that failed and may be retried without adding points twice. */
  const [failedRequestId, setFailedRequestId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  if (isError) {
    return (
      <ErrorState
        className="px-4 pt-24"
        message={error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}
        onRetry={() => void retry()}
      />
    );
  }

  async function start(requestId: string = crypto.randomUUID()) {
    if (!data || phase !== 'ready') return;
    setFailedRequestId(null);
    setShownTotal(data.totalScore);
    setPhase('playing');
    setAnnouncement('กำลังสุ่มคะแนน');

    let round: PlayedRound;
    try {
      round = await play.mutateAsync({ requestId, progressVersion: data.progressVersion });
    } catch (failure) {
      if (!mounted.current) return;
      // A stale progress version (e.g. reset in another tab) needs a new request; the progress
      // is reloaded automatically. Other failures can be retried with the same request id.
      const stale = failure instanceof ApiError && failure.code === 'PROGRESS_VERSION_MISMATCH';
      setFailedRequestId(stale ? null : requestId);
      setPhase('ready');
      setShownTotal(null);
      setAnnouncement('');
      return;
    }

    const interval = prefersReducedMotion() ? 0 : ELIMINATION_INTERVAL_MS;
    for (const score of eliminationOrder(data.scoreOptions, round.pickedScore)) {
      await sleep(interval);
      if (!mounted.current) return;
      setStates((current) => ({ ...current, [score]: 'eliminated' }));
    }
    setStates((current) => ({ ...current, [round.pickedScore]: 'winner' }));
    setShownTotal(round.totalScore);
    setPhase('finished');
    await sleep(prefersReducedMotion() ? 0 : RESULT_PAUSE_MS);
    if (!mounted.current) return;
    setAnnouncement(`ได้รับ ${formatScore(round.pickedScore)} คะแนน`);
    setResult(round);
  }

  function playAgain() {
    setResult(null);
    setStates({});
    setShownTotal(null);
    setAnnouncement('');
    setPhase('ready');
  }

  const total = shownTotal ?? data?.totalScore;
  const isFull = data !== undefined && data.totalScore >= data.maxScore;

  return (
    <div className="flex flex-col items-center px-2 pt-12 pb-8">
      <h1 className="text-center text-xl leading-6 font-semibold text-ink min-[360px]:text-2xl">
        {data && total !== undefined ? (
          `คะแนนสะสม ${formatScore(total)}/${formatScore(data.maxScore)}`
        ) : (
          <span className="inline-block h-6 w-64 rounded bg-white/70 motion-safe:animate-pulse" />
        )}
      </h1>
      <p role="status" className="sr-only">
        {announcement}
      </p>

      <div className="mt-[clamp(4rem,24vh,13rem)] w-full max-w-[360px]">
        <ScoreOptions options={data?.scoreOptions ?? [300, 500, 1000, 3000]} states={states} />
      </div>

      <div className="mt-[70px] flex min-h-[38px] flex-col items-center gap-3 px-4">
        {phase !== 'finished' && !failedRequestId && (
          <button
            type="button"
            disabled={!data || phase === 'playing'}
            aria-busy={phase === 'playing' || undefined}
            onClick={() => void start()}
            className="h-[38px] min-w-[120px] rounded-chip bg-brand-red px-4 text-xl leading-6 font-bold text-white hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red disabled:cursor-not-allowed disabled:opacity-30"
          >
            สุ่มคะแนน
          </button>
        )}

        {failedRequestId && phase === 'ready' && (
          <ErrorState
            message={play.error?.message ?? 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'}
            onRetry={() => void start(failedRequestId)}
          />
        )}

        {play.isError && !failedRequestId && phase === 'ready' && (
          <p role="alert" className="text-center text-sm text-brand-red">
            {play.error.message}
          </p>
        )}

        {isFull && phase === 'ready' && !failedRequestId && (
          <p className="text-center text-sm text-text-secondary">
            คะแนนเต็มแล้ว เล่นต่อได้แต่จะไม่ได้คะแนนเพิ่ม
          </p>
        )}
      </div>

      <Modal
        open={result !== null}
        onClose={playAgain}
        title="ได้รับ"
        description={
          result && (
            <>
              {formatScore(result.pickedScore)} คะแนน
              {result.creditedScore < result.pickedScore && (
                <span className="mt-1 block text-sm leading-5 text-text-muted">
                  คะแนนเต็ม {formatScore(data?.maxScore ?? 10000)} แล้ว ได้รับจริง{' '}
                  {formatScore(result.creditedScore)} คะแนน
                </span>
              )}
            </>
          )
        }
      >
        <PrimaryButton size="medium" onClick={playAgain}>
          ปิด
        </PrimaryButton>
      </Modal>
    </div>
  );
}
