// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Checkpoint } from '@/lib/api/types';
import { ProgressTrack } from './progress-track';

const checkpoints = (statuses: Checkpoint['status'][]): Checkpoint[] =>
  [5000, 7500, 10000].map((requiredScore, index) => ({
    id: `checkpoint-${requiredScore}`,
    requiredScore,
    rewardName: `รางวัล ${'ABC'[index]}`,
    status: statuses[index] ?? 'LOCKED',
  }));

describe('ProgressTrack', () => {
  it('exposes the score as an accessible progress bar', () => {
    render(
      <ProgressTrack
        totalScore={8500}
        maxScore={10000}
        checkpoints={checkpoints(['CLAIMED', 'CLAIMABLE', 'LOCKED'])}
      />,
    );

    const bar = screen.getByRole('progressbar', { name: 'คะแนนสะสม' });
    expect(bar).toHaveAttribute('aria-valuenow', '8500');
    expect(bar).toHaveAttribute('aria-valuemax', '10000');
    expect(bar).toHaveAttribute('aria-valuetext', '8,500 จาก 10,000 คะแนน');
  });

  it('places checkpoint labels by their share of the maximum score', () => {
    render(<ProgressTrack totalScore={0} maxScore={10000} checkpoints={checkpoints([])} />);

    expect(screen.getByText('5,000')).toHaveStyle({ left: '50%' });
    expect(screen.getByText('7,500')).toHaveStyle({ left: '75%' });
    expect(screen.getByText('10,000')).toHaveStyle({ left: '100%' });
  });

  it('fills the bar in proportion to the score', () => {
    const { container } = render(
      <ProgressTrack totalScore={2500} maxScore={10000} checkpoints={checkpoints([])} />,
    );

    expect(container.querySelector('[style="width: 25%;"]')).not.toBeNull();
  });
});
