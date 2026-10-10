'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError } from './api/api-error';
import { api } from './api/client';

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
