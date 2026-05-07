/**
 * @lessjs/adapter-lit - WithDsdHydration Mixin unit tests
 *
 * Tests for DSD detection, event hydration, and cleanup.
 * Uses a MockLitElement class since Deno has no browser DOM.
 */
import { assertEquals, assertExists } from 'jsr:@std/assert@^1.0.0';
import type { HydrateEventDescriptor } from '../../core/src/render-dsd.ts';

// ─── Mock DOM ─────────────────────────────────────────────────

class MockShadowRoot {
  childElementCount = 0;
  private _children: MockElement[] = [];
  private _listeners = new Map<string, Array<{ handler: EventListener; signal?: AbortSignal }>>();

  appendChild(child: MockElement) {
    this._children.push(child);
    this.childElementCount = this._children.length;
  }

  querySelector(selector: string): MockElement | null {
    for (const child of this._children) {
      if (child.matches(selector)) return child;
    }
    return null;
  }

  querySelectorAll(selector: string): MockElement[] {
    return this._children.filter((child) => child.matches(selector));
  }

  addEventListener(type: string, handler: EventListener, options?: { signal?: AbortSignal }) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    this._listeners.get(type)!.push({ handler, signal: options?.signal });
  }
}

class MockElement {
  tagName: string;
  className: string;
  attributes: Record<string, string> = {};
  private _listeners = new Map<string, EventListener[]>();

  constructor(tagName: string) {
    this.tagName = tagName;
    this.className = '';
  }

  matches(selector: string): boolean {
    // Simple selector matching: tag, .class, tag.class
    if (selector.startsWith('.')) {
      const cls = selector.slice(1);
      return this.className.split(' ').includes(cls);
    }
    if (selector.includes('.')) {
      const [tag, cls] = selector.split('.');
      return this.tagName.toLowerCase() === tag.toLowerCase() &&
        this.className.split(' ').includes(cls);
    }
    return this.tagName.toLowerCase() === selector.toLowerCase();
  }

  addEventListener(type: string, handler: EventListener, _options?: { signal?: AbortSignal }) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    this._listeners.get(type)!.push(handler);
  }

  getListenerCount(type: string): number {
    return this._listeners.get(type)?.length ?? 0;
  }
}

// ─── MockLitElement ──────────────────────────────────────────

class MockLitElement {
  shadowRoot: MockShadowRoot | null = null;
  isConnected = false;
  private _attachedShadow = false;

  /** Called by the mixin — simulates attachShadow */
  attachShadow(_options: { mode: string }): MockShadowRoot {
    this._attachedShadow = true;
    this.shadowRoot = new MockShadowRoot();
    return this.shadowRoot;
  }

  /** Simulates connecting to DOM */
  connect() {
    this.isConnected = true;
    (this as unknown as { connectedCallback(): void }).connectedCallback();
  }

  /** Simulates disconnecting from DOM */
  disconnect() {
    this.isConnected = false;
    (this as unknown as { disconnectedCallback(): void }).disconnectedCallback();
  }

  connectedCallback() {}
  disconnectedCallback() {}
  createRenderRoot(): MockShadowRoot | HTMLElement {
    return this.attachShadow({ mode: 'open' });
  }
}

// ─── Mixin (extracted from dsd-hydration.ts for testing) ──────
// We re-implement the mixin logic against MockLitElement to test
// the core behavior without importing Lit.

interface DsdHydratedElement extends MockLitElement {
  _dsdHydrated: boolean;
  _hydrateEvents(): void;
  _hydrateAbortController?: AbortController;
}

function applyDsdHydration(
  Base: typeof MockLitElement,
  hydrateEvents?: HydrateEventDescriptor[],
): new () => DsdHydratedElement {
  return class DsdHydrated extends Base {
    static hydrateEvents = hydrateEvents;
    _dsdHydrated = false;
    _hydrateAbortController?: AbortController;

    override createRenderRoot(): MockShadowRoot | HTMLElement {
      if (this.shadowRoot && this.shadowRoot.childElementCount > 0) {
        this._dsdHydrated = true;
        return this.shadowRoot;
      }
      return this.attachShadow({ mode: 'open' });
    }

    override connectedCallback(): void {
      super.connectedCallback();
      if (this._dsdHydrated) {
        this._hydrateEvents();
      }
    }

    override disconnectedCallback(): void {
      super.disconnectedCallback();
      if (this._hydrateAbortController) {
        this._hydrateAbortController.abort();
        this._hydrateAbortController = undefined;
      }
    }

    _hydrateEvents(): void {
      if (!this.shadowRoot) return;
      const ctor = this.constructor as typeof DsdHydrated & {
        hydrateEvents?: HydrateEventDescriptor[];
      };
      const events = ctor.hydrateEvents || [];
      if (events.length === 0) return;

      this._hydrateAbortController = new AbortController();
      const { signal } = this._hydrateAbortController;

      for (const desc of events) {
        const elements = this.shadowRoot.querySelectorAll(desc.selector);
        for (const el of elements) {
          const handler = (this as unknown as Record<string, unknown>)[desc.method];
          if (typeof handler === 'function') {
            el.addEventListener(desc.event, (handler as EventListener).bind(this), { signal });
          }
        }
      }
    }
  } as unknown as new () => DsdHydratedElement;
}

// ─── Tests ────────────────────────────────────────────────────

