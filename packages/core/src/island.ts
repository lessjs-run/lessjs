/**
 * @lessjs/core - island() wrapper
 *
 * v0.6.2: island() wraps any Custom Element class to provide:
 *   - Automatic registration via customElements.define()
 *   - Upgrade strategy support (eager, lazy, visible)
 *   - __island / __tagName / __layer metadata markers
 *   - data-ssr-props property binding on client upgrade (less:bind)
 *   - DSD opt-out via `dsd: false` (Pure Island / Layer 3)
 *
 * Framework-agnostic: works with Lit, vanilla Custom Elements,
 * FAST, or any Web Component library. lessBind() sets props
 * directly; adapters handle framework-specific update triggers.
 *
 * Usage:
 * ```ts
 * import { island } from '@lessjs/core';
 *
 * class MyCounter extends LitElement {
 *   static properties = { count: { type: Number } };
 *   declare count: number;
 *
 *   render() { return html`<button @click=${() => this.count++}>${this.count}</button>`; }
 * }
 *
 * // Register with eager strategy (DSD enabled by default)
 * export default island('my-counter', MyCounter, { strategy: 'eager' });
 *
 * // Pure Island — no DSD, full framework reactivity
 * export default island('my-counter', MyCounter, { strategy: 'eager', dsd: false });
 * ```
 *
 * Web Standards alignment:
 *   - Uses standard customElements.define() API
 *   - IntersectionObserver for visible strategy
 *   - requestIdleCallback for lazy strategy
 *   - Zero framework runtime — just native platform APIs
 *
 * @module @lessjs/core/island
 */

/** Island registration options */

import { createLogger } from './logger.js';
const log = createLogger('core');

export interface IslandOptions {
  /** Upgrade strategy:
   *   - 'eager': load immediately when module is imported
   *   - 'lazy':  defer to requestIdleCallback (default)
   *   - 'visible': use IntersectionObserver to defer until element is visible
   *   - 'idle': same as lazy (requestIdleCallback)
   */
  strategy?: 'eager' | 'lazy' | 'idle' | 'visible';

  /** Optional tag name override. If provided, used instead of the first argument. */
  tagName?: string;

  /**
   * Whether to use DSD for SSR rendering of this island.
   * - true (default): SSR emits <template shadowrootmode="open"> for no-flicker first paint.
   *   Component uses _dsdHydrated pattern; adapter handles event hydration.
   * - false: SSR emits just the tag (<my-island></my-island>).
   *   Framework fully owns the shadow root on client, getting full reactivity.
   *   This is Layer 3 (pure-island) in the three-layer model.
   * @default true
   */
  dsd?: boolean;
}

/**
 * Get the value of the data-ssr-props attribute from a host element.
 * Used by less:bind to reconstruct SSR props on client upgrade.
 *
 * @param el - The custom element host element
 * @returns Parsed props object, or null if no data-ssr-props attribute
 *
 * @example
 * ```ts
 * connectedCallback() {
 *   super.connectedCallback();
 *   const props = getSSRProps(this);
 *   if (props) {
 *     this.count = props.count ?? 0;
 *   }
 * }
 * ```
 */
export function getSSRProps(el: HTMLElement): Record<string, unknown> | null {
  const raw = el.getAttribute('data-ssr-props');
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    log.warn(`Failed to parse data-ssr-props on <${el.tagName.toLowerCase()}>`);
    return null;
  }
}

/**
 * Apply SSR props from data-ssr-props to a component instance.
 * This is less:bind — binds server-rendered property values to the
 * client-side component on upgrade, ensuring consistency between
 * SSR and client state.
 *
 * v0.6.2: Framework-agnostic. No Lit-specific detection.
 * Props are set directly on the instance. DSD hydration (event binding,
 * state sync) is handled at the component level via WithDsdHydration
 * Mixin and declarative hydrateEvents.
 *
 * @param el - The upgraded custom element
 */
