import { ApiError, NETWORK_ERROR, UNKNOWN_ERROR } from './api-error';
import type {
  ClaimedReward,
  ErrorBody,
  GameHistoryItem,
  Page,
  PageQuery,
  PlayedRound,
  PlayerProgress,
  PlayerSession,
  ProgressReset,
  RewardHistoryItem,
} from './types';

type Fetch = typeof fetch;

function isErrorBody(value: unknown): value is ErrorBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as ErrorBody).code === 'string' &&
    typeof (value as ErrorBody).message === 'string'
  );
}

function pageQuery({ page, limit }: PageQuery = {}): string {
  const params = new URLSearchParams();
  if (page !== undefined) params.set('page', String(page));
  if (limit !== undefined) params.set('limit', String(limit));
  const query = params.toString();
  return query ? `?${query}` : '';
}

/**
 * Client for the API, which the web app serves under the same origin at /api.
 * When a request fails with 401 SESSION_REQUIRED, a new session is started and the request is
 * retried once.
 */
export function createApiClient(fetchImpl: Fetch = (...args) => fetch(...args)) {
  async function send<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetchImpl(`/api${path}`, {
        ...init,
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        },
      });
    } catch {
      throw new ApiError(
        0,
        NETWORK_ERROR,
        'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่',
      );
    }

    const body: unknown = await response.json().catch(() => undefined);
    if (response.ok) {
      return body as T;
    }
    if (isErrorBody(body)) {
      throw new ApiError(response.status, body.code, body.message);
    }
    throw new ApiError(response.status, UNKNOWN_ERROR, 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง');
  }

  function initializeSession(): Promise<PlayerSession> {
    return send<PlayerSession>('/session', { method: 'POST' });
  }

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    try {
      return await send<T>(path, init);
    } catch (error) {
      if (error instanceof ApiError && error.code === 'SESSION_REQUIRED') {
        await initializeSession();
        return send<T>(path, init);
      }
      throw error;
    }
  }

  const post = <T>(path: string, body: object) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) });

  return {
    initializeSession,
    getProgress: () => request<PlayerProgress>('/me'),
    playRound: (requestId: string, progressVersion: number) =>
      post<PlayedRound>('/game-rounds', { requestId, progressVersion }),
    getGameHistory: (query?: PageQuery) =>
      request<Page<GameHistoryItem>>(`/game-rounds${pageQuery(query)}`),
    claimReward: (checkpointId: string, progressVersion: number) =>
      post<ClaimedReward>(`/checkpoints/${encodeURIComponent(checkpointId)}/claim`, {
        progressVersion,
      }),
    getRewardHistory: (query?: PageQuery) =>
      request<Page<RewardHistoryItem>>(`/reward-claims${pageQuery(query)}`),
    resetProgress: (progressVersion: number) =>
      post<ProgressReset>('/me/reset', { progressVersion }),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

export const api = createApiClient();
