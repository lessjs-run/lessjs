/**
 * @lessjs/core - DsdElement base class.
 *
 * Zero-dependency Custom Element base class providing:
 *   - Declarative Shadow DOM (DSD) detection at upgrade time
 *   - Client-Side Rendering (CSR) fallback when no DSD content exists
 *   - StyleSheet (SSR-safe CSSStyleSheet) via adoptedStyleSheets
 *   - Declarative event hydration via static hydrateEvents
 *   - AbortController cleanup on disconnect
 *   - formAssociated + delegatesFocus support
 *
 * DsdElement extends HTMLElement directly â€” ZERO Lit dependency.
 * Components return `render(): string` (plain HTML), not TemplateResult.
 *
 * Lifecycle:
 *   SSR: instantiate â†’ set props â†’ render() â†’ wrap in DSD template
 *   Client (DSD): browser attaches shadow root from DSD â†’ upgrade â†’ _hydrateEvents()
 *   Client (CSR): connectedCallback â†’ createRenderRoot â†’ shadowRoot.innerHTML = render()
 *
 * Usage (static DSD component):
 * ```ts
 * class MyCard extends DsdElement {
 *   static styles = myStyleSheet;
 *   render(): string {
 *     return `<div class="card"><slot></slot></div>`;
 *   }
 * }
 * customElements.define('my-card', MyCard);
 * ```
 *
 * Usage (DSD interactive component):
 * ```ts
 * class MyToggle extends DsdElement {
 *   static hydrateEvents = [
 *     { selector: 'button', event: 'click', method: '_handleToggle' },
 *   ];
 *   _handleToggle(e: Event) { ... }
 *   render(): string {
 *     return `<button>Toggle</button>`;
 *   }
 * }
 * ```
 *
 * @module @lessjs/core/dsd-element
 */

import type { HydrateEventDescriptor } from './types.js';
import type { StyleSheetLike } from './style-sheet.js';

/**
 * Server-safe base class fallback when HTMLElement is unavailable
 * (Node.js / Deno server environments without DOM globals).
 *
 * In SSR/build contexts, DsdElement is only used for its render(): string
 * method and static property access â€” the class is never instantiated as
 * a live Custom Element. This stub ensures the class declaration itself
 * does not throw at module evaluation time.
 */
const _HTMLElement: typeof HTMLElement = typeof HTMLElement !== 'undefined'
  ? HTMLElement
  : (class {} as unknown as typeof HTMLElement);

/**
 * Zero-dependency Custom Element base class for DSD rendering.
 *
 * Provides DSD detection, CSR fallback, event hydration, and style management
 * without any framework dependency (no Lit, no reactive-element).
 *
 * Subclasses MUST override `render(): string`.
 */
export class DsdElement extends _HTMLElement {
  /** Component stylesheets (SSR-safe â€” StyleSheet delegates to native CSSStyleSheet in browser). */
  static styles?: StyleSheetLike | StyleSheetLike[];

  /**
   * Declarative event bindings for DSD hydration.
   * Each entry maps a CSS selector + DOM event to a method on the instance.
   */
  static hydrateEvents?: HydrateEventDescriptor[];

  /**
   * Attributes that trigger attributeChangedCallback.
   * Subclasses override this to declare reactive attributes.
   */
  static observedAttributes?: string[];

  /**
   * Whether to delegate focus within the shadow root.
   * When true, attachShadow is called with `delegatesFocus: true`.
   */
  static delegatesFocus?: boolean;

  /**
   * Whether this element participates in form submission.
   * When true, ElementInternals are attached in connectedCallback.
   */
  static formAssociated?: boolean;

  /**
   * Whether DSD has already populated this component's shadow root.
   * When true, render() does not need to produce DOM content on the client;
   * only event hydration (if any) is performed.
   */
  protected _dsdHydrated = false;

  /** AbortController for hydration event listener cleanup */
  private _hydrateAbortController?: AbortController;

  /** ElementInternals for form-associated custom elements */
  protected _internals?: ElementInternals;

