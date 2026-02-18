import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useState, useCallback, useEffect, useRef } from 'react';
import type { backendInterface } from '../backend';

export interface UseBackendActorReturn {
  actor: backendInterface | null;
  actorReady: boolean;
  actorLoading: boolean;
  actorError: string | null;
  actorVersion: number;
  retry: () => Promise<void>;
  pingBackend: () => Promise<boolean>;
}

/**
 * Wrapper hook that provides backend actor with explicit readiness state,
 * version tracking for invalidation, retry capabilities, and health checks.
 * Invalidates admin authorization when actor changes.
 */
export function useBackendActor(): UseBackendActorReturn {
  const { actor, isFetching } = useActor();
  const { identity, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [isRetrying, setIsRetrying] = useState(false);
  const [actorVersion, setActorVersion] = useState(0);
  const [healthCheckFailed, setHealthCheckFailed] = useState(false);
  const prevActorRef = useRef<backendInterface | null>(null);

  // Increment version whenever actor changes (for dependent query invalidation)
  useEffect(() => {
    if (actor !== prevActorRef.current) {
      prevActorRef.current = actor;
      if (actor) {
        console.log('[useBackendActor] Actor changed, incrementing version and invalidating admin auth');
        setActorVersion(prev => prev + 1);
        setHealthCheckFailed(false); // Reset health check on new actor
        
        // Invalidate admin authorization when actor changes
        queryClient.invalidateQueries({ queryKey: ['adminAuthorization'] });
      }
    }
  }, [actor, queryClient]);

  // Perform health check when actor becomes available
  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      if (!actor || healthCheckFailed) return;

      try {
        console.log('[useBackendActor] Performing health check...');
        const result = await actor.ping();
        if (mounted) {
          if (result === 'pong') {
            console.log('[useBackendActor] Health check passed');
            setHealthCheckFailed(false);
          } else {
            console.warn('[useBackendActor] Health check returned unexpected result:', result);
            setHealthCheckFailed(true);
          }
        }
      } catch (error) {
        console.error('[useBackendActor] Health check failed:', error);
        if (mounted) {
          setHealthCheckFailed(true);
        }
      }
    };

    if (actor && !isFetching && !isInitializing) {
      checkHealth();
    }

    return () => {
      mounted = false;
    };
  }, [actor, isFetching, isInitializing, healthCheckFailed]);

  // Actor is ready when not fetching/initializing, actor exists, and health check passed
  const actorReady = !isFetching && !isInitializing && !!actor && !isRetrying && !healthCheckFailed;
  const actorLoading = isFetching || isInitializing || isRetrying;

  // Error state - show if actor failed to load or health check failed
  let actorError: string | null = null;
  if (!actorLoading && !actor) {
    actorError = 'Unable to connect to backend service. Please check your connection and try again.';
  } else if (!actorLoading && healthCheckFailed) {
    actorError = 'Backend service is not responding. Please try again in a moment.';
  }

  // Ping function for manual health checks
  const pingBackend = useCallback(async (): Promise<boolean> => {
    if (!actor) {
      console.error('[useBackendActor] Cannot ping: actor not available');
      return false;
    }

    try {
      console.log('[useBackendActor] Manual ping...');
      const result = await actor.ping();
      const success = result === 'pong';
      console.log('[useBackendActor] Ping result:', success ? 'success' : 'failed');
      setHealthCheckFailed(!success);
      return success;
    } catch (error) {
      console.error('[useBackendActor] Ping failed:', error);
      setHealthCheckFailed(true);
      return false;
    }
  }, [actor]);

  // Retry function - invalidates and refetches the actor query
  const retry = useCallback(async () => {
    console.log('[useBackendActor] Retrying backend connection...');
    setIsRetrying(true);
    setHealthCheckFailed(false);

    try {
      // Invalidate actor query
      await queryClient.invalidateQueries({
        queryKey: ['actor'],
      });

      // Refetch actor
      await queryClient.refetchQueries({
        queryKey: ['actor', identity?.getPrincipal().toString()],
      });

      // Also invalidate admin authorization after retry
      await queryClient.invalidateQueries({
        queryKey: ['adminAuthorization'],
      });

      console.log('[useBackendActor] Backend connection retry completed');
    } catch (error) {
      console.error('[useBackendActor] Retry failed:', error);
    } finally {
      setIsRetrying(false);
    }
  }, [queryClient, identity]);

  return {
    actor,
    actorReady,
    actorLoading,
    actorError,
    actorVersion,
    retry,
    pingBackend,
  };
}
