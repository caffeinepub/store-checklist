import { useQuery } from '@tanstack/react-query';
import { useBackendActor } from './useBackendActor';
import { useInternetIdentity } from './useInternetIdentity';

export interface UseAdminAuthorizationReturn {
  isAdmin: boolean;
  isCheckingAdmin: boolean;
  adminCheckError: string | null;
  refetchAdminStatus: () => Promise<void>;
}

/**
 * Hook that checks if the current Internet Identity principal has admin role.
 * Includes actorVersion in query key to re-check after actor recreation.
 * Provides better error handling to distinguish connectivity issues from authorization failures.
 */
export function useAdminAuthorization(): UseAdminAuthorizationReturn {
  const { actor, actorReady, actorVersion } = useBackendActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<boolean>({
    queryKey: ['adminAuthorization', identity?.getPrincipal().toString(), actorVersion],
    queryFn: async () => {
      if (!actor) {
        console.log('Admin check: actor not available');
        throw new Error('Backend actor not available');
      }
      try {
        const result = await actor.hasAdminRole();
        console.log('Admin check result:', result);
        return result;
      } catch (error) {
        console.error('Admin authorization check failed:', error);
        // Re-throw to let React Query handle it
        throw error;
      }
    },
    enabled: !!actor && actorReady && !!identity,
    retry: 1, // Retry once on failure
    staleTime: 30 * 1000, // 30 seconds - allow re-checks after actor recreation
  });

  // Determine if this is a connectivity error vs authorization failure
  let adminCheckError: string | null = null;
  if (query.isError) {
    const errorMessage = query.error instanceof Error ? query.error.message : 'Unknown error';
    if (errorMessage.includes('not available') || errorMessage.includes('network')) {
      adminCheckError = 'Unable to verify admin status. Please check your connection.';
    } else {
      adminCheckError = 'Failed to verify admin status';
    }
  }

  return {
    isAdmin: query.data === true,
    isCheckingAdmin: query.isLoading || query.isFetching,
    adminCheckError,
    refetchAdminStatus: async () => {
      await query.refetch();
    },
  };
}
