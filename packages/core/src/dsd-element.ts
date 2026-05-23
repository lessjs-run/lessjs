/**
 * @lessjs/core - DsdElement base class.
 *
 * Zero-dependency Custom Element base class providing:
 *   - Declarative Shadow DOM (DSD) detection at upgrade time
 *   - Client-Side Rendering (CSR) fallback when no DSD content exists
 *   - StyleSheet (SSR-safe CSSStyleSheet) via adoptedStyleSheets
 *   - Declarative event binding via html template @click / @keydown etc.
 *   - Signal-driven fine-grained DOM patching via data-b markers
 *   - AbortController cleanup on disconnect
 *   - formAssociated + delegatesFocus support
 *   - ReactiveHost protocol for explicit Signal integration
 *
 * DsdElement extends HTMLElement directly - ZERO Lit dependency.
 * Components return `render(): string | TemplateResult`.
 *
 * Lifecycle:
 *   SSR: instantiate -> set props -> render() -> wrap in DSD template
 *   Client (DSD): browser attaches shadow root from DSD -> upgrade -> bind template events
 *   Client (CSR): connectedCallback -> createRenderRoot -> render into shadowRoot
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
 * Usage (reactive DSD component):
 * ```ts
 * class MyToggle extends DsdElement {
 *   #active = signal(false);
 *   render() {
 *     return html`
 *       <button @click=${() => this.#active.value = !this.#active.value}>
 *         ${this.#active.value ? 'ON' : 'OFF'}
 *       </button>
 *     `;
 *   }
 * }
 * ```
 *
 * @module @lessjs/core/dsd-element
 */

import type { ReactiveHost } from './types.js';
import type { StyleSheetLike } from './style-sheet.js';
import {
  applyRuntimeTemplateBindings,
  collectTemplateSignals,
  isSignalLike,
  isTemplateResult,
  renderTemplateToString,
  type TemplateResult,
} from './template.js';

/**
 * Server-safe base class fallback when HTMLElement is unavailable
 * (Node.js / Deno server environments without DOM globals).
 *
 * In SSR/build contexts, DsdElement is only used for its render() output
 * method and static property access - the class is never instantiated as
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
 * Subclasses MUST override `render(): string | TemplateResult`.
 */
export class DsdElement extends _HTMLElement implements ReactiveHost {
  /** Component stylesheets (SSR-safe - StyleSheet delegates to native CSSStyleSheet in browser). */
  static styles?: StyleSheetLike | StyleSheetLike[];

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

  /** AbortController for html`...` runtime event listener cleanup */
  private _templateAbortController?: AbortController;

  /** Signal subscriptions collected from the latest TemplateResult */
  private _signalUnsubscribers: Array<() => void> = [];

  /** Microtask batching guard for signal-driven updates */
  private _reactiveUpdateQueued = false;

  /** Whether the first render has completed (used to switch from full replace to patch mode) */
  private _initialRenderDone = false;

  /** ElementInternals for form-associated custom elements */
  protected _internals?: ElementInternals;

  /**
   * Create or reuse the shadow root.
   *
   * DSD detection: if `this.shadowRoot` already exists and has nodes,
   * the browser pre-populated it from a <template shadowrootmode> tag.
   * In that case we mark `_dsdHydrated = true` and return the existing root.
   *
   * CSR fallback: if no shadow root exists, we call `attachShadow()`. If an
   * empty shadow root already exists, we reuse it and let connectedCallback()
   * populate it from render().
   *
   * @returns The existing or newly created ShadowRoot.
   */
  createRenderRoot(): ShadowRoot {
    // DSD pre-populated shadow root detection
    if (this.shadowRoot) {
      if (this.shadowRoot.childNodes.length > 0) {
        this._dsdHydrated = true;
      }
      this._applyStyles(this.constructor as typeof DsdElement, this.shadowRoot);
      return this.shadowRoot;
    }

    // CSR: create a new shadow root
    const ctor = this.constructor as typeof DsdElement;
    const delegatesFocus = ctor.delegatesFocus ?? false;
    const root = this.attachShadow({ mode: 'open', delegatesFocus });

    // Apply static styles via adoptedStyleSheets
    this._applyStyles(ctor, root);

    return root;
  }

