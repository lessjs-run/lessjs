/**
 * @lessjs/core - Render Errors.
 *
 * Error types and classification for the render pipeline.
 * Extracted from render-dsd.ts for maintainability.
 *
 * @module @lessjs/core/render-errors
 */

import { escapeHtml } from './html-escape.js';
import { createLogger } from './logger.js';

const log = createLogger('core');

// ─── Error Classification ──────────────────────────────────────

/** Phases where errors can occur during rendering */
export type RenderPhase = 'instantiate' | 'render' | 'nested' | 'style' | 'serialize';

/**
 * Structured error from the render pipeline.
 *
 * Provides a typed, machine-readable error representation instead of
 * ad-hoc HTML comments and console logs.
 */
export interface RenderError {
  /** Pipeline phase where the error occurred */
  phase: RenderPhase;
  /** Tag name of the component that errored */
  tagName: string;
  /** Human-readable error message */
  message: string;
  /** Whether the error is recoverable (pipeline can continue) */
  recoverable: boolean;
}

/**
 * Classify an error from the render pipeline.
 */
export function classifyError(
  phase: RenderPhase,
  tagName: string,
  err: unknown,
  recoverable = false,
): RenderError {
  const message = err instanceof Error ? err.message : String(err);
  return { phase, tagName, message, recoverable };
}

// ─── Error HTML Generation ──────────────────────────────────────

/**
 * Generate instantiation error HTML.
 */
export function instantiationErrorHtml(
  tagName: string,
  errMsg: string,
  sourceStr: string,
  route?: string,
  source?: string,
): string {
  return (
    `<${tagName}${sourceStr}><!-- LessJS ERROR: Failed to instantiate <${tagName}>: ${
      escapeHtml(errMsg)
    } -->` +
    (route ? `\n<!-- Route: ${escapeHtml(route)} -->` : '') +
    (source ? `\n<!-- Source: ${escapeHtml(source)} -->` : '') +
    `</${tagName}>`
  );
}

/**
 * Generate render error HTML content.
 *
 * v0.14.3: Only include error details in HTML comments during development.
 * In production, leaking file paths in HTML comments is a security risk.
 */
export function renderErrorHtml(
  tagName: string,
  err: unknown,
): string {
  const errMsg = err instanceof Error ? err.message : String(err);
  const errStack = err instanceof Error ? err.stack : '';
  log.error(
    `<${tagName}> render() failed: ${errMsg}${errStack ? `\n${errStack}` : ''}`,
  );

  // Cross-runtime environment detection
  // deno-lint-ignore no-explicit-any
  const _nodeProcess = (globalThis as any).process as
    | { env?: Record<string, string | undefined> }
    | undefined;
  const _nodeIsDev = _nodeProcess?.env?.NODE_ENV !== 'production';
  const isDev = typeof Deno !== 'undefined'
    ? Deno.env?.get('LESSJS_ENV') !== 'production'
    : _nodeIsDev;

  if (isDev) {
    return `<!-- LessJS ERROR: <${tagName}> render() threw: ${escapeHtml(errMsg)} -->\n` +
      (errStack
        ? `<!-- Stack: ${escapeHtml(errStack.split('\n').slice(0, 3).join(' | '))} -->\n`
        : '') +
      '<!-- Check console for full error details -->';
  } else {
    return `<!-- LessJS ERROR: <${tagName}> render() failed -->` +
      '<!-- Check console for full error details -->';
  }
}

/**
 * Generate wrong-return-type error HTML content.
 */
export function wrongTypeErrorHtml(
  tagName: string,
  resultType: string,
  errDetail: string,
): string {
  log.error(
    `<${tagName}> render() returned ${resultType} instead of string. ${errDetail}`,
  );
  return `<!-- LessJS ERROR: <${tagName}> render() returned ${resultType}, expected string. ${errDetail} -->`;
}
