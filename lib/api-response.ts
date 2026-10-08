import { AppError, BadRequestError } from "./errors.ts";
import { logger } from "./logger.ts";

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    requestId?: string;
    timestamp: string;
    [key: string]: unknown;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code: string;
  requestId?: string;
  details?: unknown;
}

/**
 * Safely parse incoming JSON body without throwing uncaught SyntaxError.
 */
export async function safeJson<T = Record<string, unknown>>(
  request: Request
): Promise<T> {
  try {
    const text = await request.text();
    if (!text || !text.trim()) {
      return {} as T;
    }
    return JSON.parse(text) as T;
  } catch (err) {
    throw new BadRequestError("Invalid JSON in request body", {
      originalError: err instanceof Error ? err.message : String(err),
    });
  }
}

/**
 * Creates a standardized JSON success response.
 */
export function apiSuccess<T>(
  data: T,
  options: {
    status?: number;
    meta?: Record<string, unknown>;
    requestId?: string;
    headers?: Record<string, string>;
  } = {}
): Response {
  const { status = 200, meta, requestId, headers } = options;

  const responseBody: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
      ...(meta || {}),
    },
  };

  const responseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(requestId ? { "X-Request-Id": requestId } : {}),
    ...(headers || {}),
  };

  return Response.json(responseBody, {
    status,
    headers: responseHeaders,
  });
}

/**
 * Creates a standardized JSON error response from any caught error.
 */
export function apiError(
  error: unknown,
  options: {
    requestId?: string;
    defaultStatus?: number;
    headers?: Record<string, string>;
  } = {}
): Response {
  const { requestId, defaultStatus = 500, headers } = options;

  let statusCode = defaultStatus;
  let code = "INTERNAL_SERVER_ERROR";
  let message = "An unexpected error occurred.";
  let details: unknown = undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else if (error instanceof Error) {
    message = error.message;
    if (message.includes("Unauthorized") || message.includes("not logged in")) {
      statusCode = 401;
      code = "UNAUTHORIZED";
    } else if (message.includes("Forbidden") || message.includes("Access denied")) {
      statusCode = 403;
      code = "FORBIDDEN";
    } else if (message.includes("not found")) {
      statusCode = 404;
      code = "NOT_FOUND";
    } else if (message.includes("already exists") || message.includes("Conflict")) {
      statusCode = 409;
      code = "CONFLICT";
    }
  }

  // Log non-operational server errors
  if (statusCode >= 500) {
    logger.error(`API Error [${code}]: ${message}`, { requestId }, error);
  }

  const responseBody: ApiErrorResponse = {
    success: false,
    error: message,
    code,
    ...(requestId ? { requestId } : {}),
    ...(details !== undefined ? { details } : {}),
  };

  const responseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...(requestId ? { "X-Request-Id": requestId } : {}),
    ...(headers || {}),
  };

  return Response.json(responseBody, {
    status: statusCode,
    headers: responseHeaders,
  });
}
