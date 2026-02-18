import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendActor } from './useBackendActor';
import type { StoreChecklistEntry, ChecklistItem, UserProfile } from '../backend';
import { ExternalBlob } from '../backend';
import { normalizeBackendError, isUnauthorizedError, isBackendUnavailableError } from '../utils/backendErrors';

// User profile queries
export function useGetCallerUserProfile() {
  const { actor, actorReady, actorLoading } = useBackendActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
    },
    enabled: actorReady,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorLoading || query.isLoading,
    isFetched: actorReady && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor, actorReady } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor || !actorReady) {
        throw new Error('Connecting to backend service...');
      }
      try {
        return await actor.saveCallerUserProfile(profile);
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
    },
  });
}

// Checklist entry mutations
export function useCreateChecklistEntry() {
  const { actor, actorReady } = useBackendActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ storeName, items }: { storeName: string; items: Array<{ name: string; photo: Uint8Array }> }) => {
      if (!actor || !actorReady) {
        throw new Error('Connecting to backend service...');
      }

      try {
        const backendItems: ChecklistItem[] = items.map(item => ({
          name: item.name,
          photo: ExternalBlob.fromBytes(item.photo as Uint8Array<ArrayBuffer>)
        }));

        return await actor.createChecklistEntry(storeName, backendItems);
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistEntries'] });
    },
  });
}

// Admin queries - these use the new authorization system (no credentials passed)
export function useGetAllEntriesSortedByNewest() {
  const { actor, actorReady, actorLoading } = useBackendActor();

  return useQuery<StoreChecklistEntry[]>({
    queryKey: ['checklistEntries', 'all', 'sorted'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        return await actor.getAllEntriesSortedByNewestEntries();
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
    },
    enabled: actorReady,
    retry: (failureCount, error) => {
      // Don't retry on unauthorized errors
      if (isUnauthorizedError(error)) {
        return false;
      }
      // Retry up to 2 times on backend unavailable
      if (isBackendUnavailableError(error)) {
        return failureCount < 2;
      }
      return failureCount < 2;
    },
  });
}

export function useGetEntry(entryId: string) {
  const { actor, actorReady, actorLoading } = useBackendActor();

  return useQuery<StoreChecklistEntry | null>({
    queryKey: ['checklistEntry', entryId],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      
      try {
        return await actor.getEntry(entryId);
      } catch (error) {
        throw new Error(normalizeBackendError(error));
      }
    },
    enabled: actorReady && !!entryId,
    retry: (failureCount, error) => {
      // Don't retry on unauthorized errors
      if (isUnauthorizedError(error)) {
        return false;
      }
      // Retry up to 2 times on backend unavailable
      if (isBackendUnavailableError(error)) {
        return failureCount < 2;
      }
      return failureCount < 2;
    },
  });
}
