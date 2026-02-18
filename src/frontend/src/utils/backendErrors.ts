/**
 * Normalizes backend/replica/HTTP-agent errors into user-friendly messages
 * and provides utilities for error classification and health-check interpretation
 */

export interface ErrorClassification {
  category: 'network' | 'backend-unavailable' | 'unauthorized' | 'unknown';
  userMessage: string;
  isRetryable: boolean;
}

/**
 * Classifies an error and returns structured information about it
 */
export function classifyError(error: unknown, pingSucceeded?: boolean): ErrorClassification {
  if (!error) {
    return {
      category: 'unknown',
      userMessage: 'An unknown error occurred. Please try again.',
      isRetryable: true,
    };
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  // Check for authorization errors first (most specific)
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('Insufficient user privileges')) {
    const isAdminError = errorMessage.includes('admin') || errorMessage.includes('Insufficient user privileges');
    return {
      category: 'unauthorized',
      userMessage: isAdminError ? 'You do not have permission to perform this action.' : 'Access denied. Please check your credentials.',
      isRetryable: false,
    };
  }

  // If ping succeeded but request failed, it's likely an authorization/business logic issue
  if (pingSucceeded === true) {
    return {
      category: 'unauthorized',
      userMessage: 'Request was rejected. Please check your permissions.',
      isRetryable: false,
    };
  }

  // Check for network errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('Failed to fetch') ||
    errorMessage.includes('NetworkError') ||
    errorMessage.includes('ERR_INTERNET_DISCONNECTED') ||
    errorMessage.includes('ERR_NAME_NOT_RESOLVED')
  ) {
    return {
      category: 'network',
      userMessage: 'Network connection error. Please check your internet connection.',
      isRetryable: true,
    };
  }

  // Check for backend unavailable patterns
  if (
    errorMessage.includes('is stopped') ||
    errorMessage.includes('canister is not running') ||
    errorMessage.includes('replica returned a rejection error') ||
    errorMessage.includes('Request ID:') ||
    errorMessage.includes('Reject code:') ||
    errorMessage.includes('IC0508') ||
    errorMessage.includes('IC0503') ||
    errorMessage.includes('IC0301')
  ) {
    return {
      category: 'backend-unavailable',
      userMessage: 'The service is temporarily unavailable. Please try again in a moment.',
      isRetryable: true,
    };
  }

  // If ping failed, it's likely backend unavailable
  if (pingSucceeded === false) {
    return {
      category: 'backend-unavailable',
      userMessage: 'Unable to reach the backend service. Please try again.',
      isRetryable: true,
    };
  }

  // Check for actor not available (should be rare with new wrapper)
  if (errorMessage.includes('Actor not available')) {
    return {
      category: 'backend-unavailable',
      userMessage: 'Connecting to backend service. Please wait...',
      isRetryable: true,
    };
  }

  // For other errors, return a safe, generic message
  // Never expose technical details to the user
  return {
    category: 'unknown',
    userMessage: 'An error occurred. Please try again.',
    isRetryable: true,
  };
}

/**
 * Normalizes backend errors into user-friendly messages
 */
export function normalizeBackendError(error: unknown, pingSucceeded?: boolean): string {
  const classification = classifyError(error, pingSucceeded);
  
  // Log the classification for debugging (technical details stay in console)
  console.error('Error classification:', {
    category: classification.category,
    message: classification.userMessage,
    originalError: error,
    pingSucceeded,
  });

  return classification.userMessage;
}

/**
 * Checks if an error indicates the backend is temporarily unavailable
 */
export function isBackendUnavailableError(error: unknown): boolean {
  const classification = classifyError(error);
  return classification.category === 'backend-unavailable' || classification.category === 'network';
}

/**
 * Checks if an error indicates invalid admin credentials
 */
export function isInvalidCredentialsError(error: unknown): boolean {
  const classification = classifyError(error);
  return classification.category === 'unauthorized';
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  const classification = classifyError(error);
  return classification.isRetryable;
}
