import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendActor } from './useBackendActor';
import type { StoreChecklistEntry, ChecklistItem, UserProfile } from '../backend';
import { ExternalBlob } from '../backend';
import { normalizeBackendError, isRetryableError } from '../utils/backendErrors';
import { useAdminAuthorization } from './useAdminAuthorization';

// User profile queries
export function useGetCallerUserProfile() {
  const { actor, actorReady, actorLoading, checkHealth } = useBackendActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        // Check health to improve error classification
        const pingSucceeded = await checkHealth();
        const normalizedMessage = normalizeBackendError(error, pingSucceeded);
        throw new Error(normalizedMessage);
      }
    },
    enabled: actorReady,
    retry: (failureCount, error) => {
      if (!isRetryableError(error)) return false;
      return failureCount < 2;
    },
  });

  return {
    ...query,
    isLoading: actorLoading || query.isLoading,
    isFetched: actorReady && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor, actorReady, checkHealth } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor || !actorReady) {
        throw new Error('Connecting to backend service. Please wait...');
      }
      try {
        return await actor.saveCallerUserProfile(profile);
      } catch (error) {
        const pingSucceeded = await checkHealth();
        const normalizedMessage = normalizeBackendError(error, pingSucceeded);
        throw new Error(normalizedMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Checklist entry mutations
export function useCreateChecklistEntry() {
  const { actor, actorReady, checkHealth } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeName, items }: { storeName: string; items: Array<{ name: string; photo: Uint8Array }> }) => {
      if (!actor || !actorReady) {
        throw new Error('Connecting to backend service. Please wait...');
      }

      try {
        const backendItems: ChecklistItem[] = items.map(item => ({
          name: item.name,
          photo: ExternalBlob.fromBytes(item.photo as Uint8Array<ArrayBuffer>),
        }));

        return await actor.createChecklistEntry(storeName, backendItems);
      } catch (error) {
        const pingSucceeded = await checkHealth();
        const normalizedMessage = normalizeBackendError(error, pingSucceeded);
        throw new Error(normalizedMessage);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistEntries'] });
    },
  });
}

// Admin queries - now gated by actual backend admin authorization
export function useGetAllChecklistEntries() {
  const { actor, actorReady, checkHealth } = useBackendActor();
  const { isAdmin, isCheckingAdmin } = useAdminAuthorization();

  return useQuery<StoreChecklistEntry[]>({
    queryKey: ['checklistEntries'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getAllChecklistEntries();
      } catch (error) {
        const pingSucceeded = await checkHealth();
        const normalizedMessage = normalizeBackendError(error, pingSucceeded);
        throw new Error(normalizedMessage);
      }
    },
    enabled: actorReady && !isCheckingAdmin && isAdmin,
    retry: (failureCount, error) => {
      if (!isRetryableError(error)) return false;
      return failureCount < 2;
    },
  });
}

export function useGetAllEntriesSortedByNewest() {
  const { actor, actorReady, checkHealth } = useBackendActor();
  const { isAdmin, isCheckingAdmin } = useAdminAuthorization();

  return useQuery<StoreChecklistEntry[]>({
    queryKey: ['checklistEntries', 'sorted', 'newest'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getAllEntriesSortedByNewestEntries();
      } catch (error) {
        const pingSucceeded = await checkHealth();
        const normalizedMessage = normalizeBackendError(error, pingSucceeded);
        throw new Error(normalizedMessage);
      }
    },
    enabled: actorReady && !isCheckingAdmin && isAdmin,
    retry: (failureCount, error) => {
      if (!isRetryableError(error)) return false;
      return failureCount < 2;
    },
  });
}

export function useGetEntry(entryId: string) {
  const { actor, actorReady, checkHealth } = useBackendActor();
  const { isAdmin, isCheckingAdmin } = useAdminAuthorization();

  return useQuery<StoreChecklistEntry | null>({
    queryKey: ['checklistEntry', entryId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getEntry(entryId);
      } catch (error) {
        const pingSucceeded = await checkHealth();
        const normalizedMessage = normalizeBackendError(error, pingSucceeded);
        throw new Error(normalizedMessage);
      }
    },
    enabled: actorReady && !isCheckingAdmin && isAdmin && !!entryId,
    retry: (failureCount, error) => {
      if (!isRetryableError(error)) return false;
      return failureCount < 2;
    },
  });
}

export function useFilterEntriesByStoreName() {
  const { actor, actorReady, checkHealth } = useBackendActor();

  return useMutation({
    mutationFn: async (storeName: string) => {
      if (!actor || !actorReady) {
        throw new Error('Connecting to backend service. Please wait...');
      }
      try {
        return await actor.filterEntriesByStoreName(storeName);
      } catch (error) {
        const pingSucceeded = await checkHealth();
        const normalizedMessage = normalizeBackendError(error, pingSucceeded);
        throw new Error(normalizedMessage);
      }
    },
  });
}
