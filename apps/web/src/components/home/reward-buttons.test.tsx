// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Checkpoint } from '@/lib/api/types';
import { RewardButtons } from './reward-buttons';

const checkpoints: Checkpoint[] = [
  { id: 'checkpoint-5000', requiredScore: 5000, rewardName: 'รางวัล A', status: 'CLAIMED' },
  { id: 'checkpoint-7500', requiredScore: 7500, rewardName: 'รางวัล B', status: 'CLAIMABLE' },
  { id: 'checkpoint-10000', requiredScore: 10000, rewardName: 'รางวัล C', status: 'LOCKED' },
];

describe('RewardButtons', () => {
  it('shows one button per checkpoint and enables only claimable rewards', () => {
    render(<RewardButtons checkpoints={checkpoints} onClaim={() => {}} />);

    expect(screen.getByRole('button', { name: 'ได้รางวัล A แล้ว' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'กดรับรางวัล B' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'กดรับรางวัล C' })).toBeDisabled();
  });

  it('claims the pressed checkpoint', async () => {
    const onClaim = vi.fn();
    render(<RewardButtons checkpoints={checkpoints} onClaim={onClaim} />);

    await userEvent.click(screen.getByRole('button', { name: 'กดรับรางวัล B' }));

    expect(onClaim).toHaveBeenCalledWith(checkpoints[1]);
  });

  it('disables every button while a claim is pending', () => {
    render(
      <RewardButtons checkpoints={checkpoints} pendingId="checkpoint-7500" onClaim={() => {}} />,
    );

    const pending = screen.getByRole('button', { name: 'กำลังรับ…' });
    expect(pending).toHaveAttribute('aria-busy', 'true');
    for (const button of screen.getAllByRole('button')) {
      expect(button).toBeDisabled();
    }
  });
});
