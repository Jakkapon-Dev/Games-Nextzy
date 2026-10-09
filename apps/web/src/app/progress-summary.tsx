'use client';

import { useProgress } from '@/lib/queries';

const numberFormat = new Intl.NumberFormat('th-TH');

/** Shows the player's total score once the session and progress are loaded. */
export function ProgressSummary() {
  const { data, error, isError, retry } = useProgress();

  if (isError) {
    return (
      <div role="alert" className="space-y-2">
        <p>{error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}</p>
        <button type="button" className="underline" onClick={() => void retry()}>
          ลองใหม่
        </button>
      </div>
    );
  }

  if (!data) {
    return <p aria-busy="true">กำลังโหลด…</p>;
  }

  return (
    <p>
      คะแนนสะสม {numberFormat.format(data.totalScore)}/{numberFormat.format(data.maxScore)}
    </p>
  );
}
