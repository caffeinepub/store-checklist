/**
 * Normalizes backend/replica/HTTP-agent errors into user-friendly messages
 */

export function normalizeBackendError(error: unknown): string {
  if (!error) return 'An unknown error occurred';

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check for common backend unavailable patterns
  if (
    errorMessage.includes('is stopped') ||
    errorMessage.includes('canister is not running') ||
    errorMessage.includes('replica returned a rejection error') ||
    errorMessage.includes('Request ID:') ||
    errorMessage.includes('Reject code:') ||
    errorMessage.includes('IC0508') ||
    errorMessage.includes('IC0503')
  ) {
    return 'The service is temporarily unavailable. Please try again in a moment.';
  }

  // Check for network/connection errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError')
  ) {
    return 'Network connection error. Please check your internet connection.';
  }

  // Check for authorization errors (keep these specific)
  if (errorMessage.includes('Unauthorized')) {
    // Check if it's an admin-specific error
    if (errorMessage.toLowerCase().includes('only admins') || errorMessage.toLowerCase().includes('admin')) {
      return 'Admin access required. Please log in with admin credentials.';
    }
    return errorMessage; // Return as-is for other auth errors
  }

  // Check for actor not available (should be rare with new wrapper)
  if (errorMessage.includes('Actor not available')) {
    return 'Connecting to backend service...';
  }

  // For other errors, return a cleaned version
  // Remove technical details like request IDs, reject codes, etc.
  const cleanMessage = errorMessage
    .replace(/Request ID:.*?(?=Reject|$)/gi, '')
    .replace(/Reject code:.*?(?=Reject text|$)/gi, '')
    .replace(/Reject text:/gi, '')
    .replace(/Error code:.*?(?=context|$)/gi, '')
    .replace(/context:.*?(?=Canister|Method|$)/gi, '')
    .replace(/Canister ID:.*?(?=Method|$)/gi, '')
    .replace(/Method name:.*?(?=HTTP|$)/gi, '')
    .replace(/HTTP details:.*$/gi, '')
    .trim();

  // If we cleaned everything away, return a generic message
  if (!cleanMessage || cleanMessage.length < 10) {
    return 'An error occurred while processing your request.';
  }

  return cleanMessage;
}

/**
 * Checks if an error indicates the backend is temporarily unavailable
 */
export function isBackendUnavailableError(error: unknown): boolean {
  if (!error) return false;
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    errorMessage.includes('temporarily unavailable') ||
    errorMessage.includes('is stopped') ||
    errorMessage.includes('canister is not running') ||
    errorMessage.includes('replica returned a rejection error') ||
    errorMessage.includes('IC0508') ||
    errorMessage.includes('IC0503') ||
    errorMessage.includes('Network connection error') ||
    errorMessage.includes('Unable to connect to backend')
  );
}

/**
 * Checks if an error indicates unauthorized access (admin or user)
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (!error) return false;
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('Admin access required') ||
    errorMessage.toLowerCase().includes('only admins') ||
    errorMessage.toLowerCase().includes('only users')
  );
}

/**
 * Checks if an error indicates invalid admin credentials
 * Note: With the new authorization system, this checks for admin-specific unauthorized errors
 */
export function isInvalidCredentialsError(error: unknown): boolean {
  if (!error) return false;
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  return (
    errorMessage.includes('Admin access required') ||
    (errorMessage.includes('Unauthorized') && 
      (errorMessage.toLowerCase().includes('only admins') || 
       errorMessage.toLowerCase().includes('admin')))
  );
}
