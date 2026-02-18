import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useBackendActor } from './useBackendActor';
import type { StoreChecklistEntry, ChecklistItem, UserProfile } from '../backend';
import { ExternalBlob } from '../backend';
import { useAdminAuthorization } from './useAdminAuthorization';
import { useInternetIdentity } from './useInternetIdentity';
import { normalizeBackendError } from '../utils/backendErrors';

// User profile queries
export function useGetCallerUserProfile() {
  const { actor, actorReady, actorLoading } = useBackendActor();
  const { identity } = useInternetIdentity();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) {
        console.error('[useGetCallerUserProfile] Actor not available');
        throw new Error('Backend connection not available');
      }
      try {
        console.log('[useGetCallerUserProfile] Fetching user profile...');
        const profile = await actor.getCallerUserProfile();
        console.log('[useGetCallerUserProfile] Profile fetched:', profile ? 'exists' : 'null');
        return profile;
      } catch (error) {
        console.error('[useGetCallerUserProfile] Error:', error);
        throw new Error(normalizeBackendError(error));
      }
    },
    enabled: actorReady && !!identity,
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
        console.error('[useSaveCallerUserProfile] Backend not ready');
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      try {
        console.log('[useSaveCallerUserProfile] Saving profile...');
        await actor.saveCallerUserProfile(profile);
        console.log('[useSaveCallerUserProfile] Profile saved successfully');
      } catch (error) {
        console.error('[useSaveCallerUserProfile] Error:', error);
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
        console.error('[useCreateChecklistEntry] Backend not ready');
        throw new Error('Backend connection not ready. Please wait and try again.');
      }

      try {
        console.log('[useCreateChecklistEntry] Creating checklist entry...');
        const backendItems: ChecklistItem[] = items.map(item => ({
          name: item.name,
          photo: ExternalBlob.fromBytes(item.photo as Uint8Array<ArrayBuffer>),
        }));

        const entryId = await actor.createChecklistEntry(storeName, backendItems);
        console.log('[useCreateChecklistEntry] Entry created with ID:', entryId);
        return entryId;
      } catch (error) {
        console.error('[useCreateChecklistEntry] Error:', error);
        throw new Error(normalizeBackendError(error));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklistEntries'] });
    },
  });
}

// Admin queries - strictly gated on authenticated identity, actorReady, and confirmed admin status
export function useGetAllChecklistEntries() {
  const { actor, actorReady, actorVersion } = useBackendActor();
  const { isAdmin, isCheckingAdmin } = useAdminAuthorization();
  const { identity } = useInternetIdentity();

  return useQuery<StoreChecklistEntry[]>({
    queryKey: ['checklistEntries', actorVersion],
    queryFn: async () => {
      if (!actor) {
        console.error('[useGetAllChecklistEntries] Actor not available');
        throw new Error('Backend connection not available');
      }
      if (!isAdmin) {
        console.error('[useGetAllChecklistEntries] Not authorized as admin');
        throw new Error('Admin access required');
      }
      try {
        console.log('[useGetAllChecklistEntries] Fetching all entries...');
        const entries = await actor.getAllChecklistEntries();
        console.log('[useGetAllChecklistEntries] Fetched', entries.length, 'entries');
        return entries;
      } catch (error) {
        console.error('[useGetAllChecklistEntries] Error:', error);
        throw new Error(normalizeBackendError(error));
      }
    },
    enabled: !!identity && actorReady && !isCheckingAdmin && isAdmin,
    retry: false,
  });
}

export function useGetAllEntriesSortedByNewest() {
  const { actor, actorReady, actorVersion } = useBackendActor();
  const { isAdmin, isCheckingAdmin } = useAdminAuthorization();
  const { identity } = useInternetIdentity();

  return useQuery<StoreChecklistEntry[]>({
    queryKey: ['checklistEntriesSortedByNewest', actorVersion],
    queryFn: async () => {
      if (!actor) {
        console.error('[useGetAllEntriesSortedByNewest] Actor not available');
        throw new Error('Backend connection not available');
      }
      if (!isAdmin) {
        console.error('[useGetAllEntriesSortedByNewest] Not authorized as admin');
        throw new Error('Admin access required');
      }
      try {
        console.log('[useGetAllEntriesSortedByNewest] Fetching sorted entries...');
        const entries = await actor.getAllEntriesSortedByNewestEntries();
        console.log('[useGetAllEntriesSortedByNewest] Fetched', entries.length, 'entries');
        return entries;
      } catch (error) {
        console.error('[useGetAllEntriesSortedByNewest] Error:', error);
        throw new Error(normalizeBackendError(error));
      }
    },
    enabled: !!identity && actorReady && !isCheckingAdmin && isAdmin,
    retry: false,
  });
}

export function useGetEntry() {
  const { actor, actorReady } = useBackendActor();
  const { isAdmin, isCheckingAdmin } = useAdminAuthorization();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (entryId: string) => {
      if (!actor || !actorReady) {
        console.error('[useGetEntry] Backend not ready');
        throw new Error('Backend connection not ready. Please wait and try again.');
      }
      if (!identity) {
        console.error('[useGetEntry] Not authenticated');
        throw new Error('Authentication required');
      }
      if (isCheckingAdmin) {
        console.error('[useGetEntry] Admin check in progress');
        throw new Error('Verifying admin access...');
      }
      if (!isAdmin) {
        console.error('[useGetEntry] Not authorized as admin');
        throw new Error('Admin access required');
      }
      try {
        console.log('[useGetEntry] Fetching entry:', entryId);
        const entry = await actor.getEntry(entryId);
        console.log('[useGetEntry] Entry fetched:', entry ? 'found' : 'not found');
        return entry;
      } catch (error) {
        console.error('[useGetEntry] Error:', error);
        throw new Error(normalizeBackendError(error));
      }
    },
  });
}
