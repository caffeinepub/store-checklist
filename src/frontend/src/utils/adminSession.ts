/**
 * Session storage utilities for managing admin bootstrap credentials.
 * These credentials are stored in sessionStorage and cleared on logout/tab close.
 */

const ADMIN_TOKEN_KEY = 'caffeineAdminToken';
const ADMIN_REDIRECT_KEY = 'adminRedirectMessage';

export interface AdminCredentials {
  token: string;
}

/**
 * Get admin bootstrap token from sessionStorage
 */
export function getAdminToken(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to read admin token from sessionStorage:', error);
    return null;
  }
}

/**
 * Save admin bootstrap token to sessionStorage
 */
export function setAdminToken(token: string): void {
  try {
    sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
  } catch (error) {
    console.error('Failed to save admin token to sessionStorage:', error);
  }
}

/**
 * Clear admin bootstrap token from sessionStorage
 */
export function clearAdminToken(): void {
  try {
    sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch (error) {
    console.error('Failed to clear admin token from sessionStorage:', error);
  }
}

/**
 * Check if admin token exists in sessionStorage
 */
export function hasAdminToken(): boolean {
  return getAdminToken() !== null;
}

/**
 * Get admin redirect message from sessionStorage
 */
export function getAdminRedirectMessage(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_REDIRECT_KEY);
  } catch (error) {
    console.error('Failed to read admin redirect message:', error);
    return null;
  }
}

/**
 * Save admin redirect message to sessionStorage
 */
export function setAdminRedirectMessage(message: string): void {
  try {
    sessionStorage.setItem(ADMIN_REDIRECT_KEY, message);
  } catch (error) {
    console.error('Failed to save admin redirect message:', error);
  }
}

/**
 * Clear admin redirect message from sessionStorage
 */
export function clearAdminRedirectMessage(): void {
  try {
    sessionStorage.removeItem(ADMIN_REDIRECT_KEY);
  } catch (error) {
    console.error('Failed to clear admin redirect message:', error);
  }
}

/**
 * Clear all admin session data
 */
export function clearAdminSession(): void {
  clearAdminToken();
  clearAdminRedirectMessage();
}
