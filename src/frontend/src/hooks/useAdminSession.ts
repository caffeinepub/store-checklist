import { useState, useEffect } from 'react';
import { 
  getAdminSession, 
  setAdminSession, 
  clearAdminSession,
  type AdminCredentials 
} from '../utils/adminSession';

export function useAdminSession() {
  const [credentials, setCredentials] = useState<AdminCredentials | null>(getAdminSession);

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

  // Sync with sessionStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setCredentials(getAdminSession());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return {
    isAdminSessionActive,
    getAdminCredentials,
    saveAdminSession,
    clearSession,
    credentials,
  };
}
