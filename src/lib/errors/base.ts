export type ErrorContext = Record<string, unknown>;

/**
 * Base error class for all DealCompass operational errors.
 * Provides structured error information for logging and safe API responses.
 */
export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  readonly isOperational = true;
  readonly timestamp: string;
  readonly context?: ErrorContext;

  protected constructor(message: string, context?: ErrorContext) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date().toISOString();
    this.context = context;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Converts this error to a client-safe JSON shape.
   */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp,
      ...(process.env.NODE_ENV === "development" && {
        context: this.context,
        stack: this.stack,
      }),
    };
  }
}
