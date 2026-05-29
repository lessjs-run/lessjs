/**
 * @lessjs/core - DsdElement base class.
 *
 * Zero-dependency Custom Element base class providing:
 *   - Declarative Shadow DOM (DSD) detection at upgrade time
 *   - Client-Side Rendering (CSR) fallback when no DSD content exists
 *   - StyleSheet (SSR-safe CSSStyleSheet) via adoptedStyleSheets
 *   - Declarative event binding via html template @click / @keydown etc.
 *   - Signal-driven fine-grained DOM patching via data-less-b markers
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
import type { StyleSheetLike } from '@lessjs/style-sheet';
import { disposeProps, handlePropAttributeChange, initializeProps } from './prop.js';
import {
  disposeStaticProps,
  handleStaticPropAttributeChange,
  initializeStaticProps,
  syncStaticPropsFromAttributes,
} from './prop.js';
import { isVNode, type VNode } from './vnode.js';
<<<<<<< HEAD
import { renderToDom } from './jsx-render-dom.js';
=======
import { applyProps, renderToDom } from './jsx-render-dom.js';
>>>>>>> dev
import { renderToString } from './jsx-render-string.js';
import { effect } from '@lessjs/signals';

/**
 * Minimal SSR-safe HTMLElement stub for server environments (SOP-016).
 *
 * Provides only the methods actually used by @lessjs/core internals
 * and LessJS UI components during SSR render().
 *
 * When HTMLElement is unavailable on globalThis, this stub is assigned
 * to globalThis.HTMLElement so the entire dependency graph — including
 * client-only island stubs that write `extends HTMLElement` — shares
 * the same base class.
 *
 * Subclasses MUST NOT rely on this stub's methods for real DOM
 * behaviour. SSR rendering uses happy-dom for full DOM simulation.
 */
const _SsrHTMLElementStub = class {
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
};

