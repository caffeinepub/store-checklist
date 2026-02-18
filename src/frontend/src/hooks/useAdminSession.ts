import { useState, useEffect } from 'react';
import { 
  getAdminSession, 
  setAdminSession, 
  clearAdminSession,
  type AdminCredentials 
} from '../utils/adminSession';

export function useAdminSession() {
  const [credentials, setCredentials] = useState<AdminCredentials | null>(() => getAdminSession());

  const isAdminSessionActive = (): boolean => {
    return credentials !== null;
  };

  const getAdminCredentials = (): AdminCredentials | null => {
    return credentials;
  };

  const saveAdminSession = (creds: AdminCredentials): void => {
    setAdminSession(creds);
    setCredentials(creds);
  };

  const clearSession = (): void => {
    clearAdminSession();
    setCredentials(null);
  };

  // Re-hydrate session on mount and visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const session = getAdminSession();
        setCredentials(session);
      }
    };

    const handlePageShow = () => {
      const session = getAdminSession();
      setCredentials(session);
    };

    // Sync with sessionStorage changes from other tabs
    const handleStorageChange = () => {
      setCredentials(getAdminSession());
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    isAdminSessionActive,
    getAdminCredentials,
    saveAdminSession,
    clearSession,
    credentials,
  };
}