export function lessBind(el: HTMLElement): void {
  const props = getSSRProps(el);
  if (!props) return;

  for (const [key, value] of Object.entries(props)) {
    try {
      (el as unknown as Record<string, unknown>)[key] = value;
    } catch (e) {
      // Some properties may be read-only — safe to skip, but log for debuggability
      log.debug(
        `Cannot set read-only property "${key}" on <${el.tagName.toLowerCase()}>: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }
  }
}

// ─── Strategy Implementations ───────────────────────────────────

/**
 * Create an IntersectionObserver-based upgrade strategy.
 * v0.6': Uses querySelectorAll to observe ALL instances of the tag,
 * not just the first one. Per WHATWG IntersectionObserver spec.
 */
function createVisibleStrategy(
  tagName: string,
  registerFn: () => void,
): void {
  let registered = false;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          if (!registered) {
            registered = true;
            registerFn();
          }
          return;
        }
      }
    },
    { rootMargin: '200px' }, // Start loading 200px before visible
  );

  // We need to wait for elements to be in the DOM first
  const observeAll = () => {
    const elements = document.querySelectorAll(tagName);
    if (elements.length > 0) {
      elements.forEach((el) => observer.observe(el));
      return true;
    }
    return false;
  };

  const mo = new MutationObserver((_mutations, mutObs) => {
    if (observeAll()) {
      mutObs.disconnect();
    }
  });

  // Start observing after DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (!observeAll()) {
        mo.observe(document.body, { childList: true, subtree: true });
      }
    });
  } else {
    if (!observeAll()) {
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }
}

/**
 * Create a lazy (requestIdleCallback-based) upgrade strategy.
 * v0.6': Improved fallback chain:
 *   1. requestIdleCallback (optimal, progressive)
 *   2. requestAnimationFrame (next frame, good for interaction)
 *   3. setTimeout(fn, 50) (final fallback, shorter than old 200ms)
 */
function createLazyStrategy(registerFn: () => void): void {
  const g = globalThis as unknown as {
    requestIdleCallback?: (fn: () => void) => void;
    requestAnimationFrame?: (fn: () => void) => number;
  };

  if (typeof g.requestIdleCallback === 'function') {
    g.requestIdleCallback(registerFn);
  } else if (typeof g.requestAnimationFrame === 'function') {
    g.requestAnimationFrame(() => registerFn());
  } else {
    setTimeout(registerFn, 50);
  }
}

// ─── Main island() wrapper ──────────────────────────────────────

/**
 * Wrap a component class as a LessJS Island.
 *
 * Handles:
 *   - Automatic customElements.define() registration
 *   - Strategy-based upgrade timing
 *   - data-ssr-props binding (less:bind)
 *   - __island / __tagName export markers
 *   - __layer metadata (dsd-static, dsd-interactive, or pure-island)
 *   - Idempotent registration (safe for SSR with multiple routes)
 *
 * v0.6.2: Added `dsd` option. When false, the island is a Pure Island
 * (Layer 3) — no DSD template is emitted, framework fully owns shadow root.
 *
 * @param tagName - Custom element tag name (must contain hyphen)
 * @param componentClass - Custom Element constructor (framework-agnostic)
 * @param options - Island options
 * @returns The component class (for chaining / re-export)
 *
 * @example
 * ```ts
 * // Basic usage (DSD enabled by default)
 * export default island('my-counter', MyCounter);
 *
 * // Pure Island — no DSD, full framework reactivity
 * export default island('my-counter', MyCounter, { dsd: false });
 *
 * // With visible strategy (IntersectionObserver)
 * export default island('my-counter', MyCounter, { strategy: 'visible' });
 *
 * // With eager strategy (immediate upgrade)
 * export default island('my-counter', MyCounter, { strategy: 'eager' });
 * ```
 */
export function island<T extends CustomElementConstructor>(
  tagName: string,
  componentClass: T,
  options: IslandOptions = {},
): T {
  const strategy = options.strategy || 'lazy';
  const useDsd = options.dsd !== false; // default true

  // Validate tag name
  if (!tagName || !tagName.includes('-')) {
    throw new Error(
      `[LessJS] island() requires a hyphenated tag name, got "${tagName}". ` +
        'Custom Element names must contain a hyphen per the HTML spec.',
    );
  }

  // Mark the class with metadata (used by island-transform plugin and SSR)
  (componentClass as unknown as Record<string, unknown>).__island = true;
  (componentClass as unknown as Record<string, unknown>).__tagName = tagName;
  // v0.6.2: Layer metadata — SSR pipeline uses this to decide DSD rendering
  (componentClass as unknown as Record<string, unknown>).__layer = useDsd
    ? 'dsd-interactive'
    : 'pure-island';

  // v0.6': Mixin pattern for connectedCallback — replaces monkey-patch.
  // Instead of modifying the prototype directly, we create a wrapper
  // that calls the original callback + auto-binds SSR props.
  // This is safer than monkey-patching because it doesn't interfere
  // with Lit's own connectedCallback chain.
  const origConnected = componentClass.prototype.connectedCallback;
  if (!componentClass.prototype.__lessIslandWrapped) {
    componentClass.prototype.__lessIslandWrapped = true;
    componentClass.prototype.connectedCallback = function (this: HTMLElement) {
      // Call original connectedCallback first (super.connectedCallback)
      if (typeof origConnected === 'function') {
        origConnected.call(this);
      }
      // Auto-bind SSR props on upgrade
      if (this.hasAttribute('data-ssr-props')) {
        Promise.resolve().then(() => lessBind(this));
      }
    } as unknown as typeof componentClass.prototype.connectedCallback;
  }

  // Define a registration function that's idempotent
  const register = () => {
    if (!globalThis.customElements.get(tagName)) {
      try {
        globalThis.customElements.define(tagName, componentClass);
      } catch (e) {
        // Already defined — safe to ignore in SSR contexts
        log.debug(
          `customElements.define("${tagName}") skipped: ${
            e instanceof Error ? e.message : String(e)
          }`,
        );
      }
    }
  };

  // Apply strategy
  switch (strategy) {
    case 'eager':
      register();
      break;

    case 'lazy':
    case 'idle':
      createLazyStrategy(register);
      break;

    case 'visible':
      createVisibleStrategy(tagName, register);
      break;

    default:
      createLazyStrategy(register);
      break;
  }

  return componentClass;
}

// ─── Convenience sub-exports ────────────────────────────────────

/**
 * Exports the `island` function as default for convenience imports.
 */
export default island;
