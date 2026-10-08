/**
 * Enterprise Structured Logger for AURA LMS
 *
 * Provides leveled, structured logging with PII/secret masking,
 * contextual correlation (requestId, userId), and JSON output for production observability.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogContext {
  requestId?: string;
  userId?: string;
  route?: string;
  method?: string;
  durationMs?: number;
  [key: string]: unknown;
}

const SENSITIVE_KEYS = new Set([
  "password",
  "token",
  "secret",
  "authorization",
  "creditcard",
  "cardnumber",
  "cvv",
  "key",
  "apikey",
  "signature",
  "razorpay_signature",
  "webhook_secret",
]);

/**
 * Recursively masks sensitive fields in objects and query params.
 */
export function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 5) return "[Truncated: Max Depth]";
  if (data === null || data === undefined) return data;

  if (typeof data === "string") {
    // Redact bearer tokens
    if (/bearer\s+[a-zA-Z0-9._-]+/i.test(data)) {
      return data.replace(/bearer\s+[a-zA-Z0-9._-]+/i, "Bearer [REDACTED]");
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1));
  }

  if (typeof data === "object") {
    const sanitized: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = sanitizeLogData(val, depth + 1);
      }
    }
    return sanitized;
  }

  return data;
}

class Logger {
  private isProduction = process.env.NODE_ENV === "production";
  private isTest = process.env.NODE_ENV === "test";

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    extra?: unknown
  ): string {
    const timestamp = new Date().toISOString();
    const payload = {
      timestamp,
      level,
      message,
      ...(context ? (sanitizeLogData(context) as object) : {}),
      ...(extra !== undefined ? { extra: sanitizeLogData(extra) } : {}),
    };

    if (this.isProduction) {
      return JSON.stringify(payload);
    }

    // Dev/Test human readable format
    const reqStr = context?.requestId ? ` [req:${context.requestId.slice(0, 8)}]` : "";
    const userStr = context?.userId ? ` [user:${context.userId.slice(0, 8)}]` : "";
    const durationStr = context?.durationMs !== undefined ? ` (${context.durationMs}ms)` : "";
    return `[${timestamp}] [${level.toUpperCase()}]${reqStr}${userStr} ${message}${durationStr}`;
  }

  debug(message: string, context?: LogContext, extra?: unknown) {
    if (this.isProduction && process.env.LOG_LEVEL !== "debug") return;
    console.debug(this.formatMessage("debug", message, context, extra));
  }

  info(message: string, context?: LogContext, extra?: unknown) {
    if (this.isTest && process.env.VERBOSE !== "true") return;
    console.info(this.formatMessage("info", message, context, extra));
  }

  warn(message: string, context?: LogContext, extra?: unknown) {
    console.warn(this.formatMessage("warn", message, context, extra));
  }

  error(message: string, context?: LogContext, error?: unknown) {
    let errorDetails: unknown = error;
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack,
      };
    }
    console.error(this.formatMessage("error", message, context, errorDetails));
  }
}

export const logger = new Logger();
