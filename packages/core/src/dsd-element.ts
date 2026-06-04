/**
 * @openelement/core - DsdElement base class.
 *
 * Zero-dependency Custom Element base class providing:
 *   - Declarative Shadow DOM (DSD) detection at upgrade time
 *   - Client-Side Rendering (CSR) fallback when no DSD content exists
 *   - StyleSheet (SSR-safe CSSStyleSheet) via adoptedStyleSheets
 *   - Declarative event binding via html template @click / @keydown etc.
 *   - Signal-driven fine-grained DOM patching via data-signal markers
 *   - AbortController cleanup on disconnect
 *   - formAssociated + delegatesFocus support
 *   - ReactiveHost protocol for explicit Signal integration
 *
 * DsdElement extends HTMLElement directly - ZERO Lit dependency.
 * Components return `render(): VNode | null`.
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
 *   render(): VNode {
 *     return <div class="card"><slot /></div>;
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
 *     return (
 *       <button onClick={() => this.#active.value = !this.#active.value}>
 *         {this.#active.value ? 'ON' : 'OFF'}
 *       </button>
 *     );
 *   }
 * }
 * ```
 *
 * @module @openelement/core/dsd-element
 */

import type { ReactiveHost } from './types.js';
import type { StyleSheetLike } from '@openelement/style-sheet';
import { disposeProps, handlePropAttributeChange, initializeProps } from './prop.js';
import {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  syncStaticPropsFromAttributes,
} from './prop.js';
import { isVNode, type VNode } from './vnode.js';
import { renderToDom } from './jsx-render-dom.js';
import { collectEventBindings, hydrateEventMarkers } from './event-hydration.js';
import { trustRenderHtml } from './security.js';
import { effect, type Signal, signal } from '@openelement/signals';

/**
 * SSR-safe base class for DsdElement.
 *
 * In browser: extends HTMLElement directly.
 * In SSR: assigns a minimal stub to globalThis.HTMLElement so the entire
 * dependency graph shares the same base class.
 */
const _Base = typeof HTMLElement !== 'undefined' ? HTMLElement : (class {
  hasAttribute(_name: string): boolean {
    return false;
  }
  getAttribute(_name: string): string | null {
    return null;
  }
  setAttribute(_name: string, _value: string): void {}
  removeAttribute(_name: string): void {}
  get tagName(): string {
    return '';
  }
  get isConnected(): boolean {
    return false;
  }
} as unknown as typeof HTMLElement);

// In SSR, assign globalThis.HTMLElement so other code can reference it
if (typeof HTMLElement === 'undefined') {
  (globalThis as Record<string, unknown>).HTMLElement = _Base;
}

/**
 * Zero-dependency Custom Element base class for DSD rendering.
 *
 * Provides DSD detection, CSR fallback, event hydration, and style management
 * without any framework dependency (no Lit, no reactive-element).
 *
 * Subclasses MUST override `render(): VNode | null`.
 */
export class DsdElement extends _Base implements ReactiveHost {
  /** Component stylesheets (SSR-safe - StyleSheet delegates to native CSSStyleSheet in browser). */
  static styles?: StyleSheetLike | StyleSheetLike[];

  /** v0.25.0: Page head metadata. SSG reads this to inject <title> and <meta> tags. */
  static head?: { title?: string; description?: string; ogImage?: string };

  /** @internal — use lessPipeline({ island: { upgradeStrategy } }) instead */
  static client?: { strategy?: 'load' | 'idle' | 'visible' | 'only' };

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
  /** v0.25.0 (SOP-012): Removed — detection now inline in _renderOrHydrate(). */

  /**
   * Effect dispose tracking (ADR-0065).
   * Replaces effectScope() — effects are created at top level
   * so they fire on signal changes. Disposed as a batch in
   * disconnectedCallback.
   */
  #effectDisposers: Set<() => void> = new Set();

  /** v0.28 (ADR-0067): Event listener cleanup tracking for _hydrateSignals(). */
  #eventCleanups: Array<() => void> = [];

  /** v0.28.1: Cached VNode from render() — avoids double-render mismatch between SSR and hydration. */
  #vnodeCache: unknown = undefined;
  #vnodeCacheValid = false;

  /**
   * Signal registry for attribute-based hydration (ADR-0065).
   * Maps signal names → signal objects. Built by registerSignal()
   * in component constructors, consumed during hydration.
   */
  private signalRegistry: Map<string, Signal<unknown>> = new Map();

