/**
 * @lessjs/adapter-vanilla - WithDsdHydration Mixin + DsdVanillaElement base class
 *
 * Mixin for vanilla Web Components that need DSD hydration (Layer 2).
 * Provides the common DSD detection, event binding, and cleanup pattern
 * shared by all DSD Interactive vanilla components.
 *
 * Usage (recommended — extend pre-composed base class):
 * ```ts
 * import { DsdVanillaElement } from '@lessjs/adapter-vanilla';
 *
 * class MyToggle extends DsdVanillaElement {
 *   static hydrateEvents = [
 *     { selector: 'button.toggle', event: 'click', method: '_handleToggle' },
 *   ];
 *
 *   render(): string {
 *     if (this._dsdHydrated) return '';
 *     return '<button class="toggle">Toggle</button>';
 *   }
 * }
 * ```
 *
 * Usage (advanced — Mixin with custom base class):
 * ```ts
 * import { WithDsdHydration } from '@lessjs/adapter-vanilla';
 *
 * class MyToggle extends WithDsdHydration(HTMLElement) { ... }
 * ```
 *
 * What the Mixin provides:
 *   - `_dsdHydrated` flag (detects pre-populated shadow root from DSD)
 *   - `createRenderRoot()` override (reuses existing shadow root)
 *   - `_hydrateEvents()` (binds events from `static hydrateEvents`)
 *   - `connectedCallback()` auto-calls `_hydrateEvents()` when DSD-hydrated
 *   - `disconnectedCallback()` cleanup (aborts hydration listeners)
 *
 * What the component must provide:
 *   - `static hydrateEvents: HydrateEventDescriptor[]` (declarative event bindings)
 *   - `render()` override (must check `_dsdHydrated` and return empty string)
 *
 * @module @lessjs/adapter-vanilla/dsd-hydration
 */

import type { HydrateEventDescriptor } from '@lessjs/core';

/** Constructor type for Mixin pattern */
// deno-lint-ignore no-explicit-any
type Constructor<T = HTMLElement> = new (...args: any[]) => T;

/**
 * Instance interface for DSD-hydrated vanilla components.
 */
export interface DsdHydration {
  /** Whether DSD has already hydrated this component's shadow root */
  _dsdHydrated: boolean;
  /** Bind declared events to existing shadow DOM elements after DSD upgrade */
  _hydrateEvents(): void;
}

/**
 * Instance interface added by the WithDsdHydration mixin beyond DsdHydration.
 */
export interface DsdHydrationMixin extends DsdHydration {
  /** Override: reuses existing shadow root when DSD-pre-populated */
  createRenderRoot(): HTMLElement | DocumentFragment;
  /** Override: auto-wires DSD hydration events on connect */
  connectedCallback(): void;
  /** Override: cleans up hydration listeners on disconnect */
  disconnectedCallback(): void;
}

/**
 * Mixin that adds DSD hydration support to an HTMLElement subclass.
 *
 * When the browser upgrades a DSD-pre-rendered element, this Mixin:
 * 1. Detects existing shadow DOM content (via createRenderRoot)
 * 2. Marks itself as _dsdHydrated so render() can return empty string
 * 3. Auto-binds events declared in `static hydrateEvents`
 * 4. Cleans up event listeners on disconnect via AbortController
 */