  /**
   * Create or reuse the shadow root.
   *
   * DSD detection: if `this.shadowRoot` already exists and has children,
   * the browser pre-populated it from a <template shadowrootmode> tag.
   * In that case we mark `_dsdHydrated = true` and return the existing root.
   *
   * CSR fallback: if no shadow root exists or it is empty, we call
   * `attachShadow()` and apply `static styles` via `adoptedStyleSheets`.
   *
   * @returns The existing or newly created ShadowRoot.
   */
  createRenderRoot(): ShadowRoot {
    // DSD pre-populated shadow root detection
    if (this.shadowRoot && this.shadowRoot.childElementCount > 0) {
      this._dsdHydrated = true;
      return this.shadowRoot;
    }

    // CSR: create a new shadow root
    const ctor = this.constructor as typeof DsdElement;
    const delegatesFocus = ctor.delegatesFocus ?? false;
    const root = this.attachShadow({ mode: 'open', delegatesFocus });

    // Apply static styles via adoptedStyleSheets
    if (ctor.styles) {
      const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
      if (sheets.length > 0) {
        // StyleSheet delegates to native CSSStyleSheet in browser
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (root as any).adoptedStyleSheets = sheets;
      }
    }

    return root;
  }

  /**
   * Lifecycle: called when the element is connected to the DOM.
   *
   * DSD path (_dsdHydrated = true):
   *   - Calls _hydrateEvents() to bind declarative events on existing DOM.
   *
   * CSR path (_dsdHydrated = false):
   *   - Calls createRenderRoot() if no shadow root exists.
   *   - Populates shadowRoot.innerHTML with this.render().
   *
   * If formAssociated is true, ElementInternals are attached.
   */
  connectedCallback(): void {
    const ctor = this.constructor as typeof DsdElement;

    // Ensure shadow root exists
    if (!this.shadowRoot) {
      this.createRenderRoot();
    } else if (this.shadowRoot.childElementCount > 0 && !this._dsdHydrated) {
      // DSD pre-populated — shadow root created by browser from <template>,
      // createRenderRoot() was skipped but we still need to mark as hydrated
      this._dsdHydrated = true;
    }

    if (this._dsdHydrated) {
      // DSD path: only bind events â€” DOM is already present
      this._hydrateEvents();
    } else if (this.shadowRoot) {
      // CSR path: populate shadow DOM from render()
      this.shadowRoot.innerHTML = this.render();
    }

    // Attach ElementInternals for form-associated custom elements
    if (ctor.formAssociated && typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /**
   * Lifecycle: called when the element is disconnected from the DOM.
   * Aborts all hydration event listeners for cleanup.
   */
  disconnectedCallback(): void {
    if (this._hydrateAbortController) {
      this._hydrateAbortController.abort();
      this._hydrateAbortController = undefined;
    }
  }

  /**
   * Lifecycle: called when an observed attribute changes.
   *
   * Base implementation is a no-op. Subclasses override this to react
   * to attribute changes, typically by calling `this.render()` to update
   * the shadow DOM.
   *
   * @param name - Attribute name (lowercase).
   * @param oldValue - Previous value, or null if the attribute was not set.
   * @param newValue - New value, or null if the attribute was removed.
   */
  attributeChangedCallback(
    _name: string,
    _oldValue: string | null,
    _newValue: string | null,
  ): void {
    // Subclass override point â€” base implementation is intentionally empty.
  }

  /**
   * Bind declared events to existing shadow DOM elements after DSD upgrade.
   *
   * Iterates `static hydrateEvents` from the constructor, queries the shadow
   * root for matching elements, and attaches event listeners that delegate to
   * the component's methods. Each listener is bound with an AbortSignal for
   * automatic cleanup on disconnect.
   *
   * M-17 guard: methods starting with `__` are skipped to prevent prototype
   * pollution attacks via hydration descriptors.
   */
  protected _hydrateEvents(): void {
    if (!this.shadowRoot) return;

    const ctor = this.constructor as typeof DsdElement & {
      hydrateEvents?: HydrateEventDescriptor[];
    };
    const events = ctor.hydrateEvents || [];
    if (events.length === 0) return;

    this._hydrateAbortController = new AbortController();
    const { signal } = this._hydrateAbortController;

    for (const desc of events) {
      // M-17 guard: skip methods starting with __
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

  /**
   * Return Shadow DOM inner HTML as a string.
   *
   * Subclasses MUST override this method. During SSR, this string is
   * wrapped in a <template shadowrootmode="open"> tag. During CSR,
   * it is assigned to `shadowRoot.innerHTML`.
   *
   * @returns HTML string for the shadow DOM content.
   */
  render(): string {
    return '';
  }
}
