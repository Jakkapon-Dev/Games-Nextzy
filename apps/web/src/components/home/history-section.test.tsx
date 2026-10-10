// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HistorySection } from './history-section';

const page = <T,>(items: T[]) => ({ items, page: 1, limit: 20, totalItems: items.length });

const queries = vi.hoisted(() => ({
  session: { isError: false },
  game: { data: undefined as unknown, isError: false, hasNextPage: false },
  reward: { data: undefined as unknown, isError: false, hasNextPage: false },
}));

vi.mock('@/lib/queries', () => ({
  useSession: () => queries.session,
  useGameHistory: () => queries.game,
  useRewardHistory: () => queries.reward,
}));

describe('HistorySection', () => {
  beforeEach(() => {
    queries.session = { isError: false };
    queries.game = {
      data: {
        pages: [
          page([
            {
              roundId: 'r1',
              pickedScore: 3000,
              creditedScore: 500,
              totalScoreAfter: 10000,
              createdAt: '2025-02-15T13:00:00.000Z',
            },
          ]),
        ],
      },
      isError: false,
      hasNextPage: false,
    };
    queries.reward = { data: { pages: [page([])] }, isError: false, hasNextPage: false };
  });

  it('shows game history first, with Thai time and the credited points at the cap', () => {
    render(<HistorySection />);

    expect(screen.getByRole('tab', { name: 'ประวัติการเล่น' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByText('เล่นได้ 3,000 คะแนน')).toBeVisible();
    expect(screen.getByText('(ได้รับจริง 500)')).toBeVisible();
    expect(screen.getByText('เล่นเมื่อ 15/02/25 20:00 น.')).toBeVisible();
  });

  it('switches tabs with the mouse and the arrow keys', async () => {
    const user = userEvent.setup();
    render(<HistorySection />);

    await user.click(screen.getByRole('tab', { name: 'ประวัติรางวัล' }));
    expect(screen.getByText('ยังไม่มีประวัติรางวัล สะสมคะแนนให้ถึงเกณฑ์ก่อนนะ')).toBeVisible();

    await user.keyboard('{ArrowLeft}');
    const playTab = screen.getByRole('tab', { name: 'ประวัติการเล่น' });
    expect(playTab).toHaveFocus();
    expect(playTab).toHaveAttribute('aria-selected', 'true');
  });

  it('renders nothing when the session could not be started', () => {
    queries.session = { isError: true };
    const { container } = render(<HistorySection />);
    expect(container).toBeEmptyDOMElement();
  });
});
