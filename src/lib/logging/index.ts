export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: string;
  readonly service: string;
  readonly traceId?: string;
  readonly userId?: string;
  readonly organizationId?: string;
  readonly [key: string]: unknown;
}

const REDACTED_KEYS = new Set(["password", "token", "secret", "authorization", "apiKey", "apikey"]);

function sanitizeContext(context: Record<string, unknown> = {}): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(context).map(([key, value]) => {
      if (REDACTED_KEYS.has(key.toLowerCase())) return [key, "[REDACTED]"];
      return [key, value];
    }),
  );
}

/**
 * Structured JSON logger. Never log PII; use stable IDs instead.
 */
export class Logger {
  private readonly service: string;
  private readonly baseContext: Record<string, unknown>;

  constructor(service: string, baseContext: Record<string, unknown> = {}) {
    this.service = service;
    this.baseContext = sanitizeContext(baseContext);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (level === "debug" && process.env.NODE_ENV === "production") return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      ...this.baseContext,
      ...sanitizeContext(context),
    };

    process.stdout.write(`${JSON.stringify(entry)}\n`);
  }

  /** Writes a debug-level event outside production. */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  /** Writes an informational event. */
  info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  /** Writes a warning event. */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  /** Writes an error event. */
  error(message: string, context?: Record<string, unknown>): void {
    this.log("error", message, context);
  }

  /** Creates a logger with additional static context. */
  child(context: Record<string, unknown>): Logger {
    return new Logger(this.service, { ...this.baseContext, ...context });
  }
}

export const logger = new Logger("dealcompass");

/**
 * Creates a named structured logger for a specific service/module.
 */
export function createLogger(service: string): Logger {
  return new Logger(service);
}
