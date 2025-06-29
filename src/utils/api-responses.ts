/**
 * Standardized API Response Utilities
 * Provides consistent JSON response formatting across all API endpoints
 */

// Type definitions for API responses
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data?: T;
  message?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  message: string;
  details?: Record<string, unknown>;
  status: number;
  timestamp: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  error: 'validation_error';
  errors: Record<string, string[]>;
}

// Success response creator
export function createSuccessResponse<T = unknown>(data?: T, message?: string): ApiSuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

// Generic error response creator
export function createErrorResponse(
  error: string,
  message: string,
  status: number,
  details?: Record<string, unknown>
): ApiErrorResponse {
  return {
    success: false,
    error,
    message,
    details,
    status,
    timestamp: new Date().toISOString(),
  };
}

// Validation error response creator
export function createValidationErrorResponse(
  errors: Record<string, string[]>,
  message: string = 'Validation failed'
): ValidationErrorResponse {
  return {
    success: false,
    error: 'validation_error',
    message,
    errors,
    details: { fieldCount: Object.keys(errors).length },
    status: 400,
    timestamp: new Date().toISOString(),
  };
}

// HTTP response creators with proper headers
export function jsonResponse(
  data: ApiSuccessResponse | ApiErrorResponse | ValidationErrorResponse,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'CDN-Cache-Control': 'max-age=10',
      'Vercel-CDN-Cache-Control': 'max-age=10',
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

export function redirectResponse(url: string, status: number = 303): Response {
  return new Response(null, {
    status,
    headers: {
      Location: url,
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
      'CDN-Cache-Control': 'max-age=10',
      'Vercel-CDN-Cache-Control': 'max-age=10',
      Pragma: 'no-cache',
      Expires: '0',
    },
  });
}

// Specific error response helpers
export const ApiErrors = {
  // 400 Client Errors
  badRequest: (message: string = 'Bad request', details?: Record<string, unknown>) =>
    createErrorResponse('bad_request', message, 400, details),

  validation: (errors: Record<string, string[]>, message?: string) => createValidationErrorResponse(errors, message),

  // 401 Unauthorized
  unauthorized: (message: string = 'Authentication required') => createErrorResponse('unauthorized', message, 401),

  // 403 Forbidden
  forbidden: (message: string = 'Access denied') => createErrorResponse('forbidden', message, 403),

  botDetected: () => createErrorResponse('access_denied', 'Bot traffic is not allowed', 403),

  // 404 Not Found
  notFound: (message: string = 'Resource not found') => createErrorResponse('not_found', message, 404),

  // 422 Unprocessable Entity
  unprocessableEntity: (message: string, details?: Record<string, unknown>) =>
    createErrorResponse('validation_error', message, 422, details),

  contentValidation: (message: string = 'Content cannot be processed') =>
    createErrorResponse('content_validation_error', message, 422),

  // 500 Server Errors
  internalServer: (message: string = 'Internal server error. Please try again later.') =>
    createErrorResponse('server_error', message, 500),

  // 502 Bad Gateway
  externalService: (service: string = 'external service') =>
    createErrorResponse('external_service_error', `${service} temporarily unavailable. Please try again.`, 502),

  // 503 Service Unavailable
  serviceUnavailable: (
    message: string = 'Service temporarily unavailable. Please check your connection and try again.'
  ) => createErrorResponse('network_error', message, 503),

  // 504 Gateway Timeout
  timeout: (message: string = 'Request timed out. Please try again.') =>
    createErrorResponse('timeout_error', message, 504),
};

// Error classification helper
export function classifyError(error: unknown): {
  type: string;
  status: number;
  message: string;
} {
  if (typeof error !== 'object' || !error) {
    return { type: 'server_error', status: 500, message: 'Unknown error occurred' };
  }

  const errorString = String(error).toLowerCase();

  // Notion API errors
  if (errorString.includes('notion') && errorString.includes('api')) {
    return {
      type: 'external_service_error',
      status: 502,
      message: 'External service temporarily unavailable. Please try again.',
    };
  }

  // Network errors
  if (errorString.includes('network') || errorString.includes('fetch')) {
    return {
      type: 'network_error',
      status: 503,
      message: 'Service temporarily unavailable. Please check your connection and try again.',
    };
  }

  // Timeout errors
  if (errorString.includes('timeout')) {
    return {
      type: 'timeout_error',
      status: 504,
      message: 'Request timed out. Please try again.',
    };
  }

  // Email service errors
  if (errorString.includes('resend') || errorString.includes('email')) {
    return {
      type: 'email_service_error',
      status: 502,
      message: 'Email service temporarily unavailable. Your form was submitted but confirmation email may be delayed.',
    };
  }

  // Default server error
  return {
    type: 'server_error',
    status: 500,
    message: 'Internal server error. Please try again later.',
  };
}

// Type guards
export function isApiSuccessResponse(response: unknown): response is ApiSuccessResponse {
  return typeof response === 'object' && response !== null && 'success' in response && response.success === true;
}

export function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
  return typeof response === 'object' && response !== null && 'success' in response && response.success === false;
}

export function isValidationErrorResponse(response: unknown): response is ValidationErrorResponse {
  return isApiErrorResponse(response) && 'error' in response && response.error === 'validation_error';
}
