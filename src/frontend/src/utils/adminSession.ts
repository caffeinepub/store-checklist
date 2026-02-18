// Session storage utilities for admin credentials
export interface AdminCredentials {
  userId: string;
  password: string;
}

const ADMIN_SESSION_KEY = 'admin_session';
const ADMIN_REDIRECT_MESSAGE_KEY = 'admin_redirect_message';

export function setAdminSession(credentials: AdminCredentials): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(credentials));
}

export function getAdminSession(): AdminCredentials | null {
  const stored = sessionStorage.getItem(ADMIN_SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AdminCredentials;
  } catch {
    return null;
  }
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export function setAdminRedirectMessage(message: string): void {
  sessionStorage.setItem(ADMIN_REDIRECT_MESSAGE_KEY, message);
}

export function getAdminRedirectMessage(): string | null {
  return sessionStorage.getItem(ADMIN_REDIRECT_MESSAGE_KEY);
}

export function clearAdminRedirectMessage(): void {
  sessionStorage.removeItem(ADMIN_REDIRECT_MESSAGE_KEY);
}