  /**
   * Apply static styles to the shadow root via adoptedStyleSheets.
   * Shared between CSR (createRenderRoot) and DSD (connectedCallback) paths.
   */
  private _applyStyles(ctor: typeof DsdElement, root?: ShadowRoot): void {
    const target = root ?? this.shadowRoot;
    if (!target || !ctor.styles) return;
    const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
    if (sheets.length > 0) {
      // StyleSheet delegates to native CSSStyleSheet in browser
      // deno-lint-ignore no-explicit-any
      (target as any).adoptedStyleSheets = sheets;
    }
  }

  /**
   * Lifecycle: called when the element is connected to the DOM.
   *
   * DSD path (_dsdHydrated = true):
   *   - Calls _hydrateEvents() to bind declarative events on existing DOM.
   *
   * CSR path (_dsdHydrated = false):
   *   - Calls createRenderRoot() if no shadow root exists.
   *   - Populates shadowRoot.innerHTML with this.render(), then binds events.
   *
   * If formAssociated is true, ElementInternals are attached.
   */
  connectedCallback(): void {
    const ctor = this.constructor as typeof DsdElement;

    // Ensure shadow root exists
    if (!this.shadowRoot) {
      this.createRenderRoot();
    } else {
      // Existing roots with content are DSD upgrades. Empty roots are CSR-owned
      // and still need render() output.
      if (this.shadowRoot.childNodes.length > 0) {
        this._dsdHydrated = true;
      }

      // Apply adoptedStyleSheets on existing-root paths too.
      this._applyStyles(ctor);
    }

    // Sync data-theme from document root so all components inherit
    // the current dark/light mode without waiting for external propagation.
    const docTheme = document.documentElement?.dataset?.theme;
    if (docTheme && !this.hasAttribute('data-theme')) {
      this.setAttribute('data-theme', docTheme);
    }

    if (this._dsdHydrated) {
      // DSD path: bind events/signals against existing DOM without replacing it.
      this._bindCurrentRenderTemplate();
      // Mark initial render done so signal-driven updates use _patchBindings (fine-grained)
      // instead of _renderIntoShadowRoot (full innerHTML replacement).
      this._initialRenderDone = true;
    } else if (this.shadowRoot) {
      // CSR path: populate shadow DOM from render()
      this._renderIntoShadowRoot();
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
    this._disposeTemplateRuntime();
    this._disposeSignalSubscriptions();
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
    // Subclass override point - base implementation is intentionally empty.
  }

  /**
   * Re-render the shadow DOM from `render()` and re-bind declarative events.
   *
   * DsdElement intentionally does not include a reactive scheduler. Components
   * with local state can call this method after state changes instead of
   * duplicating `shadowRoot.innerHTML = this.render()` and event hydration.
   */
  update(): void {
    this._renderIntoShadowRoot();
  }

  /**
   * ReactiveController-compatible update hook.
   *
   * `@lessjs/rpc` calls this method when async state changes. Keeping this
   * tiny alias lets DsdElement host controllers without inheriting Lit or a
   * scheduler.
   */
  requestUpdate(): void {
    this.update();
  }

  /**
   * ReactiveHost: subscribe to a reactive source.
   *
   * The host receives a subscription callback from any Signal-like source.
   * On value change, `requestReactiveUpdate()` is called to schedule a
   * microtask-batched DOM patch.
   */
  subscribeTo(source: { subscribe(fn: (value: unknown) => void): () => void }): () => void {
    let initial = true;
    const unsubscribe = source.subscribe(() => {
      if (initial) {
        initial = false;
        return;
      }
      this.requestReactiveUpdate();
    });
    return unsubscribe;
  }

  /**
   * ReactiveHost: request a reactive update.
   *
   * Public entry point for external signal libraries. Batched via microtask.
   */
  requestReactiveUpdate(): void {
    this._scheduleReactiveUpdate();
  }

  private _renderIntoShadowRoot(): void {
    if (!this.shadowRoot) return;
    this._disposeTemplateRuntime();
    this._disposeSignalSubscriptions();

    const result = this.render();
    if (isTemplateResult(result)) {
      this.shadowRoot.innerHTML = renderTemplateToString(result, { runtimeMarkers: true });
      this._bindTemplateRuntime(result);
      this._subscribeTemplateSignals(result);
    } else {
      this.shadowRoot.innerHTML = result;
    }
  }

  /**
   * v0.21: Fine-grained DOM patching for reactive signal updates.
   *
   * Instead of replacing the entire shadowRoot.innerHTML, this method
   * queries for [data-less-b="N"] markers and patches only those nodes.
   * Events (@click) and properties (.value) use existing markers
   * (data-less-event-N / data-less-prop-N).
   *
   * Preserves focus, scroll, CSS transitions, and input state.
   */
  private _patchBindings(): void {
    if (!this.shadowRoot) return;
    try {
      this._disposeTemplateRuntime();
      this._disposeSignalSubscriptions();

      const result = this.render();
      if (!isTemplateResult(result)) return;

      // Re-bind event handlers and property bindings
      this._bindTemplateRuntime(result);
      this._subscribeTemplateSignals(result);

      // Patch signal text values using data-b markers
      const values = result.values;
      for (let i = 0; i < values.length; i++) {
        const value = values[i];
        if (!isSignalLike(value)) continue;
        const el = this.shadowRoot.querySelector(`[data-less-b="${i}"]`);
        if (!el) continue;
        const raw = (value as { value: unknown }).value;
        el.textContent = raw == null ? '' : String(raw);
      }
    } catch (err) {
      console.warn(
        `[DsdElement] _patchBindings failed for <${this.tagName.toLowerCase()}>:`,
        err,
      );
      // Leave last good DOM in place
    }
  }

  private _bindCurrentRenderTemplate(): void {
    this._disposeTemplateRuntime();
    this._disposeSignalSubscriptions();

    const result = this.render();
    if (!isTemplateResult(result) || !this.shadowRoot) return;
    this._bindTemplateRuntime(result);
    this._subscribeTemplateSignals(result);
  }

  private _bindTemplateRuntime(result: TemplateResult): void {
    if (!this.shadowRoot) return;
    this._templateAbortController = new AbortController();
    applyRuntimeTemplateBindings(
      this.shadowRoot,
      result,
      this,
      this._templateAbortController.signal,
    );
  }

  private _subscribeTemplateSignals(result: TemplateResult): void {
    for (const signal of collectTemplateSignals(result)) {
      // Use ReactiveHost.subscribeTo() protocol instead of Duck Typing
      const unsubscribe = this.subscribeTo(signal);
      this._signalUnsubscribers.push(unsubscribe);
    }
  }

  private _scheduleReactiveUpdate(): void {
    if (this._reactiveUpdateQueued) return;
    this._reactiveUpdateQueued = true;
    queueMicrotask(() => {
      this._reactiveUpdateQueued = false;
      if (!this.isConnected) return;
      // v0.21: initial render uses full innerHTML, subsequent updates use fine-grained patch
      if (this._initialRenderDone) {
        this._patchBindings();
      } else {
        this._renderIntoShadowRoot();
        this._initialRenderDone = true;
      }
    });
  }

  private _disposeTemplateRuntime(): void {
    if (this._templateAbortController) {
      this._templateAbortController.abort();
      this._templateAbortController = undefined;
    }
  }

  private _disposeSignalSubscriptions(): void {
    for (const unsubscribe of this._signalUnsubscribers.splice(0)) {
      unsubscribe();
    }
  }

  /**
   * Read locale from JS property (set by SSR injectProps) first,
   * then HTML attribute, then fallback to provided default.
   *
   * SSR injectProps() sets camelCase JS properties (e.g. this.locale = 'en')
   * but getAttribute() only reads HTML attributes, which remain null.
   * This method resolves the mismatch by checking JS property first.
   *
   * @param fallback - Default value when neither source has a value. Defaults to 'en'.
   */
  protected _getLocale(fallback = 'en'): string {
    const prop = (this as Record<string, unknown>).locale;
    if (typeof prop === 'string' && prop) return prop;
    return this.getAttribute('locale') || fallback;
  }

  /**
   * Return Shadow DOM inner HTML as a string or safe TemplateResult.
   *
   * Subclasses MUST override this method. During SSR, rendered content is
   * wrapped in a <template shadowrootmode="open"> tag. During CSR, strings are
   * assigned to `shadowRoot.innerHTML`; TemplateResult values also get runtime
   * event/property bindings and signal subscriptions.
   *
   * @returns HTML string or TemplateResult for the shadow DOM content.
   */
  render(): string | TemplateResult {
    return '';
  }
}
