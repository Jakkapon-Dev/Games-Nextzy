'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from './api/client';

export const queryKeys = {
  session: ['session'] as const,
  progress: ['progress'] as const,
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
