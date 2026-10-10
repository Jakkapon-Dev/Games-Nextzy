'use client';

import { ScoreCard } from '@/components/home/score-card';
import { useProgress } from '@/lib/queries';

/** Home page content that depends on the player's data. */
export function HomeScreen() {
  const { data, error, isError, retry } = useProgress();

  return (
    <div className="bg-header px-4 py-4">
      {isError ? (
        <div role="alert" className="space-y-2 rounded-card bg-white p-4 text-center">
          <p>{error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}</p>
          <button type="button" className="underline" onClick={() => void retry()}>
            ลองใหม่
          </button>
        </div>
      ) : data ? (
        <ScoreCard progress={data} />
      ) : (
        <div
          aria-busy="true"
          aria-label="กำลังโหลด"
          className="h-[200px] animate-pulse rounded-card bg-white/70"
        />
      )}
    </div>
  );
}