Deno.test('WithDsdHydration — DSD detection', async (t) => {
  await t.step('detects pre-populated shadow root as DSD', () => {
    const Hydrated = applyDsdHydration(MockLitElement);
    const el = new Hydrated();
    // Simulate DSD: pre-populate shadow root before createRenderRoot
    const sr = new MockShadowRoot();
    sr.appendChild(new MockElement('button'));
    el.shadowRoot = sr;

    const result = el.createRenderRoot();
    assertEquals(el._dsdHydrated, true);
    assertEquals(result, sr);
  });

  await t.step('empty shadow root creates new via attachShadow', () => {
    const Hydrated = applyDsdHydration(MockLitElement);
    const el = new Hydrated();
    // Empty shadow root
    el.shadowRoot = new MockShadowRoot();

    const result = el.createRenderRoot();
    assertEquals(el._dsdHydrated, false);
    assertExists(result);
  });

  await t.step('no shadow root creates new via attachShadow', () => {
    const Hydrated = applyDsdHydration(MockLitElement);
    const el = new Hydrated();
    el.shadowRoot = null;

    const result = el.createRenderRoot();
    assertEquals(el._dsdHydrated, false);
    assertExists(result);
  });
});

Deno.test('WithDsdHydration — _hydrateEvents()', async (t) => {
  await t.step('binds events to matching elements', () => {
    let clickCount = 0;
    const Hydrated = applyDsdHydration(MockLitElement, [
      { selector: 'button', event: 'click', method: '_handleClick' },
    ]);

    const el = new Hydrated() as DsdHydratedElement & { _handleClick: () => void };
    el._handleClick = () => {
      clickCount++;
    };

    // Setup DSD shadow root
    const sr = new MockShadowRoot();
    const btn = new MockElement('button');
    sr.appendChild(btn);
    el.shadowRoot = sr;
    el._dsdHydrated = true;

    el._hydrateEvents();
    assertEquals(clickCount, 0); // not clicked yet
    assertEquals(btn.getListenerCount('click'), 1);
  });

  await t.step('skips if shadow root is null', () => {
    const Hydrated = applyDsdHydration(MockLitElement, [
      { selector: 'button', event: 'click', method: '_handleClick' },
    ]);
    const el = new Hydrated();
    el.shadowRoot = null;
    el._dsdHydrated = true;
    // Should not throw
    el._hydrateEvents();
  });

  await t.step('skips if no hydrateEvents defined', () => {
    const Hydrated = applyDsdHydration(MockLitElement);
    const el = new Hydrated();
    el.shadowRoot = new MockShadowRoot();
    el._dsdHydrated = true;
    // Should not throw
    el._hydrateEvents();
  });

  await t.step('skips elements where method does not exist', () => {
    const Hydrated = applyDsdHydration(MockLitElement, [
      { selector: 'button', event: 'click', method: '_nonExistentMethod' },
    ]);
    const el = new Hydrated();
    const sr = new MockShadowRoot();
    const btn = new MockElement('button');
    sr.appendChild(btn);
    el.shadowRoot = sr;
    el._dsdHydrated = true;
    // Should not throw
    el._hydrateEvents();
    assertEquals(btn.getListenerCount('click'), 0); // no method = no listener
  });
});

Deno.test('WithDsdHydration — AbortController cleanup', async (t) => {
  await t.step('disconnectedCallback aborts the controller', () => {
    let abortCount = 0;
    const Hydrated = applyDsdHydration(MockLitElement, [
      { selector: 'button', event: 'click', method: '_handleClick' },
    ]);

    const el = new Hydrated() as DsdHydratedElement & { _handleClick: () => void };
    el._handleClick = () => {};

    const sr = new MockShadowRoot();
    sr.appendChild(new MockElement('button'));
    el.shadowRoot = sr;
    el._dsdHydrated = true;

    el._hydrateEvents();
    assertExists(el._hydrateAbortController);
    const controller = el._hydrateAbortController!;
    controller.signal.addEventListener('abort', () => abortCount++);

    el.disconnect();
    assertEquals(abortCount, 1);
    assertEquals(el._hydrateAbortController, undefined);
  });

  await t.step('no error if disconnected without hydration', () => {
    const Hydrated = applyDsdHydration(MockLitElement);
    const el = new Hydrated();
    // Should not throw — no abort controller
    el.disconnect();
  });
});

Deno.test('WithDsdHydration — connectedCallback auto-hydration', async (t) => {
  await t.step('auto-calls _hydrateEvents when DSD hydrated', () => {
    let hydrated = false;
    const Hydrated = applyDsdHydration(MockLitElement, [
      { selector: 'button', event: 'click', method: '_handleClick' },
    ]);

    const el = new Hydrated() as DsdHydratedElement & { _handleClick: () => void };
    el._handleClick = () => {};

    // Override _hydrateEvents to detect call
    const originalHydrate = el._hydrateEvents.bind(el);
    el._hydrateEvents = () => {
      hydrated = true;
      originalHydrate();
    };

    const sr = new MockShadowRoot();
    sr.appendChild(new MockElement('button'));
    el.shadowRoot = sr;
    el._dsdHydrated = true;

    el.connect();
    assertEquals(hydrated, true);
  });

  await t.step('does not call _hydrateEvents when not DSD hydrated', () => {
    let hydrated = false;
    const Hydrated = applyDsdHydration(MockLitElement, [
      { selector: 'button', event: 'click', method: '_handleClick' },
    ]);

    const el = new Hydrated() as DsdHydratedElement & { _handleClick: () => void };
    el._handleClick = () => {};

    el._hydrateEvents = () => {
      hydrated = true;
    };

    el._dsdHydrated = false;
    el.connect();
    assertEquals(hydrated, false);
  });
});