export function WithDsdHydration<T extends Constructor<HTMLElement>>(
  superClass: T,
): T & Constructor<DsdHydrationMixin> {
  class WithDsdHydrationClass extends superClass {
    /**
     * Declarative event bindings for DSD hydration.
     * Override in subclasses to declare which DOM events to bind
     * after DSD upgrade.
     */
    static hydrateEvents?: HydrateEventDescriptor[];

    /**
     * Whether DSD has already hydrated this component's shadow root.
     * When true, render() should return empty string to avoid duplicate DOM.
     */
    protected _dsdHydrated = false;

    /** Abort controller for hydration event listener cleanup */
    private _hydrateAbortController?: AbortController;

    /**
     * Detect pre-populated shadow root from DSD.
     */
    createRenderRoot(): HTMLElement | DocumentFragment {
      if (this.shadowRoot && this.shadowRoot.childElementCount > 0) {
        this._dsdHydrated = true;
        return this.shadowRoot;
      }
      return this.attachShadow({ mode: 'open' });
    }

    /**
     * Auto-wire DSD hydration after the element is connected.
     *
     * When DSD content exists (_dsdHydrated = true): bind events.
     * When no DSD content (_dsdHydrated = false, e.g. ssr: false):
     * call render() to populate the shadow root on first paint.
     */
    connectedCallback(): void {
      // Call the actual parent class (captured in mixin closure),
      // NOT Object.getPrototypeOf which can find our own method → infinite recursion.
      if (typeof superClass.prototype.connectedCallback === 'function') {
        superClass.prototype.connectedCallback.call(this);
      }
      if (this._dsdHydrated) {
        this._hydrateEvents();
      } else if (this.shadowRoot) {
        // Client-side render fallback for ssr:false islands.
        // The subclass provides render(): string; we call it here because
        // the vanilla adapter, unlike Lit, has no built-in lifecycle that
        // auto-invokes render().
        const renderFn = (this as Record<string, unknown>).render;
        if (typeof renderFn === 'function') {
          const html = renderFn.call(this);
          this.shadowRoot.innerHTML = String(html);
        }
      }
    }

    /**
     * Clean up hydration event listeners on disconnect.
     */
    disconnectedCallback(): void {
      if (typeof superClass.prototype.disconnectedCallback === 'function') {
        superClass.prototype.disconnectedCallback.call(this);
      }
      if (this._hydrateAbortController) {
        this._hydrateAbortController.abort();
        this._hydrateAbortController = undefined;
      }
    }

    /**
     * Bind declared events to existing shadow DOM elements after DSD upgrade.
     */
    protected _hydrateEvents(): void {
      if (!this.shadowRoot) return;

      const ctor = this.constructor as typeof WithDsdHydrationClass & {
        hydrateEvents?: HydrateEventDescriptor[];
      };
      const events = ctor.hydrateEvents || [];
      if (events.length === 0) return;

      this._hydrateAbortController = new AbortController();
      const { signal } = this._hydrateAbortController;

      for (const desc of events) {
        if (desc.method.startsWith('__')) continue;
        const elements = this.shadowRoot.querySelectorAll(desc.selector);
        for (const el of elements) {
          const handler = (this as unknown as Record<string, unknown>)[desc.method];
          if (typeof handler === 'function') {
            el.addEventListener(desc.event, (handler as EventListener).bind(this), { signal });
          }
        }
      }
    }
  }

  return WithDsdHydrationClass as unknown as T & Constructor<DsdHydrationMixin>;
}

// ─── Lazy DsdVanillaElement ───────────────────────────────────
// HTMLElement is only available in DOM environments (browser, Deno with DOM).
// We use a getter-based lazy pattern to avoid ReferenceError in pure
// Deno test environments that don't have HTMLElement in globalThis.

// deno-lint-ignore no-explicit-any
let _cached: (typeof HTMLElement) & (new (...args: any[]) => HTMLElement & DsdHydration) | null =
  null;

/**
 * Pre-composed DSD-hydrated HTMLElement base class.
 *
 * Use this instead of `WithDsdHydration(HTMLElement)` in your component
 * `extends` clause.
 *
 * Lazily initialized — only calls `WithDsdHydration(HTMLElement)` once
 * on first access, so it won't crash in non-DOM test environments.
 *
 * @example
 * ```ts
 * import { DsdVanillaElement } from '@lessjs/adapter-vanilla';
 *
 * class MyToggle extends DsdVanillaElement {
 *   static hydrateEvents = [
 *     { selector: 'button', event: 'click', method: '_handleClick' },
 *   ];
 * }
 * ```
 */
export const DsdVanillaElement:
  & typeof HTMLElement
  // deno-lint-ignore no-explicit-any
  & (new (...args: any[]) => HTMLElement & DsdHydration) = new Proxy(
    {} as
      & typeof HTMLElement
      // deno-lint-ignore no-explicit-any
      & (new (...args: any[]) => HTMLElement & DsdHydration),
    {
      get(_target, prop, receiver) {
        if (typeof globalThis.HTMLElement === 'undefined') {
          throw new ReferenceError(
            'DsdVanillaElement requires HTMLElement. ' +
              'Use WithDsdHydration() directly in non-DOM environments.',
          );
        }
        if (!_cached) {
          _cached = WithDsdHydration(globalThis.HTMLElement) as unknown as
            & typeof HTMLElement
            // deno-lint-ignore no-explicit-any
            & (new (...args: any[]) => HTMLElement & DsdHydration);
        }
        return Reflect.get(_cached, prop, receiver);
      },
    },
  );