const _HTMLElement: typeof HTMLElement = typeof HTMLElement !== 'undefined'
  ? HTMLElement
  : ((globalThis as Record<string, unknown>).HTMLElement =
    _SsrHTMLElementStub as unknown as typeof HTMLElement);

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

  /** v0.25.0: Page head metadata. SSG reads this to inject <title> and <meta> tags. */
  static head?: { title?: string; description?: string; ogImage?: string };

  /** v0.25.0: Client island strategy declaration. @deprecated in favor of lessPipeline(). */
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

  /** AbortController for VNode render event listener lifecycle */
  private _templateAbortController?: AbortController;

  /** Signal subscriptions from TemplateResult / VNode effects */
  private _signalUnsubscribers: Array<() => void> = [];

  /** v0.24.3: Effect dispose for VNode signal subscriptions. */
  private _vnodeEffectDispose?: () => void;

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
   *   - Populates shadowRoot.innerHTML with this.render(), then binds events.
   *
   * If formAssociated is true, ElementInternals are attached.
   */
  connectedCallback(): void {
    const ctor = this.constructor as typeof DsdElement;

    // v0.24 (ADR-0052): Initialize @prop() signals and accessors
    initializeProps(this);

    // v0.24.1 (ADR-0057): Initialize static props signals and accessors
    initializeStaticProps(this as unknown as Record<string, unknown>);
    syncStaticPropsFromAttributes(this as unknown as Record<string, unknown>);

    // Ensure shadow root exists and detect DSD pre-population
    if (!this.shadowRoot) {
      this.createRenderRoot();
    } else {
      this._applyStyles(ctor);
    }

    // Sync data-theme from document root
    const docTheme = document.documentElement?.dataset?.theme;
    if (docTheme && !this.hasAttribute('data-theme')) {
      this.setAttribute('data-theme', docTheme);
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
   *
   * DSD path (shadow DOM pre-populated): preserve existing DOM,
   * bind events via VNode tree walk, set up effect() signal tracking.
   *
   * CSR path (empty shadow DOM): full render from VNode.
   *
   * The _dsdHydrated flag and _bindCurrentRenderTemplate() are removed.
   */
  private _renderOrHydrate(): void {
    const isDsd = this.shadowRoot && this.shadowRoot.childNodes.length > 0;
    if (isDsd) {
      // DSD: DOM already correct — bind events and set up signal tracking
      this._hyrateExistingDom();
      this.onDsdHydrated();
    } else if (this.shadowRoot) {
      // CSR: full render from VNode
      this._renderIntoShadowRoot();
      this.onCsrRendered();
    }
  }

  /**
   * v0.25.0 (SOP-012): Hydrate DSD-pre-populated shadow DOM.
   *
   * Walks the existing shadow DOM tree and matches VNode structure to
   * wire event listeners (onClick etc.) without re-creating any elements.
   * Also sets up effect() signal tracking for reactive updates.
   */
  private _hyrateExistingDom(): void {
    if (!this.shadowRoot) return;

    const result = this.render();
    if (!isVNode(result)) return;

    // Walk shadow DOM and VNode tree in parallel, binding events
    this._walkAndBind(this.shadowRoot, result);

    // Set up effect() for signal-driven re-render (same as CSR path)
    this._vnodeEffectDispose = effect(() => {
      const updated = this.render();
      if (!isVNode(updated)) return;
      if (this._templateAbortController) {
        this._templateAbortController.abort();
      }
      this._templateAbortController = new AbortController();
      while (this.shadowRoot!.firstChild) {
        this.shadowRoot!.removeChild(this.shadowRoot!.firstChild);
      }
      this.shadowRoot!.appendChild(
        renderToDom(updated, this._templateAbortController.signal),
      );
    });
  }

  /**
   * Walk shadow DOM elements and VNode tree in parallel, binding events.
   */
  private _walkAndBind(
    parent: Element | ShadowRoot,
    vnode: {
      // deno-lint-ignore ban-types
      tag?: string | symbol | Function;
      props?: Record<string, unknown>;
      children?: unknown[];
    },
  ): void {
    const vChildren = vnode
      .children as (string | { tag?: string; props?: Record<string, unknown> })[];
    if (!vChildren) return;

    const domChildren = Array.from(parent.children);
    for (let i = 0; i < Math.min(domChildren.length, vChildren.length); i++) {
      const domChild = domChildren[i];
      const vChild = vChildren[i];
      if (typeof vChild === 'object' && vChild !== null && 'props' in vChild) {
        applyProps(domChild, vChild.props as Record<string, unknown>);
        this._walkAndBind(
          domChild,
          vChild as { tag?: string; props?: Record<string, unknown>; children?: unknown[] },
        );
      }
    }
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
   * Lifecycle: called when the element is disconnected from the DOM.
   * Aborts all hydration event listeners for cleanup.
   */
  disconnectedCallback(): void {
    this._disposeTemplateRuntime();
    this._disposeSignalSubscriptions();
    // v0.24 (ADR-0052): Clean up @prop() signal subscriptions
    disposeProps(this);
    // v0.24.1 (ADR-0057): Clean up static props signal subscriptions
    disposeStaticProps(this as unknown as Record<string, unknown>);
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
    // v0.24 (ADR-0052): Route to @prop() handler
    handlePropAttributeChange(this, _name, _oldValue, _newValue);
    // v0.24.1 (ADR-0057): Route to static props handler
    handleStaticPropAttributeChange(
      this as unknown as Record<string, unknown>,
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
   * Public entry point for signal-driven updates. Re-renders using
   * the VNode path with effect() signal tracking.
   */
  requestReactiveUpdate(): void {
    if (!this.isConnected) return;
    this._renderIntoShadowRoot();
  }

  private _renderIntoShadowRoot(): void {
    if (!this.shadowRoot) return;
    this._disposeTemplateRuntime();
    this._disposeSignalSubscriptions();

    const result = this.render();
    if (isVNode(result)) {
      // Clear existing DOM
      while (this.shadowRoot.firstChild) {
        this.shadowRoot.removeChild(this.shadowRoot.firstChild);
      }
      // v0.24.1: Use renderToDom so event handlers (onClick etc.) are wired via addEventListener
      this._templateAbortController = new AbortController();
      const dom = renderToDom(result, this._templateAbortController.signal);
      this.shadowRoot.appendChild(dom);
      // v0.24.3: Set up reactive signal tracking via effect().
      // Unlike TemplateResult's fine-grained patch, VNodes use full re-render
      // driven by alien-signals effect. The effect tracks all signal accesses
      // during render() and re-executes when any dependency changes.
      this._vnodeEffectDispose = effect(() => {
        const updated = this.render();
        if (!isVNode(updated)) return;
        // DOM update (without creating new effect)
        if (this._templateAbortController) {
          this._templateAbortController.abort();
        }
        this._templateAbortController = new AbortController();
        while (this.shadowRoot!.firstChild) {
          this.shadowRoot!.removeChild(this.shadowRoot!.firstChild);
        }
        this.shadowRoot!.appendChild(
          renderToDom(updated, this._templateAbortController.signal),
        );
      });
    } else if (typeof result === 'string') {
      this.shadowRoot.innerHTML = result;
    } else {
      // Defensive: render() returned an unexpected type (e.g. plain object from
      // mis-configured JSX transform). Log a helpful warning instead of silently
      // rendering "[object Object]".
      console.warn(
        `[DsdElement] <${this.tagName.toLowerCase()}>.render() returned unexpected type "${typeof result}". ` +
          `Expected string or VNode. ` +
          `If using JSX, ensure your build tool is configured with jsx: "automatic" and jsxImportSource: "@lessjs/core".`,
      );
      this.shadowRoot.innerHTML = '';
    }
  }

<<<<<<< HEAD
  private _bindCurrentRenderTemplate(): void {
    this._disposeTemplateRuntime();
    this._disposeSignalSubscriptions();

    const result = this.render();
    if (!this.shadowRoot) return;
    if (isVNode(result)) {
      // v0.24.1: DSD hydration for VNode — re-render to DOM with event handlers
      // The pre-populated DSD DOM has correct structure but no event listeners.
      // renderToDom wires onClick etc. via addEventListener on the same DOM structure.
      this._templateAbortController = new AbortController();
      while (this.shadowRoot.firstChild) {
        this.shadowRoot.removeChild(this.shadowRoot.firstChild);
      }
      const dom = renderToDom(result, this._templateAbortController.signal);
      this.shadowRoot.appendChild(dom);
      return;
    }
    // string fallback: nothing to hydrate
  }
=======
  // v0.25.0 (SOP-012): Removed _bindCurrentRenderTemplate().
  // DSD hydration now handled by _hyrateExistingDom() which walks
  // the pre-populated DOM, binds events via applyProps, and sets
  // up effect() signal tracking — without clearing/re-creating DOM.
>>>>>>> dev

  private _disposeTemplateRuntime(): void {
    if (this._templateAbortController) {
      this._templateAbortController.abort();
      this._templateAbortController = undefined;
    }
  }

  private _disposeSignalSubscriptions(): void {
    // v0.24.3: Dispose VNode effect tracking
    if (this._vnodeEffectDispose) {
      this._vnodeEffectDispose();
      this._vnodeEffectDispose = undefined;
    }
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
   * Return Shadow DOM inner HTML as a string or VNode.
   *
   * Subclasses MUST override this method. During SSR, rendered content is
   * wrapped in a <template shadowrootmode="open"> tag. During CSR, strings are
   * assigned to `shadowRoot.innerHTML`; VNode values are rendered via
   * renderToDom() with event binding and signal tracking.
   *
   * @returns HTML string or VNode for the shadow DOM content.
   */
  render(): string | VNode {
    return '';
  }

  /**
   * Resolve the output of render() to a plain HTML string.
   * Handles string and VNode return types uniformly.
   */
  protected _resolveRenderOutput(result: string | VNode): string {
    if (typeof result === 'string') return result;
    if (isVNode(result)) return renderToString(result);
    return String(result);
  }
}
