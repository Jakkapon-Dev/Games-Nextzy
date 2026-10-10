import { PlayGameRound } from '../../game/application/play-game-round.js';
import { GetGameHistory } from '../../game/application/get-game-history.js';
import { GetPlayerProgress } from '../../player/application/get-player-progress.js';
import { ResetPlayerProgress } from '../../player/application/reset-player-progress.js';
import { ClaimCheckpointReward } from '../../reward/application/claim-checkpoint-reward.js';
import { GetRewardHistory } from '../../reward/application/get-reward-history.js';
import type { ProgressTransaction, ProgressUnitOfWork } from './progress-unit-of-work.js';
import type { Player } from '../../player/domain/player.js';

const now = new Date('2026-10-10T10:00:00.000Z');
const player = { id: 'player', totalScore: 9500, progressVersion: 1 };
const checkpoint = { id: 'checkpoint-5000', requiredScore: 5000, rewardName: 'รางวัล A' };
const round = {
  id: 'round',
  playerId: player.id,
  requestId: 'request',
  progressVersion: 1,
  pickedScore: 3000,
  creditedScore: 500,
  totalScoreAfter: 10000,
  createdAt: now,
};
const claim = {
  id: 'claim',
  playerId: player.id,
  checkpointId: checkpoint.id,
  progressVersion: 1,
  claimedAt: now,
};

function fixture() {
  const tx = {
    player: { ...player } as Player | null,
    findRound: vi.fn().mockResolvedValue(null),
    createRound: vi.fn().mockImplementation(async (data) => ({ ...round, ...data })),
    setTotalScore: vi.fn().mockResolvedValue(undefined),
    findCheckpoint: vi.fn().mockResolvedValue(checkpoint),
    findClaim: vi.fn().mockResolvedValue(null),
    createClaim: vi.fn().mockResolvedValue(claim),
    clearHistory: vi.fn().mockResolvedValue(undefined),
    resetPlayer: vi
      .fn()
      .mockResolvedValue({ ...player, totalScore: 0, progressVersion: 2, updatedAt: now }),
  } satisfies ProgressTransaction;
  const lock = vi.fn();
  const transactions = {
    withLockedPlayer: async <T>(
      id: string,
      work: (transaction: ProgressTransaction) => Promise<T>,
    ) => {
      lock(id);
      return work(tx);
    },
  } satisfies ProgressUnitOfWork;
  const random = { int: vi.fn().mockReturnValue(3) };
  return {
    tx,
    transactions,
    lock,
    random,
    play: new PlayGameRound(transactions, random),
    claimReward: new ClaimCheckpointReward(transactions),
    reset: new ResetPlayerProgress(transactions),
  };
}

describe('PlayGameRound without a database', () => {
  it('locks the player and records the capped score and total together', async () => {
    const f = fixture();
    const result = await f.play.execute(player.id, { requestId: 'request', progressVersion: 1 });
    expect(f.lock).toHaveBeenCalledWith(player.id);
    expect(result).toEqual({
      roundId: 'round',
      pickedScore: 3000,
      creditedScore: 500,
      totalScore: 10000,
      progressVersion: 1,
      createdAt: now.toISOString(),
    });
    expect(f.tx.createRound).toHaveBeenCalledWith({
      requestId: 'request',
      progressVersion: 1,
      pickedScore: 3000,
      creditedScore: 500,
      totalScoreAfter: 10000,
    });
    expect(f.tx.setTotalScore).toHaveBeenCalledWith(10000);
  });

  it('records zero credited points when already at the cap', async () => {
    const f = fixture();
    f.tx.player = { ...player, totalScore: 10000 };
    expect(
      await f.play.execute(player.id, { requestId: 'request', progressVersion: 1 }),
    ).toMatchObject({ creditedScore: 0, totalScore: 10000 });
    expect(f.tx.createRound).toHaveBeenCalledOnce();
  });

  it('returns an existing request before version validation without randomizing or writing', async () => {
    const f = fixture();
    f.tx.player = { ...player, progressVersion: 2 };
    vi.mocked(f.tx.findRound).mockResolvedValue(round);
    expect(
      await f.play.execute(player.id, { requestId: 'request', progressVersion: 1 }),
    ).toMatchObject({ roundId: 'round', progressVersion: 1 });
    expect(f.tx.findRound).toHaveBeenCalledWith(1, 'request');
    expect(f.random.int).not.toHaveBeenCalled();
    expect(f.tx.createRound).not.toHaveBeenCalled();
    expect(f.tx.setTotalScore).not.toHaveBeenCalled();
  });

  it('rejects a stale request before randomizing or writing', async () => {
    const f = fixture();
    await expect(
      f.play.execute(player.id, { requestId: 'request', progressVersion: 2 }),
    ).rejects.toMatchObject({ code: 'PROGRESS_VERSION_MISMATCH' });
    expect(f.random.int).not.toHaveBeenCalled();
    expect(f.tx.createRound).not.toHaveBeenCalled();
  });

  it('propagates a persistence failure so the adapter rolls the whole transaction back', async () => {
    const f = fixture();
    const error = new Error('write failed');
    vi.mocked(f.tx.setTotalScore).mockRejectedValue(error);
    await expect(
      f.play.execute(player.id, { requestId: 'request', progressVersion: 1 }),
    ).rejects.toBe(error);
  });
});

