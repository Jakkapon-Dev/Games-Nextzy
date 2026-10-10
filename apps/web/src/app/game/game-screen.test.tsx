// @vitest-environment jsdom
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/lib/api/api-error';
import type { PlayedRound, PlayerProgress } from '@/lib/api/types';
import { GameScreen } from './game-screen';

const progress: PlayerProgress = {
  totalScore: 9500,
  maxScore: 10000,
  progressVersion: 3,
  scoreOptions: [300, 500, 1000, 3000],
  checkpoints: [],
};

const round: PlayedRound = {
  roundId: 'round-1',
  pickedScore: 3000,
  creditedScore: 500,
  totalScore: 10000,
  progressVersion: 3,
  createdAt: '2026-10-10T08:00:00.000Z',
};

const play = vi.hoisted(() => ({
  mutateAsync: vi.fn(),
  isError: false,
  error: null as Error | null,
}));

const progressQuery = vi.hoisted(() => ({ data: undefined as PlayerProgress | undefined }));

vi.mock('@/lib/queries', () => ({
  useProgress: () => ({ data: progressQuery.data, error: null, isError: false, retry: vi.fn() }),
  usePlayRound: () => play,
}));

function failWith(error: Error) {
  play.mutateAsync.mockImplementationOnce(() => {
    play.isError = true;
    play.error = error;
    return Promise.reject(error);
  });
}

describe('GameScreen', () => {
  beforeEach(() => {
    progressQuery.data = { ...progress };
    play.mutateAsync.mockReset();
    play.isError = false;
    play.error = null;
    // Reduced motion removes the animation delays, keeping the tests fast.
    window.matchMedia = vi.fn().mockReturnValue({ matches: true }) as never;
  });

  it('plays a round, highlights the picked score and shows the credited points at the cap', async () => {
    play.mutateAsync.mockResolvedValueOnce(round);
    render(<GameScreen />);

    await userEvent.click(screen.getByRole('button', { name: 'สุ่มคะแนน' }));

    const dialog = await screen.findByRole('dialog', { name: 'ได้รับ' });
    expect(within(dialog).getByText(/3,000 คะแนน/)).toBeInTheDocument();
    expect(
      within(dialog).getByText('คะแนนเต็ม 10,000 แล้ว ได้รับจริง 500 คะแนน'),
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('คะแนนสะสม 10,000/10,000');
    expect(screen.getByLabelText('3,000 คะแนน (ได้)')).toBeInTheDocument();
    expect(screen.getAllByLabelText(/ถูกตัดออก/)).toHaveLength(3);
    expect(screen.queryByRole('button', { name: 'สุ่มคะแนน' })).toBeNull();
    expect(play.mutateAsync).toHaveBeenCalledWith({
      requestId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      progressVersion: 3,
    });
  });

  it('resets the board after closing the dialog so the player can play again', async () => {
    play.mutateAsync.mockResolvedValueOnce(round);
    render(<GameScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'สุ่มคะแนน' }));
    const dialog = await screen.findByRole('dialog', { name: 'ได้รับ' });

    await userEvent.click(within(dialog).getByRole('button', { name: 'ปิด' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'สุ่มคะแนน' })).toBeEnabled());
    expect(screen.queryAllByLabelText(/ถูกตัดออก|\(ได้\)/)).toHaveLength(0);
  });

  it('retries a failed round with the same request id', async () => {
    failWith(new ApiError(0, 'NETWORK_ERROR', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'));
    play.mutateAsync.mockResolvedValueOnce(round);
    render(<GameScreen />);

    await userEvent.click(screen.getByRole('button', { name: 'สุ่มคะแนน' }));
    await userEvent.click(await screen.findByRole('button', { name: 'ลองใหม่' }));

    await screen.findByRole('dialog', { name: 'ได้รับ' });
    const [first, second] = play.mutateAsync.mock.calls.map(([variables]) => variables.requestId);
    expect(second).toBe(first);
  });

  it('starts a new request after a stale progress version', async () => {
    failWith(new ApiError(409, 'PROGRESS_VERSION_MISMATCH', 'ข้อมูลการสะสมเปลี่ยนแล้ว'));
    render(<GameScreen />);

    await userEvent.click(screen.getByRole('button', { name: 'สุ่มคะแนน' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('ข้อมูลการสะสมเปลี่ยนแล้ว');
    expect(screen.queryByRole('button', { name: 'ลองใหม่' })).toBeNull();
    expect(screen.getByRole('button', { name: 'สุ่มคะแนน' })).toBeEnabled();
  });

  it('keeps the original version on retry after another tab resets, then starts a fresh round', async () => {
    failWith(new ApiError(0, 'NETWORK_ERROR', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้'));
    failWith(new ApiError(409, 'PROGRESS_VERSION_MISMATCH', 'ข้อมูลการสะสมเปลี่ยนแล้ว'));
    play.mutateAsync.mockResolvedValueOnce({
      ...round,
      pickedScore: 300,
      creditedScore: 300,
      totalScore: 300,
      progressVersion: 4,
    });
    const view = render(<GameScreen />);

    await userEvent.click(screen.getByRole('button', { name: 'สุ่มคะแนน' }));
    await screen.findByRole('button', { name: 'ลองใหม่' });
    const originalRequest = { ...play.mutateAsync.mock.calls[0][0] };

    // Progress is refreshed after a reset in another tab while the failed round is pending.
    progressQuery.data = { ...progress, totalScore: 0, progressVersion: 4 };
    view.rerender(<GameScreen />);
    await userEvent.click(screen.getByRole('button', { name: 'ลองใหม่' }));

    expect(play.mutateAsync.mock.calls[1][0]).toEqual(originalRequest);
    expect(await screen.findByRole('alert')).toHaveTextContent('ข้อมูลการสะสมเปลี่ยนแล้ว');
    expect(screen.queryByRole('button', { name: 'ลองใหม่' })).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'สุ่มคะแนน' }));
    await screen.findByRole('dialog', { name: 'ได้รับ' });
    const freshRequest = play.mutateAsync.mock.calls[2][0];
    expect(freshRequest.progressVersion).toBe(4);
    expect(freshRequest.requestId).not.toBe(originalRequest.requestId);
  });
});
