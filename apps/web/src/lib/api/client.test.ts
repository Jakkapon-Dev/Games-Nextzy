import { describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { createApiClient } from './client';

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

const sessionRequired = () =>
  json(401, { code: 'SESSION_REQUIRED', message: 'ไม่พบ session ผู้เล่น กรุณาเริ่ม session ก่อน' });

describe('createApiClient', () => {
  it('sends same-origin requests to /api and returns the JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, { totalScore: 0 }));
    const api = createApiClient(fetchMock);

    await expect(api.getProgress()).resolves.toEqual({ totalScore: 0 });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/me',
      expect.objectContaining({ credentials: 'same-origin' }),
    );
  });

  it('posts JSON bodies with the documented fields', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json(200, {}));
    const api = createApiClient(fetchMock);

    await api.playRound('7c87a3d2-489e-4e26-8e43-a98d9dbad961', 1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/game-rounds');
    expect(init.method).toBe('POST');
    expect(init.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(init.body as string)).toEqual({
      requestId: '7c87a3d2-489e-4e26-8e43-a98d9dbad961',
      progressVersion: 1,
    });
  });

  it('builds the claim path and pagination queries', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(json(200, {})));
    const api = createApiClient(fetchMock);

    await api.claimReward('checkpoint-5000', 2);
    await api.getGameHistory({ page: 2, limit: 10 });
    await api.getRewardHistory();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/checkpoints/checkpoint-5000/claim',
      '/api/game-rounds?page=2&limit=10',
      '/api/reward-claims',
    ]);
  });

  it('throws ApiError with the status, code and message of an error response', async () => {
    const api = createApiClient(
      vi
        .fn()
        .mockResolvedValue(
          json(409, { code: 'CHECKPOINT_LOCKED', message: 'คะแนนสะสมยังไม่ถึงเกณฑ์รับรางวัล' }),
        ),
    );

    const error = await api.claimReward('checkpoint-5000', 1).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 409,
      code: 'CHECKPOINT_LOCKED',
      message: 'คะแนนสะสมยังไม่ถึงเกณฑ์รับรางวัล',
    });
  });

  it('reports responses without an error body as UNKNOWN_ERROR', async () => {
    const api = createApiClient(
      vi.fn().mockResolvedValue(new Response('Bad gateway', { status: 502 })),
    );

    await expect(api.getProgress()).rejects.toMatchObject({ status: 502, code: 'UNKNOWN_ERROR' });
  });

  it('reports network failures as NETWORK_ERROR', async () => {
    const api = createApiClient(vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(api.getProgress()).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' });
  });

  it('starts a session and retries once after SESSION_REQUIRED', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(sessionRequired())
      .mockResolvedValueOnce(json(200, { playerId: 'p1', totalScore: 0, progressVersion: 1 }))
      .mockResolvedValueOnce(json(200, { totalScore: 0 }));
    const api = createApiClient(fetchMock);

    await expect(api.getProgress()).resolves.toEqual({ totalScore: 0 });

    expect(fetchMock.mock.calls.map(([url, init]) => [url, (init as RequestInit).method])).toEqual([
      ['/api/me', undefined],
      ['/api/session', 'POST'],
      ['/api/me', undefined],
    ]);
  });

  it('gives up after one retry when the session is still missing', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(sessionRequired())
      .mockResolvedValueOnce(json(200, { playerId: 'p1', totalScore: 0, progressVersion: 1 }))
      .mockResolvedValueOnce(sessionRequired());
    const api = createApiClient(fetchMock);

    await expect(api.getProgress()).rejects.toMatchObject({ code: 'SESSION_REQUIRED' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});
