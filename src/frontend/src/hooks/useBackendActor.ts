import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

export interface UseBackendActorReturn {
  actor: ReturnType<typeof useActor>['actor'];
  actorReady: boolean;
  actorLoading: boolean;
  actorError: string | null;
  retry: () => void;
}

/**
 * Wrapper hook that provides backend actor with explicit readiness state.
 * This ensures queries/mutations wait for actor initialization before executing.
 */
export function useBackendActor(): UseBackendActorReturn {
  const { actor, isFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();

  // Actor is ready when:
  // 1. Not currently fetching/initializing
  // 2. Actor instance exists
  // 3. Identity system is initialized (even if anonymous)
  const actorReady = !isFetching && !isInitializing && !!actor;
  const actorLoading = isFetching || isInitializing;

  // Determine error state
  let actorError: string | null = null;
  if (!actorLoading && !actor) {
    actorError = 'Unable to connect to backend service. Please try again.';
  }

  // Retry function - forces a page reload as the simplest recovery
  const retry = () => {
    window.location.reload();
  };

  return {
    actor,
    actorReady,
    actorLoading,
    actorError,
    retry,
  };
}
