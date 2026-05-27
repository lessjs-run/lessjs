# ADR-0053: Unified Error Handling Architecture

- Status: ACCEPTED (Implemented v0.24.0)
- Date: 2026-05-27
- Applies to: v0.24.0+

## Context

The deep evaluation report (2026-05-27) identified multiple error handling gaps:

1. **No error boundaries.** When a component's `render()` throws, the SSR
   pipeline catches it and falls back to a bare tag (`<tag-name></tag-name>`),
   but there is no unified error collection, no error boundary concept for
   client-side rendering, and no way for parent components to handle child
   render failures gracefully.

2. **SPA navigation has no error recovery.** Any network error during
   client-side navigation triggers a full page refresh. There is no retry
   logic, no error page rendering, and no user-friendly fallback.

3. **Two disconnected error systems.** `LessError`/`SsrRenderError` (in
   `errors.ts`) handles framework-level errors (HTTP 500, SSR failures), while
   `RenderError` interface (in `types.ts`) handles render-pipeline errors. These
   two systems don't compose — a render failure that propagates to a framework
   boundary loses the structured `RenderError` metadata.

4. **Build-time errors lack severity levels.** Build pipeline errors are thrown
   as raw `Error` objects without structured codes, phases, or recovery hints.

5. **No error telemetry hook.** There is no way for application code to observe
   or collect errors across the framework — critical for production monitoring.

Current error flow (simplified):

```
render() throws Error
    ↓
renderDSD() catch → bare tag + RenderError in output.errors[]
    ↓
ssgRender() ignores errors[] (no aggregation)
    ↓
User sees degraded page, no error report
```

## Decision

**LessJS adopts a unified error architecture with four layers: error types,
error boundaries, error propagation pipeline, and error telemetry.**

### Layer 1: Unified Error Types

All framework errors extend a common base with structured metadata:

```ts
// packages/core/src/errors.ts (redesigned)

/** Error severity levels */
export type ErrorSeverity = 'fatal' | 'error' | 'warning' | 'info';

/** Base error for all LessJS errors — runtime and build */
export class LessError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly severity: ErrorSeverity = 'error',
    public readonly phase?: 'render' | 'hydrate' | 'build' | 'route' | 'unknown',
    public readonly tagName?: string,
    public readonly recoverable: boolean = false,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'LessError';
  }

  /** Human-readable summary for CLI/log output */
  summarize(): string {
    const location = this.tagName ? ` [${this.tagName}]` : '';
    const phaseLabel = this.phase ? ` (${this.phase})` : '';
    return `[${this.code}]${location}${phaseLabel}: ${this.message}`;
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      severity: this.severity,
      phase: this.phase,
      tagName: this.tagName,
      recoverable: this.recoverable,
      message: this.message,
      details: this.details,
    };
  }
}

// Specialized subclasses
export class RenderError extends LessError {
  constructor(tagName: string, cause: Error) {
    super(
      `Render failed: ${tagName}`,
      'RENDER_FAILURE',
      'error',
      'render',
      tagName,
      true, // recoverable — fall back to bare tag
      { causeMessage: cause.message, causeName: cause.name },
    );
  }
}

export class HydrateError extends LessError {
  constructor(tagName: string, eventName: string, cause: Error) {
    super(
      `Hydration failed: ${tagName}.${eventName}`,
      'HYDRATE_FAILURE',
      'warning',
      'hydrate',
      tagName,
      true, // recoverable — skip event binding
      { eventName, causeMessage: cause.message },
    );
  }
}

export class RouteError extends LessError {
  constructor(path: string, cause?: Error) {
    super(
      `Route navigation failed: ${path}`,
      'ROUTE_FAILURE',
      'error',
      'route',
      undefined,
      true, // recoverable — retry or show error page
      { path, causeMessage: cause?.message },
    );
  }
}

export class BuildError extends LessError {
  constructor(phase: string, cause: Error) {
    super(
      `Build phase ${phase} failed`,
      'BUILD_FAILURE',
      'fatal',
      'build',
      undefined,
      false,
      { buildPhase: phase, causeMessage: cause.message },
    );
  }
}
```

### Layer 2: Error Boundaries

DsdElement gains an `onError()` lifecycle hook and error boundary
propagation:

```ts
class DsdElement extends HTMLElement {
  /** Called when this component or a descendant fails to render */
  protected onError(error: RenderError): void {
    // Default: log and render fallback
    console.error(`[${error.tagName}] ${error.message}`);
    this._renderFallback(error);
  }

  /** Render a fallback UI for this component */
  private _renderFallback(error: RenderError): void {
    // In dev mode: show error details
    // In production: show nothing (bare tag) or user-provided fallback
    if (this._devMode) {
      this.shadowRoot!.innerHTML = `<div class="less-error" role="alert">
        <code>${escapeHtml(error.code)}</code>: ${escapeHtml(error.message)}
      </div>`;
    }
  }

  /** Is this component an error boundary? */
  static isErrorBoundary = false;
}
```

Components declare themselves as error boundaries:

