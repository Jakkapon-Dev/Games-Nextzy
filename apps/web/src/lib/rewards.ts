import type { Checkpoint } from './api/types';

/** Button text for a checkpoint, e.g. "กดรับรางวัล B" or "ได้รางวัล A แล้ว". */
export function rewardButtonLabel(checkpoint: Checkpoint): string {
  return checkpoint.status === 'CLAIMED'
    ? `ได้${checkpoint.rewardName} แล้ว`
    : `กดรับ${checkpoint.rewardName}`;
}

/** Text shared by the share button. */
export function shareText(totalScore: string, maxScore: string): string {
  return `ฉันสะสมได้ ${totalScore}/${maxScore} คะแนนในเกมสะสมคะแนน Nextzy!`;
}