describe('ClaimCheckpointReward without a database', () => {
  it('claims a reward without deducting score', async () => {
    const f = fixture();
    expect(await f.claimReward.execute(player.id, checkpoint.id, { progressVersion: 1 })).toEqual({
      claimId: 'claim',
      checkpointId: checkpoint.id,
      rewardName: 'รางวัล A',
      claimedAt: now.toISOString(),
      totalScore: 9500,
      progressVersion: 1,
    });
    expect(f.tx.createClaim).toHaveBeenCalledWith(1, checkpoint.id);
    expect(f.tx.setTotalScore).not.toHaveBeenCalled();
  });

  it('rejects an unknown checkpoint before validating the version', async () => {
    const f = fixture();
    vi.mocked(f.tx.findCheckpoint).mockResolvedValue(null);
    await expect(
      f.claimReward.execute(player.id, 'missing', { progressVersion: 2 }),
    ).rejects.toMatchObject({ code: 'CHECKPOINT_NOT_FOUND' });
    expect(f.tx.findClaim).not.toHaveBeenCalled();
  });

  it('rejects a stale version before looking up or creating a claim', async () => {
    const f = fixture();
    await expect(
      f.claimReward.execute(player.id, checkpoint.id, { progressVersion: 2 }),
    ).rejects.toMatchObject({ code: 'PROGRESS_VERSION_MISMATCH' });
    expect(f.tx.findClaim).not.toHaveBeenCalled();
    expect(f.tx.createClaim).not.toHaveBeenCalled();
  });

  it('rejects a locked checkpoint', async () => {
    const f = fixture();
    f.tx.player = { ...player, totalScore: 4999 };
    await expect(
      f.claimReward.execute(player.id, checkpoint.id, { progressVersion: 1 }),
    ).rejects.toMatchObject({ code: 'CHECKPOINT_LOCKED' });
    expect(f.tx.createClaim).not.toHaveBeenCalled();
  });

  it('rejects a duplicate reward', async () => {
    const f = fixture();
    vi.mocked(f.tx.findClaim).mockResolvedValue(claim);
    await expect(
      f.claimReward.execute(player.id, checkpoint.id, { progressVersion: 1 }),
    ).rejects.toMatchObject({ code: 'REWARD_ALREADY_CLAIMED' });
    expect(f.tx.createClaim).not.toHaveBeenCalled();
  });
});

