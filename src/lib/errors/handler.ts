import { ZodError } from "zod";
import { logger } from "../logging";
import { AppError } from "./base";
import { ValidationError } from "./domain";

export interface ApiErrorResponse {
  readonly statusCode: number;
  readonly body: Record<string, unknown>;
}

/**
 * Converts unknown errors into structured API responses.
 * Internal details are not exposed to clients in production.
 */
export function handleApiError(error: unknown): ApiErrorResponse {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: error.toJSON(),
    };
  }

  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      "Validation failed",
      error.flatten().fieldErrors as Record<string, string[]>,
    );

    return {
      statusCode: validationError.statusCode,
      body: validationError.toJSON(),
    };
  }

  logger.error("Unhandled error", {
    error:
      error instanceof Error
        ? {
            message: error.message,
            stack: error.stack,
            name: error.name,
          }
        : error,
  });

  return {
    statusCode: 500,
    body: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred",
      timestamp: new Date().toISOString(),
    },
  };
}

/**
 * Converts unknown errors into a JSON `Response` for TanStack Start server routes.
 */
export function errorToResponse(error: unknown): Response {
  const { statusCode, body } = handleApiError(error);
  return Response.json(body, { status: statusCode });
}
