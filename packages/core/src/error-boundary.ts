/**
 * @lessjs/core — ErrorBoundary (ADR-0053 Layer 2).
 *
 * Catches child component render() errors and displays a fallback
 * UI instead of a bare tag or broken DOM. Errors bubble up through
 * the parent tree if no boundary catches them.
 *
 * Usage:
 * ```ts
 * class MyBoundary extends ErrorBoundary {
 *   onError(error: LessError) {
 *     return html`<error-panel .message=${error.message}></error-panel>`;
 *   }
 *   render() {
 *     return html`<slot></slot>`;
 *   }
 * }
 * ```
 */

import { type VNode } from './vnode.js';
import { DsdElement } from './dsd-element.js';
import { ErrorCode, type ErrorSeverity, LessError } from './errors.js';

export abstract class ErrorBoundary extends DsdElement {
  private _error: LessError | null = null;

  get hasError(): boolean {
    return this._error !== null;
  }

  get error(): LessError | null {
    return this._error;
  }

  /**
   * Render fallback UI when a child component's render() throws.
   * Subclasses MUST override this.
   */
  abstract onError(error: LessError): VNode;

  /**
   * Capture and reset error state on re-render.
   */
  override connectedCallback(): void {
    this._error = null;
    super.connectedCallback();
  }

  /**
   * Wrap child render in try/catch.
   */
  override render(): VNode | null {
    if (this._error) {
      const result = this.onError(this._error);
      return result;
    }
    return super.render();
  }

  /**
   * Call this from parent to catch a child's error.
   */
  catchError(error: Error): void {
    const lessError = error instanceof LessError ? error : new LessError(
      error.message,
      ErrorCode.BOUNDARY_CAUGHT,
      'error' as ErrorSeverity,
      'render',
      true,
      error,
    );
    this._error = lessError;
    // Trigger re-render with error state
    this.update();
  }
}
