import { useState } from 'react';
import { useBackendActor } from './useBackendActor';
import { useAdminAuthorization } from './useAdminAuthorization';
import { classifyError } from '../utils/backendErrors';

export interface UseAdminCredentialLoginReturn {
  submitCredentials: (username: string, password: string) => Promise<boolean>;
  isSubmitting: boolean;
  error: string | null;
  success: boolean;
}

/**
 * Hook to perform Admin/Admin credential submission against the backend login() capability.
 * Integrates with existing authorization flow and surfaces clear error messages.
 */
export function useAdminCredentialLogin(): UseAdminCredentialLoginReturn {
  const { actor, actorReady } = useBackendActor();
  const { refetchAdminStatus } = useAdminAuthorization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitCredentials = async (username: string, password: string): Promise<boolean> => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      if (!actor || !actorReady) {
        throw new Error('Backend service is not ready. Please wait and try again.');
      }

      // Ping backend to verify connectivity
      try {
        await actor.ping();
      } catch (pingError) {
        console.error('Backend ping failed:', pingError);
        throw new Error('Unable to connect to backend service. Please check your connection and try again.');
      }

      // Call backend login
      const result = await actor.login(username, password);

      if (result) {
        setSuccess(true);
        // Force admin status refresh
        await refetchAdminStatus();
        return true;
      } else {
        setError('Invalid credentials. Please check your username and password.');
        return false;
      }
    } catch (err) {
      console.error('Admin credential login error:', err);
      
      const classification = classifyError(err);
      
      if (classification.category === 'network' || classification.category === 'backend-unavailable') {
        setError('Unable to connect to backend service. Please check your connection and try again.');
      } else if (classification.category === 'unauthorized') {
        setError('Invalid credentials. Please check your username and password.');
      } else {
        setError('Login failed. Please try again.');
      }
      
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    submitCredentials,
    isSubmitting,
    error,
    success,
  };
}
