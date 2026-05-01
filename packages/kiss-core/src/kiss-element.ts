/**
 * @kissjs/core - KissElement
 *
 * Zero-runtime Custom Element base class.
 * Web Standards first — no Lit dependency, just HTMLElement + Proxy + Signal.
 *
 * Design:
 * - Reactive state via Signal (encapsulated, user writes this.state.x = y)
 * - API properties via observedAttributes + getter/setter
 * - Controller system (compatible with @kissjs/rpc RpcController)
 * - render() returns HTML string → innerHTML update
 * - No hydration — DSD SSR provides initial DOM, CE upgrade activates it
 *
 * @example
 * ```typescript
 * import { KissElement, html, state } from '@kissjs/core'
 *
 * export class MyCounter extends KissElement {
 *   onInit() {
 *     this.state.count = 0
 *     this.root.querySelector('.inc')
 *       ?.addEventListener('click', () => this.state.count++)
 *   }
 *
 *   styles() {
 *     return `:host{display:block} button{cursor:pointer}`
 *   }
 *
 *   render(): string {
 *     return `<button class="inc">+</button> <span>${this.state.count}</span>`
 *   }
 * }
 * customElements.define('my-counter', MyCounter)
 * ```
 *
 * @module @kissjs/core
 */

import { signal, computed, effect, type Signal } from '@preact/signals-core';

// ─── Reactive Controller Interface ──────────────────────────────
// Structural type — compatible with both Lit ReactiveController and kiss-rpc.
// Any object with these methods works at runtime.

export interface ReactiveController {
  hostConnected?(): void;
  hostDisconnected?(): void;
  hostUpdate?(): void;
  hostUpdated?(): void;
}

export interface ReactiveControllerHost {
  addController(ctrl: ReactiveController): void;
  removeController(ctrl: ReactiveController): void;
  requestUpdate(): void;
  readonly updateComplete: Promise<boolean>;
}

// ─── State Proxy ────────────────────────────────────────────────

/**
 * Create a reactive state object.
 * Uses Signal internally, exposes via Proxy for natural assignment.
 * When a property is set, the corresponding Signal updates,
 * which triggers any subscribed effects (including re-render).
 */
function createState(host: KissElement): Record<string, unknown> {
  const signals = new Map<string, Signal.State<unknown>>();

  return new Proxy({} as Record<string, unknown>, {
    get(_target, key: string) {
      return signals.get(key)?.value;
    },

    set(_target, key: string, value: unknown) {
      let sig = signals.get(key);
      if (!sig) {
        sig = signal(value);
        signals.set(key, sig);
        // Subscribe first-access effect auto-magically
        effect(() => {
          sig!.value; // track dependency
          host.requestUpdate();
        });
      } else {
        sig.value = value;
      }
      return true;
    },

    has(_target, key: string) {
      return signals.has(key);
    },

    ownKeys() {
      return Array.from(signals.keys());
    },

    getOwnPropertyDescriptor(_target, key: string) {
      if (signals.has(key)) {
        return { enumerable: true, configurable: true, value: signals.get(key)?.value };
      }
    },
  });
}

// ─── KissElement Base Class ─────────────────────────────────────

export abstract class KissElement extends HTMLElement implements ReactiveControllerHost {
  /** Reactive state — assign to trigger re-render */
  readonly state: Record<string, unknown>;

  /** Shadow DOM root — created by DSD during HTML parsing, or manually */
  protected root!: ShadowRoot;

  /** Registered reactive controllers */
  readonly #controllers = new Set<ReactiveController>();

  /** Update scheduling */
  #updateQueued = false;
  #updatePromiseResolve: (() => void) | null = null;
  #updateCompletePromise: Promise<boolean> = Promise.resolve(true);

  constructor() {
    super();
    // Initialize reactive state with Signal-backed Proxy
    this.state = createState(this);

    // Root: if DSD already created shadowRoot (during HTML parse), use it.
    // Otherwise create one manually (e.g. when element is created via document.createElement).
    // We can't reliably access shadowRoot in constructor (depends on DSD parse timing),
    // so we do it in connectedCallback.
  }

  // ─── Lifecycle ────────────────────────────────────────────────

