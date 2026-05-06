/**
 * @lessjs/core - island() wrapper
 *
 * v0.6: island() wraps a LitElement component class to provide:
 *   - Automatic registration via customElements.define()
 *   - Upgrade strategy support (eager, lazy, visible)
 *   - __island / __tagName metadata markers
 *   - data-ssr-props property binding on client upgrade (less:bind)
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
 * // Register with eager strategy
 * export default island('my-counter', MyCounter, { strategy: 'eager' });
 *
 * // Or with visible strategy (IntersectionObserver-based)
 * export default island('my-counter', MyCounter, { strategy: 'visible' });
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
    console.warn(`[LessJS] Failed to parse data-ssr-props on <${el.tagName.toLowerCase()}>`);
    return null;
  }
}

/**
 * Apply SSR props from data-ssr-props to a component instance.
 * This is less:bind — binds server-rendered property values to the
 * client-side component on upgrade, ensuring consistency between
 * SSR and client state.
 *
 * @param el - The upgraded custom element
 */
export function lessBind(el: HTMLElement): void {
  const props = getSSRProps(el);
  if (!props) return;

  // Check if this is a LitElement (has requestUpdate)
  const litEl = el as unknown as Record<string, unknown>;
  const hasRequestUpdate = typeof litEl.requestUpdate === 'function';

  for (const [key, value] of Object.entries(props)) {
    try {
      (el as unknown as Record<string, unknown>)[key] = value;
    } catch {
      // Some properties may be read-only — ignore silently
    }
  }

  // If LitElement, trigger a batched update
  if (hasRequestUpdate) {
    try {
      (litEl.requestUpdate as () => void)();
    } catch {
      // Silent — not critical
    }
  }
}

// ─── Strategy Implementations ───────────────────────────────────

/**
 * Create an IntersectionObserver-based upgrade strategy.
 * The component is upgraded when its host element becomes visible.
 */
function createVisibleStrategy(
  tagName: string,
  registerFn: () => void,
): void {
  // Use a MutationObserver to detect when the element is added to DOM
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          observer.disconnect();
          registerFn();
          return;
        }
      }
    },
    { rootMargin: '200px' }, // Start loading 200px before visible
  );

  // We need to wait for the element to be in the DOM first
  // Use MutationObserver to detect when the element with this tag is added
  const mo = new MutationObserver((_mutations, mutObs) => {
    const el = document.querySelector(tagName);
    if (el) {
      observer.observe(el);
      mutObs.disconnect();
    }
  });

  // Start observing after DOM content loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const el = document.querySelector(tagName);
      if (el) {
        observer.observe(el);
      } else {
        mo.observe(document.body, { childList: true, subtree: true });
      }
    });
  } else {
    const el = document.querySelector(tagName);
    if (el) {
      observer.observe(el);
    } else {
      mo.observe(document.body, { childList: true, subtree: true });
    }
  }
}

/**
 * Create a lazy (requestIdleCallback-based) upgrade strategy.
 */
function createLazyStrategy(registerFn: () => void): void {
  const idleCallback = (globalThis as unknown as { requestIdleCallback?: (fn: () => void) => void }).requestIdleCallback;
  const schedule: (fn: () => void) => void = idleCallback || ((fn: () => void) => setTimeout(fn, 200));
  schedule(registerFn);
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
 *   - Idempotent registration (safe for SSR with multiple routes)
 *
 * @param tagName - Custom element tag name (must contain hyphen)
 * @param componentClass - LitElement (or Custom Element) constructor
 * @param options - Island options
 * @returns The component class (for chaining / re-export)
 *
 * @example
 * ```ts
 * // Basic usage
 * export default island('my-counter', MyCounter);
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

  // Validate tag name
  if (!tagName || !tagName.includes('-')) {
    throw new Error(
      `[LessJS] island() requires a hyphenated tag name, got "${tagName}". ` +
        'Custom Element names must contain a hyphen per the HTML spec.',
    );
  }

  // Mark the class with metadata (used by island-transform plugin)
  (componentClass as unknown as Record<string, unknown>).__island = true;
  (componentClass as unknown as Record<string, unknown>).__tagName = tagName;

  // v0.6: Auto-wrap connectedCallback to call less:bind on upgrade.
  // This ensures data-ssr-props are applied to the client component
  // so SSR-rendered state is preserved after custom element upgrade.
  const origConnected = componentClass.prototype.connectedCallback;
  componentClass.prototype.connectedCallback = function (this: HTMLElement) {
    // Call original connectedCallback first (super.connectedCallback)
    if (typeof origConnected === 'function') {
      origConnected.call(this);
    }
    // Auto-bind SSR props on upgrade
    // Use setTimeout to defer after Lit's first update cycle
    // to avoid race conditions with property initialization
    if (this.hasAttribute('data-ssr-props')) {
      Promise.resolve().then(() => lessBind(this));
    }
  } as unknown as typeof componentClass.prototype.connectedCallback;

  // Define a registration function that's idempotent
  const register = () => {
    if (!globalThis.customElements.get(tagName)) {
      try {
        globalThis.customElements.define(tagName, componentClass);
      } catch {
        // Already defined — safe to ignore in SSR contexts
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
