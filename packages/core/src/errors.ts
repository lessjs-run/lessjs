/**
 * @lessjs/core - Error classes
 * Type-safe error hierarchy for the LessJS framework.
 */

/** Base error class for all LessJS framework errors */
export class LessError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
  ) {
    super(message);
    this.name = 'LessError';
  }

  toJSON(): { error: { code: string; message: string } } {
    return {
      error: {
        code: this.code,
        message: this.message,
      },
    };
  }
}

/** SSR rendering failed (HTTP 500, non-operational) */
export class SsrRenderError extends LessError {
  constructor(
    public readonly componentPath: string,
    // M-06 fix: renamed from 'cause' to avoid shadowing Error.cause
    public readonly sourceError: Error,
  ) {
    super(`SSR render failed: ${componentPath}`, 'SSR_RENDER_ERROR', 500, false);
  }
}
