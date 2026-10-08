/**
 * Standardized Application and API Errors
 */

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super(message, 400, "BAD_REQUEST", true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", true, details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Access denied", details?: unknown) {
    super(message, 403, "FORBIDDEN", true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, 404, "NOT_FOUND", true, details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Conflict with current state", details?: unknown) {
    super(message, 409, "CONFLICT", true, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded. Please try again later.", details?: unknown) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", true, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message = "An unexpected error occurred", details?: unknown) {
    super(message, 500, "INTERNAL_SERVER_ERROR", false, details);
  }
}
