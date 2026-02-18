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
 * This is the source of truth for admin authorization in the frontend.
 */
export function useAdminAuthorization(): UseAdminAuthorizationReturn {
  const { actor, actorReady } = useBackendActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<boolean>({
    queryKey: ['adminAuthorization', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.hasAdminRole();
      } catch (error) {
        console.error('Admin authorization check failed:', error);
        // If the check fails, assume not admin (fail closed)
        return false;
      }
    },
    enabled: !!actor && actorReady && !!identity,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return {
    isAdmin: query.data === true,
    isCheckingAdmin: query.isLoading || query.isFetching,
    adminCheckError: query.error ? String(query.error) : null,
    refetchAdminStatus: async () => {
      await query.refetch();
    },
  };
}
