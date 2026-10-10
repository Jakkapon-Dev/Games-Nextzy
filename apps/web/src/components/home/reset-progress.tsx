'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { useResetProgress } from '@/lib/queries';

/**
 * Blue RESET button from the design. The design has no confirmation step; resetting clears all
 * progress, so a confirmation dialog is shown first.
 */
export function ResetProgress({ progressVersion }: { progressVersion: number }) {
  const [confirming, setConfirming] = useState(false);
  const reset = useResetProgress();

  function close() {
    setConfirming(false);
    reset.reset();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="relative min-w-[85px] rounded-chip bg-brand-blue px-4 text-xl leading-7 font-bold text-white before:absolute before:inset-x-0 before:-inset-y-2 before:content-[''] hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        RESET
      </button>

      <Modal
        open={confirming}
        onClose={close}
        title="รีเซ็ตคะแนน?"
        description="คะแนนสะสม ประวัติการเล่น และประวัติรางวัลจะถูกล้าง แล้วเริ่มนับใหม่ตั้งแต่ 0"
      >
        {reset.isError && (
          <p role="alert" className="text-sm text-brand-red">
            {reset.error.message}
          </p>
        )}
        <button
          type="button"
          disabled={reset.isPending}
          onClick={() => reset.mutate(progressVersion, { onSuccess: () => setConfirming(false) })}
          className="min-h-9 min-w-44 rounded-full bg-brand-blue px-6 text-base font-semibold text-white disabled:opacity-60"
        >
          {reset.isPending ? 'กำลังรีเซ็ต…' : 'ยืนยันรีเซ็ต'}
        </button>
        <button
          type="button"
          disabled={reset.isPending}
          onClick={close}
          className="min-h-9 min-w-44 rounded-full border border-gray px-6 text-base text-text-secondary"
        >
          ยกเลิก
        </button>
      </Modal>
    </>
  );
}
