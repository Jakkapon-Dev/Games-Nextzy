import { describe, expect, it } from 'vitest';
import type { Checkpoint } from './api/types';
import { rewardButtonLabel, shareText } from './rewards';

const checkpoint = (status: Checkpoint['status']): Checkpoint => ({
  id: 'checkpoint-5000',
  requiredScore: 5000,
  rewardName: 'รางวัล A',
  status,
});

describe('rewardButtonLabel', () => {
  it('invites the player to claim locked and claimable rewards', () => {
    expect(rewardButtonLabel(checkpoint('LOCKED'))).toBe('กดรับรางวัล A');
    expect(rewardButtonLabel(checkpoint('CLAIMABLE'))).toBe('กดรับรางวัล A');
  });

  it('confirms a claimed reward', () => {
    expect(rewardButtonLabel(checkpoint('CLAIMED'))).toBe('ได้รางวัล A แล้ว');
  });
});

describe('shareText', () => {
  it('includes the formatted score', () => {
    expect(shareText('8,500', '10,000')).toContain('8,500/10,000');
  });
});
