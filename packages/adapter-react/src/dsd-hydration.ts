/**
 * @lessjs/adapter-react - DsdReactElement wrapper
 *
 * Wraps a React component as a Web Component with DSD hydration support.
 * On SSR, the adapter renders the React tree to a string via
 * ReactDOMServer.renderToStaticMarkup(). On the client,
 * ReactDOM.createRoot() mounts the React tree into the shadow DOM.
 *
 * Usage:
 * ```ts
 * import { DsdReactElement } from '@lessjs/adapter-react';
 * import { createElement } from 'react';
 *
 * function MyComponent({ name }: { name: string }) {
 *   return createElement('div', null, `Hello ${name}`);
 * }
 *
 * class MyElement extends DsdReactElement {
 *   getReactElement() {
 *     return createElement(MyComponent, { name: 'World' });
 *   }
 * }
 *
 * customElements.define('my-element', MyElement);
 * ```
 *
 * @module @lessjs/adapter-react/dsd-hydration
 */

import type { HydrateEventDescriptor } from '@lessjs/core';

/** Constructor type for Mixin pattern */
// deno-lint-ignore no-explicit-any
type Constructor<T = HTMLElement> = new (...args: any[]) => T;

/**
 * Instance interface for DSD-hydrated React-wrapped components.
 */
export interface DsdHydration {
  /** Whether DSD has already hydrated this component's shadow root */
  _dsdHydrated: boolean;
  /** Bind declared events to existing shadow DOM elements after DSD upgrade */
  _hydrateEvents(): void;
  /** Return the React element to render */
  getReactElement(): unknown;
}

/**
 * Instance interface added by the WithDsdHydration mixin.
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
 * Mixin that adds DSD hydration support for React-wrapped Web Components.
 *
 * Components using this Mixin MUST:
 * - Implement `getReactElement()` to return the React element to render
 * - Optionally declare `static hydrateEvents` for DSD interactive behavior
 */
export function WithDsdHydration<T extends Constructor<HTMLElement>>(
  superClass: T,
): T & Constructor<DsdHydrationMixin> {
  class WithDsdHydrationClass extends superClass {
    static hydrateEvents?: HydrateEventDescriptor[];

    protected _dsdHydrated = false;

    private _hydrateAbortController?: AbortController;
    private _reactRoot: unknown = null;

    /**
     * Return the React element to render.
     * Override this in subclasses.
     */
    getReactElement(): unknown {
      return null;
    }

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
     * For non-DSD elements, mount the React tree via createRoot().
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
        this._mountReact();
      }
    }

    /**
     * Clean up on disconnect.
     */
    disconnectedCallback(): void {
      if (typeof superClass.prototype.disconnectedCallback === 'function') {
        superClass.prototype.disconnectedCallback.call(this);
      }
      if (this._hydrateAbortController) {
        this._hydrateAbortController.abort();
        this._hydrateAbortController = undefined;
      }
      this._unmountReact();
    }

    /**
     * Mount React tree into shadow DOM via createRoot().
     * Uses dynamic import for client-side React DOM.
     */
    private async _mountReact(): Promise<void> {
      try {
        const ReactDOM = await import('react-dom/client');
        const element = this.getReactElement();
        if (element && this.shadowRoot && typeof ReactDOM.createRoot === 'function') {
          this._reactRoot = ReactDOM.createRoot(this.shadowRoot);
          if (
            this._reactRoot &&
            typeof (this._reactRoot as Record<string, unknown>).render === 'function'
          ) {
            (this._reactRoot as { render: (el: unknown) => void }).render(element);
          }
        }
      } catch {
        // React DOM not available (e.g., SSR-only context)
      }
    }

    /**
     * Unmount React tree.
     */
    private _unmountReact(): void {
      if (this._reactRoot) {
        try {
          const unmount = (this._reactRoot as Record<string, unknown>).unmount;
          if (typeof unmount === 'function') {
            unmount();
          }
        } catch {
          // Ignore cleanup errors
        }
        this._reactRoot = null;
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

/**
 * Pre-composed DSD-hydrated React-wrapped HTMLElement base class.
 *
 * Lazily initialized to avoid ReferenceError in non-DOM environments.
 *
 * @example
 * ```ts
 * import { DsdReactElement } from '@lessjs/adapter-react';
 * import { createElement } from 'react';
 *
 * class MyElement extends DsdReactElement {
 *   getReactElement() {
 *     return createElement('div', null, 'Hello World');
 *   }
 * }
 * ```
 */
// deno-lint-ignore no-explicit-any
let _cached: (typeof HTMLElement) & (new (...args: any[]) => HTMLElement & DsdHydration) | null =
  null;

export const DsdReactElement:
  & typeof HTMLElement
  // deno-lint-ignore no-explicit-any
  & (new (...args: any[]) => HTMLElement & DsdHydration) = new Proxy(
    {} as
      & typeof HTMLElement
      & // deno-lint-ignore no-explicit-any
      (new (...args: any[]) => HTMLElement & DsdHydration),
    {
      get(_target, prop, receiver) {
        if (typeof globalThis.HTMLElement === 'undefined') {
          throw new ReferenceError(
            'DsdReactElement requires HTMLElement. ' +
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
