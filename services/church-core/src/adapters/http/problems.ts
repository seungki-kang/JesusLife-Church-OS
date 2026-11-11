import { DependencyUnavailable } from '../../application/errors.js';

/**
 * Error classification and server-side error logging.
 *
 * 503 means "a dependency (database) is unavailable; retrying later may succeed".
 * Anything else that is not an expected HTTP/command error is a defect and maps
 * to 500, so clients do not retry bugs and operators can find them.
 */

const SQLSTATE = /^[0-9A-Z]{5}$/;
const NETWORK_CODES = new Set([
  'ECONNREFUSED',
  'ECONNRESET',
  'ETIMEDOUT',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
  'EHOSTUNREACH',
]);
// node-postgres raises these as plain Errors without a code.
const PG_CONNECTION_MESSAGES = /^(Connection terminated|timeout exceeded when trying to connect)/;

export function isDependencyFailure(error: unknown): boolean {
  if (error instanceof DependencyUnavailable) return true;
  const e = error as { code?: unknown; severity?: unknown; message?: unknown } | null;
  if (typeof e?.code === 'string') {
    // PostgreSQL server errors carry a SQLSTATE code and a severity.
    if (SQLSTATE.test(e.code) && typeof e.severity === 'string') return true;
    if (NETWORK_CODES.has(e.code)) return true;
  }
  return error instanceof Error && PG_CONNECTION_MESSAGES.test(error.message);
}

export type ErrorLogEntry = Readonly<{
  level: 'ERROR';
  traceId: string;
  method: string;
  route: string;
  status: number;
  code: string;
  errorName: string;
  sqlState?: string;
  stack?: readonly string[];
}>;
export type ErrorLog = (entry: ErrorLogEntry) => void;

/**
 * Builds a log entry without the error message, request body, headers or SQL text,
 * which may contain tokens or personal data. Stack frames (file:line) are kept
 * because they carry code locations only.
 */
export function errorEntry(
  error: unknown,
  ctx: { traceId: string; method: string; route: string; status: number; code: string },
): ErrorLogEntry {
  const e = error as { code?: unknown; severity?: unknown } | null;
  const sqlState =
    typeof e?.code === 'string' && SQLSTATE.test(e.code) && typeof e.severity === 'string' ? e.code : undefined;
  const stack =
    error instanceof Error && error.stack
      ? error.stack
          .split('\n')
          .slice(1)
          .map((line) => line.trim())
          .filter((line) => line.startsWith('at '))
          .slice(0, 15)
      : undefined;
  return Object.freeze({
    level: 'ERROR',
    ...ctx,
    errorName: error instanceof Error ? error.name : typeof error,
    ...(sqlState ? { sqlState } : {}),
    ...(stack?.length ? { stack } : {}),
  });
}

export const consoleErrorLog: ErrorLog = (entry) => console.error(JSON.stringify(entry));
