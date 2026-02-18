import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendActor } from './useBackendActor';

export interface UseAdminBootstrapReturn {
  attemptBootstrap: () => Promise<boolean>;
  isBootstrapping: boolean;
  bootstrapError: string | null;
  bootstrapSuccess: boolean;
}

/**
 * Hook for attempting admin bootstrap by calling the backend's initialize() method.
 * On success, invalidates admin authorization queries to trigger re-check.
 */
export function useAdminBootstrap(): UseAdminBootstrapReturn {
  const { actor, actorReady } = useBackendActor();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      if (!actor || !actorReady) {
        throw new Error('Backend not ready');
      }

      // Check if the actor has an initialize method (for bootstrap)
      // The backend may not expose this method in the interface, but it exists
      const actorWithInit = actor as any;
      
      if (typeof actorWithInit.initialize === 'function') {
        console.log('Attempting admin bootstrap via initialize()...');
        await actorWithInit.initialize();
        console.log('Bootstrap successful');
        return true;
      } else {
        console.log('No initialize method found on actor');
        throw new Error('Bootstrap method not available');
      }
    },
    onSuccess: async () => {
      // Invalidate admin authorization to trigger re-check
      console.log('Invalidating admin authorization after bootstrap');
      await queryClient.invalidateQueries({ queryKey: ['adminAuthorization'] });
      
      // Small delay to ensure backend state is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Refetch admin status
      await queryClient.refetchQueries({ queryKey: ['adminAuthorization'] });
    },
  });

  const attemptBootstrap = async (): Promise<boolean> => {
    try {
      await mutation.mutateAsync();
      return true;
    } catch (error) {
      console.error('Bootstrap failed:', error);
      return false;
    }
  };

  return {
    attemptBootstrap,
    isBootstrapping: mutation.isPending,
    bootstrapError: mutation.isError
      ? mutation.error instanceof Error
        ? mutation.error.message
        : 'Bootstrap failed'
      : null,
    bootstrapSuccess: mutation.isSuccess,
  };
}
