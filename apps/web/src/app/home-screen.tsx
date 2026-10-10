'use client';

import { useState } from 'react';
import { ResetProgress } from '@/components/home/reset-progress';
import { RewardButtons } from '@/components/home/reward-buttons';
import { ScoreCard } from '@/components/home/score-card';
import { ShareButton } from '@/components/home/share-button';
import { CrownCoin } from '@/components/icons/crown-coin';
import { ErrorState } from '@/components/ui/error-state';
import { Modal } from '@/components/ui/modal';
import { PrimaryButton } from '@/components/ui/primary-button';
import type { ClaimedReward } from '@/lib/api/types';
import { useClaimReward, useProgress } from '@/lib/queries';

/** Home page content that depends on the player's data. */
export function HomeScreen() {
  const { data, error, isError, retry } = useProgress();
  const claim = useClaimReward();
  const [claimed, setClaimed] = useState<ClaimedReward | null>(null);

  return (
    <>
      <div className="bg-header px-4 py-4">
        {isError ? (
          <ErrorState
            className="rounded-card bg-white px-4 py-8"
            message={error instanceof Error ? error.message : 'เกิดข้อผิดพลาด'}
            onRetry={() => void retry()}
          />
        ) : data ? (
          <ScoreCard
            progress={data}
            shareAction={<ShareButton totalScore={data.totalScore} maxScore={data.maxScore} />}
          >
            <RewardButtons
              checkpoints={data.checkpoints}
              pendingId={claim.isPending ? claim.variables?.checkpointId : undefined}
              onClaim={(checkpoint) =>
                claim.mutate(
                  { checkpointId: checkpoint.id, progressVersion: data.progressVersion },
                  { onSuccess: setClaimed },
                )
              }
            />
            {claim.isError && (
              <p role="alert" className="mt-2 text-right text-xs text-brand-red">
                {claim.error.message}
              </p>
            )}
          </ScoreCard>
        ) : (
          <div
            aria-busy="true"
            aria-label="กำลังโหลด"
            className="h-[200px] rounded-card bg-white/70 motion-safe:animate-pulse"
          />
        )}

        <Modal
          open={claimed !== null}
          onClose={() => setClaimed(null)}
          icon={<CrownCoin size={78} />}
          title="ยินดีด้วย"
          description={claimed ? `คุณได้รับ${claimed.rewardName}` : undefined}
        >
          <PrimaryButton size="medium" onClick={() => setClaimed(null)}>
            ปิด
          </PrimaryButton>
        </Modal>
      </div>

      {data && (
        <div className="flex justify-center pt-6">
          <ResetProgress progressVersion={data.progressVersion} />
        </div>
      )}
    </>
  );
}
