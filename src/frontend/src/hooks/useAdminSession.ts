import { useState, useEffect } from 'react';
import {
  getAdminToken,
  setAdminToken,
  clearAdminToken,
  hasAdminToken,
} from '../utils/adminSession';

export interface UseAdminSessionReturn {
  adminToken: string | null;
  hasToken: boolean;
  saveAdminToken: (token: string) => void;
  clearToken: () => void;
}

/**
 * React hook for managing admin session credentials in sessionStorage.
 * Provides reactive state for token presence and methods to update it.
 */
export function useAdminSession(): UseAdminSessionReturn {
  const [adminToken, setTokenState] = useState<string | null>(getAdminToken());

  // Sync with sessionStorage on mount
  useEffect(() => {
    setTokenState(getAdminToken());
  }, []);

  const saveAdminToken = (newToken: string) => {
    setAdminToken(newToken);
    setTokenState(newToken);
  };

  const clearToken = () => {
    clearAdminToken();
    setTokenState(null);
  };

  return {
    adminToken,
    hasToken: hasAdminToken(),
    saveAdminToken,
    clearToken,
  };
}