```ts
class LessCard extends DsdElement {
  static isErrorBoundary = true;

  protected override onError(error: RenderError): void {
    // Custom fallback UI
    this.shadowRoot!.innerHTML = `<slot>Content unavailable</slot>`;
  }
}
```

Error boundary semantics:

- A component with `isErrorBoundary = true` catches render errors from its
  subtree (children rendered via `renderNestedCustomElements`)
- If no boundary exists, the error propagates to the root `renderDSD()` call
  which falls back to a bare tag
- Client-side: an error in a DSD-hydrated component's `render()` (during
  signal-triggered re-render) is caught by the nearest boundary

### Layer 3: Error Propagation Pipeline

The SSR pipeline aggregates errors into structured output:

```ts
interface RenderOutput {
  html: string;
  errors: RenderError[]; // all errors from this render tree
  metrics: RenderMetrics;
  hydrationHints: HydrationHint[];
}

// Error aggregation at each nesting level:
async function renderNestedCustomElements(
  html: string,
  registry: ComponentRegistry,
  depth: number,
  errors: RenderError[], // NEW: shared error accumulator
): Promise<string> {
  // ... traverse AST, render each CE
  for (const ce of customElements) {
    try {
      const result = await renderDSD(ce.tagName, ce.attrs);
      errors.push(...result.errors); // collect child errors
    } catch (e) {
      errors.push(new RenderError(ce.tagName, e as Error));
      // Continue rendering siblings — one failure doesn't kill the page
    }
  }
}
```

Build pipeline integration:

```ts
// ssg-render.ts
const { html, errors } = await ssgRender(app, routes);
if (errors.length > 0) {
  const fatal = errors.filter((e) => e.severity === 'fatal');
  const recoverable = errors.filter((e) => e.recoverable);
  log.warn(`${recoverable.length} recoverable errors during SSG`);
  log.error(`${fatal.length} fatal errors during SSG`);
  // Write error report for CI
  await writeFile('dist/ssg-errors.json', JSON.stringify(errors));
  if (fatal.length > 0) process.exit(1);
}
```

### Layer 4: Error Telemetry

`LessjsOptions` gains an error telemetry hook:

```ts
interface FrameworkOptions {
  // ...
  onError?: (error: LessError) => void;
}
```

Users can plug in any error monitoring service:

```ts
lessjs({
  onError: (error) => {
    // Send to Sentry, Datadog, custom logging, etc.
    if (error.severity === 'fatal' || error.severity === 'error') {
      sentry.captureException(error);
    }
  },
});
```

### SPA Navigation Error Recovery

`less-layout`'s SPA navigation gains structured error handling:

```ts
// less-layout.ts — current: full page refresh on error
// After: retry + error page

async navigateTo(url: string): Promise<void> {
  try {
    const html = await this._fetchPage(url);
    this._swapContent(html);
  } catch (e) {
    const error = new RouteError(url, e as Error);
    this._onError?.(error);  // telemetry hook

    // Retry once (only for network errors, not 4xx)
    if (this._shouldRetry(e as Error)) {
      try {
        const html = await this._fetchPage(url);
        this._swapContent(html);
        return;
      } catch (_) { /* fall through to error page */ }
    }

    // Show error page in main content area
    this._renderErrorPage(error);
  }
}
```

## Consequences

### Positive

- Single error type hierarchy replaces two disconnected systems
- Error boundaries enable graceful degradation (one broken component doesn't break the page)
- Structured error codes enable CI gating (e.g., "> 0 RENDER_FAILURE → block deploy")
- `onError` telemetry hook plugs into any monitoring infrastructure
- SPA navigation is resilient to network errors (retry + fallback)
- Build errors carry phase/component/recovery information

### Negative

- `RenderOutput` grows with mandatory `errors[]` field (negligible overhead)
- Error boundary propagation adds overhead to nested rendering (minimal: one try/catch per nesting level)
- `isErrorBoundary` static flag is a new concept users must learn
- SPA retry logic introduces latency (~1 extra fetch on failure)

### Neutral

- Existing `LessError`/`SsrRenderError` classes are replaced, not extended
  (v0.23.0 explicitly declares no backward compatibility guarantees)
- `RenderError` interface in `types.ts` continues to exist for render-pipeline
  use; the new `RenderError` class wraps it

## Retrospective: Mistakes This Fixes

The 2026-05-27 audit found 5 empty `catch {}` blocks. All 5 were symptoms of
"there's no standard way to report errors." With this ADR:

- Every catch produces a structured `LessError` subclass
- The error flows to the `onError` telemetry hook
- The component renders a defined fallback (bare tag or `onError()` override)

## Related

- ADR-0035: SSG Resilient Rendering (bare-tag fallback precedent)
- ADR-0051: Self-built `html` Template System Strengthening
- ADR-0052: Signal-DOM Deep Integration
- `packages/core/src/errors.ts`: Current error classes (38 lines)
- `packages/core/src/render-errors.ts`: Render error classification (153 lines)
- `packages/core/src/types.ts`: `RenderError` interface (lines 651-664)
