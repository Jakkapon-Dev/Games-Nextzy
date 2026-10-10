'use client';

import { useEffect, useRef, useState } from 'react';
import { type OptionState, ScoreOptions } from '@/components/game/score-options';
import { ErrorState } from '@/components/ui/error-state';
import { Modal } from '@/components/ui/modal';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { PlayedRound } from '@/lib/api/types';
import { formatScore } from '@/lib/format';
import { ELIMINATION_INTERVAL_MS, eliminationOrder, RESULT_PAUSE_MS } from '@/lib/game';
import { usePlayRound, useProgress } from '@/lib/queries';

type Phase = 'ready' | 'playing' | 'finished';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Game page content: total score, the four options and the random button. */
export function GameScreen() {
  const { data, error, isError, retry } = useProgress();
  const play = usePlayRound();
  const [phase, setPhase] = useState<Phase>('ready');
  const [states, setStates] = useState<Record<number, OptionState>>({});
  const [result, setResult] = useState<PlayedRound | null>(null);
  /** Score shown in the title; frozen while a round is animating. */
  const [shownTotal, setShownTotal] = useState<number | null>(null);
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

  async function start() {
    if (!data || phase !== 'ready') return;
    setShownTotal(data.totalScore);
    setPhase('playing');

    let round: PlayedRound;
    try {
      round = await play.mutateAsync({
        requestId: crypto.randomUUID(),
        progressVersion: data.progressVersion,
      });
    } catch {
      if (mounted.current) {
        setPhase('ready');
        setShownTotal(null);
      }
      return;
    }

    for (const score of eliminationOrder(data.scoreOptions, round.pickedScore)) {
      await sleep(ELIMINATION_INTERVAL_MS);
      if (!mounted.current) return;
      setStates((current) => ({ ...current, [score]: 'eliminated' }));
    }
    setStates((current) => ({ ...current, [round.pickedScore]: 'winner' }));
    setShownTotal(round.totalScore);
    setPhase('finished');
    await sleep(RESULT_PAUSE_MS);
    if (mounted.current) setResult(round);
  }

  function playAgain() {
    setResult(null);
    setStates({});
    setShownTotal(null);
    setPhase('ready');
  }

  const total = shownTotal ?? data?.totalScore;

  return (
    <div className="flex flex-col items-center px-2 pt-12 pb-8">
      <h1 className="text-center text-2xl leading-6 font-semibold text-ink">
        {data && total !== undefined ? (
          `คะแนนสะสม ${formatScore(total)}/${formatScore(data.maxScore)}`
        ) : (
          <span className="inline-block h-6 w-64 rounded bg-white/70 motion-safe:animate-pulse" />
        )}
      </h1>

      <div className="mt-[clamp(4rem,24vh,13rem)] w-full max-w-[360px]">
        <ScoreOptions options={data?.scoreOptions ?? [300, 500, 1000, 3000]} states={states} />
      </div>

      <div className="mt-[70px] flex min-h-[38px] flex-col items-center gap-3">
        {phase !== 'finished' && (
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
        {play.isError && phase === 'ready' && (
          <p role="alert" className="text-center text-sm text-brand-red">
            {play.error.message}
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
