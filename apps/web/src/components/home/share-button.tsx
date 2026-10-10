'use client';

import { useState } from 'react';
import { formatScore } from '@/lib/format';
import { shareText } from '@/lib/rewards';

/**
 * "แชร์คะแนน" tag. Uses the Web Share API when available and falls back to copying the text.
 */
export function ShareButton({ totalScore, maxScore }: { totalScore: number; maxScore: number }) {
  const [feedback, setFeedback] = useState('');

  async function share() {
    const text = shareText(formatScore(totalScore), formatScore(maxScore));
    try {
      if (navigator.share) {
        await navigator.share({ text, url: window.location.origin });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${window.location.origin}`);
      setFeedback('คัดลอกข้อความแล้ว');
    } catch (error) {
      // The user closing the share sheet is not an error.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setFeedback('แชร์ไม่สำเร็จ');
    }
    window.setTimeout(() => setFeedback(''), 2500);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => void share()}
        className="flex h-[22px] items-center rounded-tr-2xl rounded-br-2xl rounded-bl-[4px] bg-share pr-3 pl-2 text-[10px] leading-4 font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-share"
      >
        แชร์คะแนน
      </button>
      <span role="status" className="sr-only">
        {feedback}
      </span>
      {feedback && (
        <span className="absolute top-6 left-1 rounded bg-ink/80 px-2 py-0.5 text-[10px] whitespace-nowrap text-white">
          {feedback}
        </span>
      )}
    </>
  );
}
