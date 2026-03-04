// Custom error classes for Kowloon client

/**
 * Base error class for all Kowloon client errors
 */
export class KowloonError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'KowloonError';
    this.statusCode = options.statusCode;
    this.response = options.response;
    this.requestId = options.requestId;
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends KowloonError {
  constructor(message = 'Authentication required', options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 401 });
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends KowloonError {
  constructor(message = 'Forbidden', options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 403 });
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends KowloonError {
  constructor(message = 'Resource not found', options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 404 });
    this.name = 'NotFoundError';
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends KowloonError {
  constructor(message = 'Validation failed', options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 400 });
    this.name = 'ValidationError';
    this.errors = options.errors || [];
  }
}

/**
 * Server error (500+)
 */
export class ServerError extends KowloonError {
  constructor(message = 'Server error', options = {}) {
    super(message, { ...options, statusCode: options.statusCode || 500 });
    this.name = 'ServerError';
  }
}

/**
 * Network error (connection failure, timeout, etc.)
 */
export class NetworkError extends KowloonError {
  constructor(message = 'Network error', options = {}) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

/**
 * Map HTTP status code to appropriate error class
 * @param {number} status - HTTP status code
 * @param {string} message - Error message
 * @param {Object} options - Additional error options
 * @returns {KowloonError}
 */
export function createErrorFromStatus(status, message, options = {}) {
  const opts = { ...options, statusCode: status };

  if (status === 401) return new AuthenticationError(message, opts);
  if (status === 403) return new AuthorizationError(message, opts);
  if (status === 404) return new NotFoundError(message, opts);
  if (status >= 400 && status < 500) return new ValidationError(message, opts);
  if (status >= 500) return new ServerError(message, opts);

  return new KowloonError(message, opts);
}
