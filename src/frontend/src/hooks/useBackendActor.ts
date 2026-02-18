import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useCallback } from 'react';
import type { backendInterface } from '../backend';

export interface UseBackendActorReturn {
  actor: backendInterface | null;
  actorReady: boolean;
  actorLoading: boolean;
  actorError: string | null;
  actorErrorDetails: unknown;
  retry: () => Promise<void>;
  checkHealth: () => Promise<boolean>;
}

/**
 * Wrapper hook that provides backend actor with explicit readiness state,
 * improved error diagnostics, and health-check capabilities.
 */
export function useBackendActor(): UseBackendActorReturn {
  const { actor, isFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);
  const [healthCheckPassed, setHealthCheckPassed] = useState<boolean | null>(null);
  const [healthCheckInProgress, setHealthCheckInProgress] = useState(false);

  // Actor is ready when:
  // 1. Not currently fetching/initializing
  // 2. Actor instance exists
  // 3. Identity system is initialized (even if anonymous)
  // 4. Health check has passed (or hasn't been attempted yet)
  const actorReady = !isFetching && !isInitializing && !!actor && !isRetrying && healthCheckPassed !== false;
  const actorLoading = isFetching || isInitializing || isRetrying || healthCheckInProgress;

  // Get the underlying query state for better error diagnostics
  const actorQueryState = queryClient.getQueryState([
    'actor',
    identity?.getPrincipal().toString(),
  ]);

  // Determine error state with richer diagnostics
  let actorError: string | null = null;
  let actorErrorDetails: unknown = null;

  // Show error only if health check explicitly failed or actor failed to initialize
  if (healthCheckPassed === false) {
    actorError = 'Unable to connect to the backend service. Please check your connection and try again.';
    actorErrorDetails = 'Health check failed';
  } else if (!actorLoading && !actor) {
    actorErrorDetails = actorQueryState?.error;
    
    if (actorErrorDetails) {
      const errorMessage = actorErrorDetails instanceof Error 
        ? actorErrorDetails.message 
        : String(actorErrorDetails);
      
      // Classify the error - keep messages user-friendly
      if (
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('NetworkError')
      ) {
        actorError = 'Network connection error. Please check your internet connection.';
      } else if (
        errorMessage.includes('canister') ||
        errorMessage.includes('replica') ||
        errorMessage.includes('IC0')
      ) {
        actorError = 'Backend service is temporarily unavailable. Please try again.';
      } else {
        actorError = 'Unable to connect to backend service. Please try again.';
      }
    } else {
      actorError = 'Unable to initialize backend connection. Please try again.';
    }

    // Log detailed error for debugging only
    if (actorErrorDetails) {
      console.error('Backend actor initialization failed:', actorErrorDetails);
    }
  }

  // Health check function - calls backend ping to verify connectivity
  const checkHealth = useCallback(async (): Promise<boolean> => {
    if (!actor) {
      console.warn('Cannot check health: actor not available');
      return false;
    }

    setHealthCheckInProgress(true);
    try {
      const result = await actor.ping();
      const isHealthy = result === 'pong';
      setHealthCheckPassed(isHealthy);
      
      if (isHealthy) {
        console.log('Backend health check: OK');
      } else {
        console.warn('Backend health check: unexpected response', result);
      }
      
      return isHealthy;
    } catch (error) {
      console.error('Backend health check failed:', error);
      setHealthCheckPassed(false);
      return false;
    } finally {
      setHealthCheckInProgress(false);
    }
  }, [actor]);

  // Run health check when actor becomes available
  useEffect(() => {
    if (actor && healthCheckPassed === null && !healthCheckInProgress) {
      checkHealth();
    }
  }, [actor, healthCheckPassed, healthCheckInProgress, checkHealth]);

  // Retry function - invalidates and refetches the actor query without page reload
  const retry = useCallback(async () => {
    console.log('Retrying backend connection...');
    setIsRetrying(true);
    setHealthCheckPassed(null);
    setHealthCheckInProgress(false);

    try {
      // Clear the actor query cache
      await queryClient.invalidateQueries({
        queryKey: ['actor'],
      });

      // Refetch the actor
      await queryClient.refetchQueries({
        queryKey: ['actor', identity?.getPrincipal().toString()],
      });

      console.log('Backend connection retry completed');
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [queryClient, identity]);

  return {
    actor,
    actorReady,
    actorLoading,
    actorError,
    actorErrorDetails,
    retry,
    checkHealth,
  };
}