  /**
   * Register a signal for hydration by name.
   * Call in constructor: this.registerSignal('count', this.#count);
   */
  protected registerSignal(name: string, sig: Signal<unknown>): void {
    this.signalRegistry.set(name, sig);
  }

  /** Reactive route parameters Signal. Updates automatically on SPA navigation. */
  #params = signal<Record<string, string>>({});

  /** Reactive route parameters. Updates automatically on SPA navigation. */
  get params(): Record<string, string> {
    return this.#params.value;
  }

  set params(value: Record<string, string>) {
    this.#params.value = { ...value };
  }

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
      // type-escape: adoptedStyleSheets may not be in the configured DOM lib
      (target as unknown as { adoptedStyleSheets: typeof sheets }).adoptedStyleSheets = sheets;
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
   *   - Renders this.render() through the VNode DOM renderer.
   *
   * If formAssociated is true, ElementInternals are attached.
   */
  connectedCallback(): void {
    const ctor = this.constructor as typeof DsdElement;

    // v0.24 (ADR-0052): Initialize @prop() signals and accessors
    initializeProps(this);

    // v0.24.1 (ADR-0057): Initialize static props signals and accessors
    initializeStaticProps(this);
    syncStaticPropsFromAttributes(this);

    // Ensure shadow root exists and detect DSD pre-population
    if (!this.shadowRoot) {
      this.createRenderRoot();
    } else {
      // DSD path: shadow root already populated.
      this.style.display = 'block';
      this._applyStyles(ctor);
    }

    // Sync data-theme from document root
    const docTheme = document.documentElement?.dataset?.theme;
    if (docTheme && !this.hasAttribute('data-theme')) {
      this.setAttribute('data-theme', docTheme);
    }

    // TG-01: Read route params from attribute if present.
    // (SSR/SSG injects params as JS property via injectProps — setter handles it)
    const attrParams = this.getAttribute('params');
    if (attrParams) {
      try {
        this.#params.value = JSON.parse(attrParams);
      } catch { /* ignore malformed JSON */ }
    }

    // v0.25.0 (SOP-012): Unified render path — DSD and CSR both go through
    // _renderOrHydrate(). The _dsdHydrated flag and _bindCurrentRenderTemplate()
    // are removed. DSD pre-populated DOM is preserved; only events and signal
    // subscriptions are added.
    this._renderOrHydrate();

    // Attach ElementInternals for form-associated custom elements
    if (ctor.formAssociated && typeof this.attachInternals === 'function') {
      this._internals = this.attachInternals();
    }
  }

  /**
   * v0.25.0 (SOP-012): Unified render path.
   */
  private _renderOrHydrate(): void {
    try {
      const isDsd = this.shadowRoot && this.shadowRoot.childNodes.length > 0;
      if (isDsd) {
        // DSD: DOM already correct — bind events via VNode walk
        this._hydrateExistingDom();
        this.onDsdHydrated();
      } else if (this.shadowRoot) {
        // CSR: full render from VNode
        this._renderIntoShadowRoot();
        this.onCsrRendered();
      }
    } catch (err) {
      this._renderErrorFallback(err);
    }
  }

