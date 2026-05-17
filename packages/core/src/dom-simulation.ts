/**
 * @lessjs/core - DOM Simulation Experiment (v0.18.3)
 *
 * Experimental renderer for browser-dependent Web Components using
 * Happy DOM as the underlying DOM environment.
 *
 * Rules:
 * - Disabled by default (domSimulation: 'off')
 * - Explicit opt-in per project (domSimulation: 'explicit')
 * - Timeout-bound (default 500ms)
 * - Isolated from normal SSR rendering
 * - Always reported in dsd-report.json
 * - Failure degrades to client-only when policy allows it
 *
 * @see docs/sop/v0.18.3-dom-simulation-experiment.md
 * @see docs/adr/0029-happy-dom-for-dom-simulation.md
 */

import type { DsdBuildReport } from './types.js';

// ─── Types ──────────────────────────────────────────────────────────────

/** Result of a single DOM simulation render attempt */
export interface DomSimulationResult {
  /** Tag name of the component attempted */
  tagName: string;
  /** Whether the simulation succeeded */
  success: boolean;
  /** Render time in milliseconds */
  renderTimeMs: number;
  /** Serialized HTML output (when success is true) */
  html?: string;
  /** Serialized byte size (when success is true) */
  byteSize?: number;
  /** Error message (when success is false) */
  error?: string;
  /** Whether a timeout occurred */
  timedOut: boolean;
  /** Fallback decision */
  fallback: 'client-only' | 'none';
}

/** Options for a single DOM simulation render call */
export interface DomSimulationOptions {
  /** Custom element tag name */
  tagName: string;
  /** Component module path or code to evaluate */
  modulePath?: string;
  /** Component source code (alternative to modulePath) */
  sourceCode?: string;
  /** Timeout in milliseconds */
  timeoutMs: number;
}

// ─── Experimental Renderer ─────────────────────────────────────────────

/**
 * Attempt to render a Web Component through an isolated DOM simulation
 * environment powered by Happy DOM.
 *
 * This is an EXPERIMENTAL feature. Not production-ready.
 *
 * @param options - Render options
 * @returns Simulation result
 */
export async function renderWithDomSimulation(
  options: DomSimulationOptions,
): Promise<DomSimulationResult> {
  const startTime = performance.now();
  const result: DomSimulationResult = {
    tagName: options.tagName,
    success: false,
    renderTimeMs: 0,
    timedOut: false,
    fallback: 'client-only',
  };

  const ac = new AbortController();

  try {
    // Race render vs timeout
    const renderPromise = _simulateInHappyDom(options);
    const timeoutPromise = new Promise<never>((_, reject) => {
      const id = setTimeout(() => {
        ac.abort();
        reject(new Error(`DOM simulation timed out after ${options.timeoutMs}ms`));
      }, options.timeoutMs);
      // Clear timer if aborted before timeout fires
      ac.signal.addEventListener('abort', () => clearTimeout(id), { once: true });
    });

    const renderResult = await Promise.race([renderPromise, timeoutPromise]);

    const elapsed = performance.now() - startTime;
    result.renderTimeMs = Math.round(elapsed);
    result.success = true;
    result.html = renderResult.html;
    result.byteSize = new TextEncoder().encode(renderResult.html).length;
    result.timedOut = false;
    result.fallback = 'none';
  } catch (err) {
    const elapsed = performance.now() - startTime;
    result.renderTimeMs = Math.round(elapsed);
    result.success = false;
    result.error = err instanceof Error ? err.message : String(err);
    result.timedOut = err instanceof Error && err.message.includes('timed out');
    result.fallback = 'client-only';
  }

  return result;
}

// ─── Happy DOM Integration ─────────────────────────────────────────────

interface HappyDomRenderOutput {
  html: string;
}

/**
 * Create an isolated Happy DOM environment and render a Web Component.
 *
 * This function:
 * 1. Creates a fresh Window/Document via Happy DOM
 * 2. Registers the custom element
 * 3. Instantiates and calls connectedCallback()
 * 4. Serializes the shadow DOM content
 * 5. Cleans up global state
 *
 * @internal
 */
async function _simulateInHappyDom(
  options: DomSimulationOptions,
): Promise<HappyDomRenderOutput> {
  // Dynamic import of Happy DOM (only loaded when domSimulation is active)
  let Window: typeof import('happy-dom').Window;
  try {
    const happyDom = await import('happy-dom');
    Window = happyDom.Window;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`Failed to load Happy DOM: ${msg}. Install with: deno add npm:happy-dom`);
  }

  // Create isolated environment
  const window = new Window();
  const { document, customElements, HTMLElement } = window;

  // Define the component class using source code or module
  if (options.sourceCode) {
    try {
      // Execute in a sandboxed context
      // eslint-disable-next-line no-new-func
      const factory = new Function(
        'HTMLElement',
        'customElements',
        'document',
        'window',
        `'use strict'; ${options.sourceCode}; return { tagName: '${options.tagName}' };`,
      );
      factory(HTMLElement, customElements, document, window);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Failed to define component: ${msg}`);
    }
  }

  // Verify the element was defined
  if (!customElements.get(options.tagName)) {
    throw new Error(
      `Component <${options.tagName}> was not registered. ` +
        `Ensure the source code calls customElements.define('${options.tagName}', ...)`,
    );
  }

  // Instantiate and trigger connectedCallback
  const element = document.createElement(options.tagName);
  document.body.appendChild(element);

  // Wait for microtasks (connectedCallback may be async)
  await new Promise((resolve) => setTimeout(resolve, 0));

  // Serialize shadow DOM
  let html = '';
  if (element.shadowRoot) {
    html = element.shadowRoot.innerHTML;
  } else {
    html = element.innerHTML || `<${options.tagName}></${options.tagName}>`;
  }

  // Clean up
  document.body.removeChild(element);
  window.happyDOM.cancelAsync();

  return { html };
}

// ─── Build Report Integration ──────────────────────────────────────────

/**
 * Build the CEM compatibility report section for dsd-report.json.
 * Records DOM simulation attempts and their outcomes.
 */
export function buildDomSimulationReport(
  results: DomSimulationResult[],
): DsdBuildReport['domSimulation'] {
  if (!results || results.length === 0) return undefined;

  return {
    enabled: true,
    strategy: 'experimental-dom',
    attemptedCount: results.length,
    succeededCount: results.filter((r) => r.success).length,
    failedCount: results.filter((r) => !r.success).length,
    timeoutCount: results.filter((r) => r.timedOut).length,
    attempts: results.map((r) => ({
      tagName: r.tagName,
      success: r.success,
      renderTimeMs: r.renderTimeMs,
      byteSize: r.byteSize,
      error: r.error,
      timedOut: r.timedOut,
      fallback: r.fallback,
    })),
  };
}
