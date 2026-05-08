/**
 * @lessjs/core - Structured Logger
 *
 * Provides scoped, leveled logging for the LessJS framework.
 * - logError: logs only, never throws (owner decision Q-4)
 * - logDebug: guarded by DEBUG compile-time constant for DCE
 *
 * @module @lessjs/core/logger
 */

import { LessError } from './errors.js';

// ─── Log Level ──────────────────────────────────────────────────

/** Log level enum — higher value = less verbose */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

// ─── Prefix Map ─────────────────────────────────────────────────

const PREFIX_MAP: Record<string, string> = {
  core: '[LessJS]',
  ssg: '[LessJS/SSG]',
  blog: '[LessJS/Blog]',
  signal: '[LessJS/Signal]',
};

// ─── DEBUG compile-time constant ───────────────────────────────

declare const DEBUG: boolean;
const _DEBUG: boolean = typeof DEBUG === 'undefined' ? true : DEBUG;

// ─── Logger ─────────────────────────────────────────────────────

export class LessLogger {
  constructor(private prefix: string) {}

  logError(msg: string, err?: unknown): void {
    if (err instanceof LessError) {
      console.error(`${this.prefix} ${msg}`, { code: err.code, statusCode: err.statusCode });
    } else if (err instanceof Error) {
      console.error(`${this.prefix} ${msg}`, err.message);
    } else {
      console.error(`${this.prefix} ${msg}`);
    }
  }

  logWarn(msg: string, detail?: unknown): void {
    if (detail !== undefined) {
      console.warn(`${this.prefix} ${msg}`, detail);
    } else {
      console.warn(`${this.prefix} ${msg}`);
    }
  }

  logInfo(msg: string): void {
    console.log(`${this.prefix} ${msg}`);
  }

  logDebug(msg: string): void {
    if (_DEBUG) {
      console.debug(`${this.prefix} ${msg}`);
    }
  }

  /** Convenience aliases */
  error = this.logError;
  warn = this.logWarn;
  info = this.logInfo;
  debug = this.logDebug;
}

// ─── Factory ────────────────────────────────────────────────────

export function createLogger(scope: string): LessLogger {
  const prefix = PREFIX_MAP[scope] ?? `[LessJS/${scope}]`;
  return new LessLogger(prefix);
}
