/**
 * @lessjs/adapter-lit - WithDsdHydration Mixin + DsdLitElement base class
 *
 * Mixin for Lit components that need DSD hydration (Layer 2).
 * Provides the common DSD detection, event binding, and cleanup pattern
 * shared by all DSD Interactive components.
 *
 * Usage (recommended - extend pre-composed base class):
 * ```ts
 * import { DsdLitElement } from '@lessjs/adapter-lit';
 *
 * class MyToggle extends DsdLitElement {
 *   static hydrateEvents = [
 *     { selector: 'button.toggle', event: 'click', method: '_handleToggle' },
 *   ];
 *
 *   override render() {
 *     if (this._dsdHydrated) return nothing;
 *     return html`<button class="toggle" @click=${this._handleToggle}>Toggle</button>`;
 *   }
 * }
 * ```
 *
 * Usage (advanced - Mixin with custom base class):
 * ```ts
 * import { WithDsdHydration } from '@lessjs/adapter-lit';
 *
 * class MyToggle extends WithDsdHydration(SomeOtherBase) { ... }
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
 *   - `render()` override (must check `_dsdHydrated` and return `nothing`)
 *
 * @module @lessjs/adapter-lit/dsd-hydration
 */

import { LitElement } from 'lit';
import { bindHydrateEvents } from '@lessjs/core';
import type { HydrateEventDescriptor } from '@lessjs/core';

/** Constructor type for Mixin pattern - `any[]` is standard TS Mixin signature */
// deno-lint-ignore no-explicit-any
type Constructor<T = LitElement> = new (...args: any[]) => T;

/**
 * Instance interface for DSD-hydrated Lit components.
 * Exposed so that consumers can type-check against the DSD hydration contract.
 */
export interface DsdHydration {
  /** Whether DSD has already hydrated this component's shadow root */
  _dsdHydrated: boolean;
  /** Bind declared events to existing shadow DOM elements after DSD upgrade */
  _hydrateEvents(): void;
}

/**
 * Instance interface added by the WithDsdHydration mixin beyond DsdHydration.
 * Captures the LitElement method overrides the mixin provides.
 * Required by JSR slow-types checker for explicit public API return types.
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
 * Mixin that adds DSD hydration support to a LitElement subclass.
 *
 * When the browser upgrades a DSD-pre-rendered element, this Mixin:
 * 1. Detects existing shadow DOM content (via createRenderRoot)
 * 2. Marks itself as _dsdHydrated so render() can return nothing
 * 3. Auto-binds events declared in `static hydrateEvents`
 * 4. Cleans up event listeners on disconnect via AbortController
 *
 * Components using this Mixin MUST:
 * - Declare `static hydrateEvents: HydrateEventDescriptor[]`
 * - Check `if (this._dsdHydrated) return nothing` at the top of render()
 */
export function WithDsdHydration<T extends Constructor<LitElement>>(
  superClass: T,
): T & Constructor<DsdHydrationMixin> {
  class WithDsdHydrationClass extends superClass {
    /**
     * Declarative event bindings for DSD hydration.
     * Override in subclasses to declare which DOM events to bind
     * after DSD upgrade. Each entry maps a CSS selector + event
     * type to a method name on the component.
     */
    static hydrateEvents?: HydrateEventDescriptor[];

    /**
     * Whether DSD has already hydrated this component's shadow root.
     * When true, render() should return nothing to avoid duplicate DOM.
     */
    protected _dsdHydrated = false;

    /** Abort controller for hydration event listener cleanup */
    private _hydrateAbortController?: AbortController;

    /**
     * Detect pre-populated shadow root from DSD.
     *
     * When DSD renders the component, the browser automatically creates
     * a shadow root and populates it with the template content BEFORE
     * customElements.define() upgrades the element. This method detects
     * that situation and returns the existing shadow root.
     */
    override createRenderRoot(): HTMLElement | DocumentFragment {
      if (this.shadowRoot && this.shadowRoot.childElementCount > 0) {
        this._dsdHydrated = true;
        return this.shadowRoot;
      }
      return this.attachShadow({ mode: 'open' });
    }

    /**
     * Auto-wire DSD hydration after the element is connected.
     *
     * If DSD has pre-populated the shadow root, bind all events
     * declared in `static hydrateEvents`.
     */
    override connectedCallback(): void {
      super.connectedCallback();

      if (this._dsdHydrated) {
        this._hydrateEvents();
      }
    }

    /**
     * Clean up hydration event listeners on disconnect.
     */
    override disconnectedCallback(): void {
      super.disconnectedCallback();
      if (this._hydrateAbortController) {
        this._hydrateAbortController.abort();
        this._hydrateAbortController = undefined;
      }
    }

    /**
     * Bind declared events to existing shadow DOM elements after DSD upgrade.
     *
     * Walks through `hydrateEvents` (from the class and its prototypes),
     * queries the shadow root for matching elements, and attaches
     * event listeners that delegate to the component's methods.
     *
     * Event listeners are bound with { signal } for automatic cleanup
     * when the component disconnects (via _hydrateAbortController).
     */
    protected _hydrateEvents(): void {
      if (!this.shadowRoot) return;

      // Collect hydrateEvents from the class hierarchy
      const ctor = this.constructor as typeof WithDsdHydrationClass & {
        hydrateEvents?: HydrateEventDescriptor[];
      };
      const events = ctor.hydrateEvents || [];
      if (events.length === 0) return;

      this._hydrateAbortController = new AbortController();
      const { signal } = this._hydrateAbortController;

      bindHydrateEvents(this.shadowRoot, this, events, signal);
    }
  }

  return WithDsdHydrationClass as unknown as T & Constructor<DsdHydrationMixin>;
}

/**
 * Pre-composed DSD-hydrated LitElement base class.
 *
 * Use this instead of `WithDsdHydration(LitElement)` in your component
 * `extends` clause. JSR's fast type checker requires extracted super
 * class expressions - this pre-composed class satisfies that requirement.
 *
 * @example
 * ```ts
 * import { DsdLitElement } from '@lessjs/adapter-lit';
 *
 * class MyToggle extends DsdLitElement {
 *   static hydrateEvents = [
 *     { selector: 'button', event: 'click', method: '_handleClick' },
 *   ];
 * }
 * ```
 */
export const DsdLitElement:
  & typeof LitElement
  // deno-lint-ignore no-explicit-any
  & (new (...args: any[]) => LitElement & DsdHydration) = WithDsdHydration(LitElement) as unknown as
    & typeof LitElement
    // deno-lint-ignore no-explicit-any
    & (new (...args: any[]) => LitElement & DsdHydration);