  /**
   * v0.28 (ADR-0067): Signal-native hydration.
   *
   * Replaces _walkAndBind() — reads data-signal markers
   * from DSD shadow root and creates direct signal→DOM effect bindings.
   * No position matching, no childNodes filtering, no VNode traversal.
   *
   * Effects are tracked in #effectDisposers for batch cleanup.
   * VNode event marker listeners are tracked in #eventCleanups.
   */
  private _hydrateSignals(): void {
    if (!this.shadowRoot) return;

    // --- Signal → textContent: data-signal="signalName" ---
    const signalEls = this.shadowRoot.querySelectorAll('[data-signal]');
    for (const el of signalEls) {
      const name = el.getAttribute('data-signal');
      if (!name) continue;
      const sig = this.signalRegistry.get(name);
      if (!sig) continue;

      // Skip textContent if this element has attr/html/class binding
      if (
        el.hasAttribute('data-signal-attr') ||
        el.hasAttribute('data-signal-html') ||
        el.hasAttribute('data-signal-class')
      ) continue;

      (el as HTMLElement).textContent = String(sig.value);
      const dispose = effect(() => {
        (el as HTMLElement).textContent = String(sig.value);
      });
      this.#effectDisposers.add(dispose);
    }

    // --- Signal → CSS class: data-signal-class="className" (v0.28.1) ---
    // Toggles a CSS class based on signal truthiness.
    // Truthy (non-empty string / non-zero) → add class. Falsy → remove.
    const classSigEls = this.shadowRoot.querySelectorAll('[data-signal][data-signal-class]');
    for (const el of classSigEls) {
      const name = el.getAttribute('data-signal');
      const className = el.getAttribute('data-signal-class');
      if (!name || !className) continue;
      const sig = this.signalRegistry.get(name);
      if (!sig) continue;

      el.classList.toggle(className, !!sig.value);
      const dispose = effect(() => {
        el.classList.toggle(className, !!sig.value);
      });
      this.#effectDisposers.add(dispose);
    }

    // --- Signal → innerHTML: data-signal-html="signalName" (v0.28) ---
    const htmlEls = this.shadowRoot.querySelectorAll('[data-signal-html]');
    for (const el of htmlEls) {
      const name = el.getAttribute('data-signal-html');
      if (!name) continue;
      const sig = this.signalRegistry.get(name);
      if (!sig) continue;

      const applyHtml = () => {
        (el as HTMLElement).innerHTML = trustRenderHtml(String(sig.value));
      };
      applyHtml();
      const dispose = effect(() => applyHtml());
      this.#effectDisposers.add(dispose);
    }

    // --- Signal → attribute: data-signal-attr="attr1,attr2" (v0.28) ---
    const attrSigEls = this.shadowRoot.querySelectorAll('[data-signal][data-signal-attr]');
    for (const el of attrSigEls) {
      const name = el.getAttribute('data-signal');
      const attrSpec = el.getAttribute('data-signal-attr');
      if (!name || !attrSpec) continue;
      const sig = this.signalRegistry.get(name);
      if (!sig) continue;

      const attrNames = attrSpec.split(',').map((a) => a.trim()).filter(Boolean);
      if (attrNames.length === 0) continue;

      const val = String(sig.value);
      for (const an of attrNames) {
        el.setAttribute(an, val);
      }

      const dispose = effect(() => {
        const v = String(sig.value);
        for (const an of attrNames) {
          el.setAttribute(an, v);
        }
      });
      this.#effectDisposers.add(dispose);
    }

    // --- Signal → VNode rendering: data-signal-render="signalName" (v0.30.1 / ADR-0081) ---
    // Signal value is VNode | VNode[] — renderToDom handles event binding + XSS escape.
    const renderEls = this.shadowRoot.querySelectorAll('[data-signal-render]');
    for (const el of renderEls) {
      const name = el.getAttribute('data-signal-render');
      if (!name) continue;
      const sig = this.signalRegistry.get(name);
      if (!sig) continue;

      const renderTarget = () => {
        while (el.firstChild) el.removeChild(el.firstChild);
        const v = sig.value;
        if (v != null) {
          const nodes = Array.isArray(v) ? v : [v];
          for (const node of nodes) {
            el.appendChild(renderToDom(node, undefined, this.#effectDisposers));
          }
        }
      };
      renderTarget();
      this.#effectDisposers.add(effect(() => renderTarget()));
    }

    // v0.28.1: Cache VNode so SSR and hydration use the same event IDs.
    // render() may have been called at build time for SSR — reuse cached VNode
    // if available, otherwise call render() once and cache for hydration.
    if (!this.#vnodeCacheValid) {
      this.#vnodeCache = this.render();
      this.#vnodeCacheValid = true;
    }
    const vnode = this.#vnodeCache;
    if (isVNode(vnode)) {
      hydrateEventMarkers(this.shadowRoot, collectEventBindings(vnode), this.#eventCleanups, this);
    }
    // Chromium DSD layout fix: force reflow without DOM rebuild
    requestAnimationFrame(() => {
      void (this as HTMLElement).offsetHeight;
    });
  }

  /**
   * Hydrate DSD DOM with signal and event bindings.
   *
   * v0.28 (ADR-0067): Delegates to _hydrateSignals().
   * _walkAndBind position matching is DELETED.
   */
  private _hydrateExistingDom(): void {
    if (!this.shadowRoot) return;

    // Dispose previous effects and events
    for (const d of this.#effectDisposers) d();
    this.#effectDisposers.clear();
    for (const f of this.#eventCleanups) f();
    this.#eventCleanups = [];

    this._hydrateSignals();
  }

  /**
   * v0.23.0: Hook called after DSD hydration completes.
   *
   * Subclasses override this instead of relying on fragile
   * `super.connectedCallback()` call order. At this point the
   * shadow DOM is populated from DSD and declarative events
   * (@click, @keydown) are bound.
   *
   * No-op by default.
   */
  protected onDsdHydrated(): void {}

  /**
   * v0.23.0: Hook called after CSR first render completes.
   *
   * Subclasses override this for post-render initialization
   * that depends on the shadow DOM being populated. At this
   * point render() has been called and declarative events
   * are bound.
   *
   * No-op by default.
   */
  protected onCsrRendered(): void {}

  /**
   * Hook called when the unified client render/hydrate path throws.
   * Subclasses may return a VNode fallback.
   */
  protected onRenderError(error: unknown): VNode | null {
    console.error(
      `[DsdElement] <${this.tagName.toLowerCase()}> render/hydrate failed:`,
      error instanceof Error ? error.message : String(error),
    );
    return null;
  }

  private _renderErrorFallback(error: unknown): void {
    if (!this.shadowRoot) this.createRenderRoot();
    if (!this.shadowRoot) return;

    let fallback: VNode | null;
    try {
      fallback = this.onRenderError(error);
    } catch (fallbackError) {
      console.error(
        `[DsdElement] <${this.tagName.toLowerCase()}> onRenderError failed:`,
        fallbackError instanceof Error ? fallbackError.message : String(fallbackError),
      );
      fallback = null;
    }

    for (const d of this.#effectDisposers) d();
    this.#effectDisposers.clear();
    for (const f of this.#eventCleanups) f();
    this.#eventCleanups = [];

    if (fallback != null) {
      while (this.shadowRoot.firstChild) {
        this.shadowRoot.removeChild(this.shadowRoot.firstChild);
      }
      this.shadowRoot.appendChild(renderToDom(fallback, undefined, this.#effectDisposers));
    }
  }

  /**
   * Lifecycle: called when the element is disconnected from the DOM.
   * Aborts all hydration event listeners for cleanup.
   */
  disconnectedCallback(): void {
    for (const d of this.#effectDisposers) d();
    this.#effectDisposers.clear();
    for (const f of this.#eventCleanups) f();
    this.#eventCleanups = [];
    disposeProps(this);
    disposeStaticProps(this);
  }

  // v0.28 (ADR-0067): Effect + event lifecycle managed by Set/Array.
  // _walkAndBind DELETED — replaced by _hydrateSignals().

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
    // v0.24 (ADR-0052): Route to @prop() handler
    handlePropAttributeChange(this, _name, _oldValue, _newValue);
    // v0.24.1 (ADR-0057): Route to static props handler
    handleStaticPropAttributeChange(
      this,
      _name,
      _oldValue,
      _newValue,
    );
    // Subclass override point - base implementation is intentionally empty.
  }

  /**
   * Re-render the shadow DOM from `render()` and re-bind declarative events.
   *
   * DsdElement intentionally does not include a reactive scheduler. Components
   * with local state can call this method after state changes instead of
   * duplicating renderToDom() and event hydration.
   */
  update(): void {
    this._renderIntoShadowRoot();
  }

  /**
   * ReactiveController-compatible update hook.
   *
   * `@openelement/rpc` calls this method when async state changes. Keeping this
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
   * Public entry point for signal-driven updates. Re-renders using
   * the VNode path.
   */
  requestReactiveUpdate(): void {
    if (!this.isConnected) return;
    this._renderIntoShadowRoot();
  }

  private _renderIntoShadowRoot(): void {
    if (!this.shadowRoot) return;

    // Dispose previous effects
    for (const d of this.#effectDisposers) d();
    this.#effectDisposers.clear();

    const result = this.render();
    this.#vnodeCache = result;
    this.#vnodeCacheValid = true;
    if (result != null) {
      while (this.shadowRoot!.firstChild) {
        this.shadowRoot!.removeChild(this.shadowRoot!.firstChild);
      }
      this.shadowRoot!.appendChild(renderToDom(result, undefined, this.#effectDisposers));
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
   * Return Shadow DOM content as a VNode.
   *
   * Subclasses MUST override this method. During SSR, rendered content is
   * wrapped in a <template shadowrootmode="open"> tag. During CSR, VNode values
   * are rendered via renderToDom() with event binding and signal tracking.
   *
   * @returns VNode for the shadow DOM content, or null for empty content.
   */
  render(): VNode | null {
    return null;
  }
}
