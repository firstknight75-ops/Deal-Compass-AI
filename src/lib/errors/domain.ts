import { AppError, type ErrorContext } from "./base";

/** Raised when a requested resource cannot be found. */
export class NotFoundError extends AppError {
  readonly code = "NOT_FOUND";
  readonly statusCode = 404;

  constructor(resource: string, id: string) {
    super(`${resource} not found`, { resource, id });
  }
}

/** Raised when authentication is missing or invalid. */
export class UnauthorizedError extends AppError {
  readonly code = "UNAUTHORIZED";
  readonly statusCode = 401;

  constructor(message = "Authentication required") {
    super(message);
  }
}

/** Raised when a user is authenticated but not authorized. */
export class ForbiddenError extends AppError {
  readonly code = "FORBIDDEN";
  readonly statusCode = 403;

  constructor(action: string, resource: string) {
    super(`Not allowed to ${action} ${resource}`, { action, resource });
  }
}

/** Raised when an external input fails validation. */
export class ValidationError extends AppError {
  readonly code = "VALIDATION_ERROR";
  readonly statusCode = 400;
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, fieldErrors: Record<string, string[]> = {}) {
    super(message, { fieldErrors });
    this.fieldErrors = fieldErrors;
  }
}

/** Raised when a uniqueness or state conflict occurs. */
export class ConflictError extends AppError {
  readonly code = "CONFLICT";
  readonly statusCode = 409;

  constructor(resource: string, field: string) {
    super(`${resource} with this ${field} already exists`, { resource, field });
  }
}

/** Raised when a request exceeds the configured rate limit. */
export class RateLimitError extends AppError {
  readonly code = "RATE_LIMIT_EXCEEDED";
  readonly statusCode = 429;
  readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("Rate limit exceeded", { retryAfterSeconds });
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/** Raised when an external dependency fails. */
export class ExternalServiceError extends AppError {
  readonly code = "EXTERNAL_SERVICE_ERROR";
  readonly statusCode = 502;
  readonly service: string;

  constructor(service: string, message: string, context?: ErrorContext) {
    super(`External service error: ${message}`, { service, ...context });
    this.service = service;
  }
}

/** Raised when a paid action requires more credits than are available. */
export class InsufficientCreditsError extends AppError {
  readonly code = "INSUFFICIENT_CREDITS";
  readonly statusCode = 402;

  constructor(required: number, available: number) {
    super("Insufficient credits", { required, available });
  }
}
