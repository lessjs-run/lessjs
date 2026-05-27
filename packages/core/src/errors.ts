/**
 * @lessjs/core — Unified Error Architecture (ADR-0053 / SOP-011).
 *
 * Four-layer error system:
 *   Layer 1: Typed error hierarchy (LessError → RenderError → ...)
 *   Layer 2: ErrorBoundary component (catch + fallback render)
 *   Layer 3: Error propagation pipeline (SSR accumulation, CSR bubbling, SPA retry)
 *   Layer 4: Error telemetry hook (application-level observer)
 *
 * All errors carry: code, severity, phase, recoverable, cause.
 */

// ─── Error Severity ─────────────────────────────────────────────────

export type ErrorSeverity = 'error' | 'warning';

// ─── Error Phase ────────────────────────────────────────────────────

export type ErrorPhase =
  | 'render'
  | 'ssr'
  | 'csr'
  | 'build'
  | 'navigation'
  | 'validation'
  | 'unknown';

// ─── Error Codes ────────────────────────────────────────────────────

export enum ErrorCode {
  SSR_RENDER_ERROR = 'SSR_RENDER_ERROR',
  ISLAND_RENDER_ERROR = 'ISLAND_RENDER_ERROR',
  PROP_VALIDATION_ERROR = 'PROP_VALIDATION_ERROR',
  NAVIGATION_ERROR = 'NAVIGATION_ERROR',
  BUILD_ERROR = 'BUILD_ERROR',
  RENDER_ERROR = 'RENDER_ERROR',
  BOUNDARY_CAUGHT = 'BOUNDARY_CAUGHT',
  UNKNOWN = 'UNKNOWN',
}

// ─── Base Error ─────────────────────────────────────────────────────

export class LessError extends Error {
  /** Stable error code from ErrorCode enum */
  public readonly code: ErrorCode;
  /** Error severity */
  public readonly severity: ErrorSeverity;
  /** Lifecycle phase where the error originated */
  public readonly phase: ErrorPhase;
  /** Can the application continue after this error? */
  public readonly recoverable: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    severity: ErrorSeverity = 'error',
    phase: ErrorPhase = 'unknown',
    recoverable = false,
    cause?: Error,
  ) {
    super(message, cause ? { cause } : undefined);
    this.name = 'LessError';
    this.code = code;
    this.severity = severity;
    this.phase = phase;
    this.recoverable = recoverable;
    if (cause) this.cause = cause;
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      severity: this.severity,
      phase: this.phase,
      recoverable: this.recoverable,
      cause: this.cause instanceof Error ? this.cause.message : this.cause,
    };
  }
}

// ─── Render Errors ──────────────────────────────────────────────────

/** Base class for all render-pipeline errors */
export class RenderError extends LessError {
  public readonly componentPath: string;

  constructor(
    componentPath: string,
    message: string,
    code: ErrorCode = ErrorCode.RENDER_ERROR,
    cause?: Error,
  ) {
    super(message, code, 'error', 'render', true, cause);
    this.name = 'RenderError';
    this.componentPath = componentPath;
  }

  override toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      componentPath: this.componentPath,
    };
  }
}

/** SSR rendering failed */
export class SsrRenderError extends RenderError {
  public readonly sourceError: Error;

  constructor(componentPath: string, sourceError: Error) {
    super(
      componentPath,
      `SSR render failed: ${componentPath}`,
      ErrorCode.SSR_RENDER_ERROR,
      sourceError,
    );
    this.name = 'SsrRenderError';
    this.sourceError = sourceError;
  }
}

/** Island hydration failed */
export class IslandRenderError extends RenderError {
  constructor(componentPath: string, sourceError: Error) {
    super(
      componentPath,
      `Island render failed: ${componentPath}`,
      ErrorCode.ISLAND_RENDER_ERROR,
      sourceError,
    );
    this.name = 'IslandRenderError';
  }
}

/** @prop() validation failed */
export class PropValidationError extends LessError {
  public readonly propertyName: string;
  public readonly receivedValue: unknown;

  constructor(propertyName: string, receivedValue: unknown, cause?: Error) {
    super(
      `@prop validation failed for "${propertyName}": received ${typeof receivedValue}`,
      ErrorCode.PROP_VALIDATION_ERROR,
      'warning',
      'validation',
      true,
      cause,
    );
    this.name = 'PropValidationError';
    this.propertyName = propertyName;
    this.receivedValue = receivedValue;
  }
}

// ─── Navigation Errors ──────────────────────────────────────────────

export class NavigationError extends LessError {
  public readonly route: string;

  constructor(route: string, cause?: Error) {
    super(
      `Navigation failed for route: ${route}`,
      ErrorCode.NAVIGATION_ERROR,
      'error',
      'navigation',
      true,
      cause,
    );
    this.name = 'NavigationError';
    this.route = route;
  }
}

// ─── Build Errors ───────────────────────────────────────────────────

export class BuildError extends LessError {
  constructor(message: string, cause?: Error) {
    super(message, ErrorCode.BUILD_ERROR, 'error', 'build', false, cause);
    this.name = 'BuildError';
  }
}

// ─── Error Telemetry ────────────────────────────────────────────────

export type ErrorTelemetryHook = (error: LessError) => void;

let _telemetryHook: ErrorTelemetryHook | undefined;

export function setErrorTelemetryHook(hook: ErrorTelemetryHook): void {
  _telemetryHook = hook;
}

/** Report an error through the telemetry pipeline */
export function reportError(error: LessError): void {
  if (_telemetryHook) {
    try {
      _telemetryHook(error);
    } catch {
      // Telemetry hook must not throw
    }
  } else {
    console.error(`[LessJS:${error.code}] ${error.message}`);
  }
}

// ─── SSR Error Context ──────────────────────────────────────────────

export interface SsrErrorEntry {
  componentPath: string;
  error: LessError;
  phase: ErrorPhase;
}

export class SsrErrorContext {
  private errors: SsrErrorEntry[] = [];

  add(entry: SsrErrorEntry): void {
    this.errors.push(entry);
    reportError(entry.error);
  }

  get all(): readonly SsrErrorEntry[] {
    return this.errors;
  }

  get hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /** Accumulate errors from another context (e.g. child component) */
  merge(other: SsrErrorContext): void {
    for (const entry of other.errors) {
      this.add(entry);
    }
  }
}