describe('ResetPlayerProgress without a database', () => {
  it('clears histories and increments the version inside the same transaction', async () => {
    const f = fixture();
    expect(await f.reset.execute(player.id, { progressVersion: 1 })).toEqual({
      totalScore: 0,
      progressVersion: 2,
      resetAt: now.toISOString(),
    });
    expect(f.tx.clearHistory).toHaveBeenCalledOnce();
    expect(f.tx.resetPlayer).toHaveBeenCalledWith(0, 2);
  });

  it('rejects stale resets without clearing data', async () => {
    const f = fixture();
    await expect(f.reset.execute(player.id, { progressVersion: 2 })).rejects.toMatchObject({
      code: 'PROGRESS_VERSION_MISMATCH',
    });
    expect(f.tx.clearHistory).not.toHaveBeenCalled();
    expect(f.tx.resetPlayer).not.toHaveBeenCalled();
  });
});

describe('missing player protection', () => {
  it.each(['play', 'claim', 'reset'])('rejects %s before accessing records', async (operation) => {
    const f = fixture();
    f.tx.player = null;
    const result =
      operation === 'play'
        ? f.play.execute(player.id, { requestId: 'request', progressVersion: 1 })
        : operation === 'claim'
          ? f.claimReward.execute(player.id, checkpoint.id, { progressVersion: 1 })
          : f.reset.execute(player.id, { progressVersion: 1 });
    await expect(result).rejects.toMatchObject({ code: 'SESSION_REQUIRED' });
    expect(f.tx.findRound).not.toHaveBeenCalled();
    expect(f.tx.findCheckpoint).not.toHaveBeenCalled();
    expect(f.tx.clearHistory).not.toHaveBeenCalled();
  });
});

describe('read use cases without a database', () => {
  it('computes checkpoint states from score and claims', async () => {
    const repository = {
      findCheckpoints: vi
        .fn()
        .mockResolvedValue([
          checkpoint,
          { ...checkpoint, id: 'checkpoint-7500', requiredScore: 7500 },
          { ...checkpoint, id: 'checkpoint-10000', requiredScore: 10000 },
        ]),
      findClaimedCheckpointIds: vi.fn().mockResolvedValue([checkpoint.id]),
    };
    const result = await new GetPlayerProgress(repository).execute(player);
    expect(result.checkpoints.map((item) => item.status)).toEqual([
      'CLAIMED',
      'CLAIMABLE',
      'LOCKED',
    ]);
    expect(result).toMatchObject({
      totalScore: 9500,
      maxScore: 10000,
      progressVersion: 1,
      scoreOptions: [300, 500, 1000, 3000],
    });
    expect(repository.findClaimedCheckpointIds).toHaveBeenCalledWith(player);
  });

  it('maps game history dates and forwards the current version and pagination', async () => {
    const repository = {
      findHistory: vi
        .fn()
        .mockResolvedValue({ items: [round], page: 2, limit: 10, totalItems: 11 }),
    };
    const result = await new GetGameHistory(repository).execute(player, { page: 2, limit: 10 });
    expect(repository.findHistory).toHaveBeenCalledWith(player, { page: 2, limit: 10 });
    expect(result).toEqual({
      items: [
        {
          roundId: 'round',
          pickedScore: 3000,
          creditedScore: 500,
          totalScoreAfter: 10000,
          createdAt: now.toISOString(),
        },
      ],
      page: 2,
      limit: 10,
      totalItems: 11,
    });
  });

  it('maps reward history and excludes persistence-only fields', async () => {
    const repository = {
      findHistory: vi.fn().mockResolvedValue({
        items: [{ ...claim, rewardName: 'รางวัล A' }],
        page: 1,
        limit: 20,
        totalItems: 1,
      }),
    };
    const result = await new GetRewardHistory(repository).execute(player, { page: 1, limit: 20 });
    expect(result.items).toEqual([
      {
        claimId: 'claim',
        checkpointId: checkpoint.id,
        rewardName: 'รางวัล A',
        claimedAt: now.toISOString(),
      },
    ]);
  });

  it('returns empty history without inventing records', async () => {
    const repository = {
      findHistory: vi.fn().mockResolvedValue({ items: [], page: 1, limit: 20, totalItems: 0 }),
    };
    expect(await new GetGameHistory(repository).execute(player, { page: 1, limit: 20 })).toEqual({
      items: [],
      page: 1,
      limit: 20,
      totalItems: 0,
    });
  });
});
