'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from './api/api-error';
import { api } from './api/client';
import { shouldRetry } from './api/retry';
import type { Page } from './api/types';

export const HISTORY_PAGE_SIZE = 20;

function nextPage<T>(last: Page<T>): number | undefined {
  return last.page * last.limit < last.totalItems ? last.page + 1 : undefined;
}

export const queryKeys = {
  session: ['session'] as const,
  progress: ['progress'] as const,
  gameHistory: ['game-history'] as const,
  rewardHistory: ['reward-history'] as const,
};

/** Starts or resumes the player session once per page load. */
export function useSession() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: api.initializeSession,
    staleTime: Infinity,
  });
}

/**
 * Score, progress version and checkpoint statuses, loaded after the session is ready.
 * `retry` repeats whichever step failed: starting the session or loading the progress.
 */
export function useProgress() {
  const session = useSession();
  const progress = useQuery({
    queryKey: queryKeys.progress,
    queryFn: api.getProgress,
    enabled: session.isSuccess,
  });

  return {
    data: progress.data,
    error: session.error ?? progress.error,
    isError: session.isError || progress.isError,
    retry: () => (session.isError ? session.refetch() : progress.refetch()),
  };
}

/**
 * Claims a checkpoint reward. Afterwards the progress and reward history are reloaded; a stale
 * progress version also reloads the progress so the next attempt uses the current version.
 */
export function useClaimReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      checkpointId,
      progressVersion,
    }: {
      checkpointId: string;
      progressVersion: number;
    }) => api.claimReward(checkpointId, progressVersion),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progress }),
        queryClient.invalidateQueries({ queryKey: queryKeys.rewardHistory }),
      ]),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        return queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      }
    },
  });
}

/** Game rounds of the current progress cycle, newest first, loaded page by page. */
export function useGameHistory() {
  const session = useSession();
  return useInfiniteQuery({
    queryKey: queryKeys.gameHistory,
    queryFn: ({ pageParam }) => api.getGameHistory({ page: pageParam, limit: HISTORY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: session.isSuccess,
  });
}

/** Reward claims of the current progress cycle, newest first, loaded page by page. */
export function useRewardHistory() {
  const session = useSession();
  return useInfiniteQuery({
    queryKey: queryKeys.rewardHistory,
    queryFn: ({ pageParam }) => api.getRewardHistory({ page: pageParam, limit: HISTORY_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: nextPage,
    enabled: session.isSuccess,
  });
}

/**
 * Resets the player's progress. All player data is reloaded afterwards; a stale progress version
 * reloads the progress so the player sees the current state.
 */
export function useResetProgress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (progressVersion: number) => api.resetProgress(progressVersion),
    onSuccess: () =>
      Promise.all(
        [queryKeys.progress, queryKeys.gameHistory, queryKeys.rewardHistory].map((queryKey) =>
          queryClient.invalidateQueries({ queryKey }),
        ),
      ),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        return queryClient.invalidateQueries({ queryKey: queryKeys.progress });
      }
    },
  });
}

/**
 * Plays one round. Failed attempts are retried with the same request id, so the API never adds
 * points twice. The progress and game history are reloaded afterwards.
 */
export function usePlayRound() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, progressVersion }: { requestId: string; progressVersion: number }) =>
      api.playRound(requestId, progressVersion),
    retry: (failureCount, error: Error) => shouldRetry(failureCount, error),
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.progress }),
        queryClient.invalidateQueries({ queryKey: queryKeys.gameHistory }),
      ]),
  });
}