  connectedCallback(): void {
    // Initialize Shadow DOM root
    if (!this.shadowRoot) {
      this.root = this.attachShadow({ mode: 'open' });
      // Initial render for JS-created elements (no DSD)
      this.#performUpdate(true);
    } else {
      this.root = this.shadowRoot;
    }

    // Notify controllers
    for (const ctrl of this.#controllers) {
      ctrl.hostConnected?.();
    }

    // Initialize (subclass hook — replaces constructor logic for CE-safe init)
    this.onInit?.();

    // Apply styles
    const css = this.styles?.();
    if (css && this.root) {
      try {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(css);
        this.root.adoptedStyleSheets = [sheet];
      } catch {
        // Fallback: inject <style> tag if CSSStyleSheet is not available
        const styleEl = document.createElement('style');
        styleEl.textContent = css;
        this.root?.appendChild(styleEl);
      }
    }
  }

  disconnectedCallback(): void {
    for (const ctrl of this.#controllers) {
      ctrl.hostDisconnected?.();
    }
  }

  /**
   * Initialize the component.
   * Called after connectedCallback and Shadow DOM setup.
   * Safe place to add event listeners (DOM is ready).
   */
  onInit?(): void;

  // ─── Styling ──────────────────────────────────────────────────

  /**
   * Return component CSS as a string.
   * Applied via Constructable Stylesheets (CSSStyleSheet + adoptedStyleSheets).
   * Called once during connectedCallback.
   *
   * @example
   * ```ts
   * styles() {
   *   return `:host { display: block; }
   *           button { cursor: pointer; }`
   * }
   * ```
   */
  styles?(): string;

  // ─── Rendering ────────────────────────────────────────────────

  /**
   * Render component to HTML string.
   * Called during SSR (in Node.js/Deno) and during client updates.
   * Must be a pure function of state — no side effects.
   *
   * @returns HTML string for Shadow DOM content
   *
   * @example
   * ```ts
   * render(): string {
   *   return `<button>${this.state.label}</button>`
   * }
   * ```
   */
  abstract render(): string | unknown;

  // ─── ReactiveControllerHost Interface ─────────────────────────

  addController(ctrl: ReactiveController): void {
    this.#controllers.add(ctrl);
  }

  removeController(ctrl: ReactiveController): void {
    this.#controllers.delete(ctrl);
  }

  /**
   * Schedule a re-render.
   * Batches multiple calls into a single microtask update.
   */
  requestUpdate(): void {
    if (!this.#updateQueued) {
      this.#updateQueued = true;
      this.#updateCompletePromise = new Promise<boolean>((resolve) => {
        this.#updatePromiseResolve = () => resolve(true);
      });
      queueMicrotask(() => this.#performUpdate(false));
    }
  }

  /** Wait for the pending update to complete */
  get updateComplete(): Promise<boolean> {
    return this.#updateCompletePromise;
  }

  // ─── Internal ─────────────────────────────────────────────────

  /** Perform the actual DOM update */
  #performUpdate(isInitial: boolean): void {
    this.#updateQueued = false;

    if (!this.root) return;

    // Notify controllers
    for (const ctrl of this.#controllers) {
      ctrl.hostUpdate?.();
    }

    // Render and apply
    if (!isInitial) {
      // Re-render: innerHTML replacement (full update)
      const content = this.render();
      if (content != null) {
        this.root.innerHTML = String(content);
      }
    }

    // Notify controllers
    for (const ctrl of this.#controllers) {
      ctrl.hostUpdated?.();
    }

    // Resolve update promise
    this.#updatePromiseResolve?.();
  }

  /**
   * Re-render triggered by state change.
   * Public method for programmatic updates.
   */
  update(): void {
    this.requestUpdate();
  }
}

// ─── Template Helper ────────────────────────────────────────────

/**
 * Lightweight tagged template helper for string-based HTML.
 * In SSR, returns a plain HTML string (no TemplateResult).
 * In client, returns the same string (no DOM diffing).
 *
 * @example
 * ```ts
 * render() {
 *   return html`<button>${this.state.label}</button>`
 * }
 * ```
 */
export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      const v = values[i];
      if (v === null || v === undefined) {
        // Skip — like Lit's nothing
      } else if (typeof v === 'function') {
        // Skip functions in SSR (event handlers aren't serializable)
      } else if (Array.isArray(v)) {
        result += v.join('');
      } else {
        result += String(v);
      }
    }
  }
  return result;
}

/**
 * Create a CSS-in-JS tagged template.
 * Returns a CSS string for use in styles() method.
 */
export function css(
  strings: TemplateStringsArray,
  ...values: unknown[]
): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < values.length) {
      result += String(values[i]);
    }
  }
  return result;
}

// ─── Re-exports (for convenience, keeps @kissjs/core as single import) ───
export { signal, computed, effect } from '@preact/signals-core';
export type { Signal } from '@preact/signals-core';
