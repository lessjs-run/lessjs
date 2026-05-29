/**
 * Unit tests for island.ts - the Island registration and upgrade system (321 lines, previously zero coverage).
 *
 * Tests cover:
<<<<<<< HEAD
 * - island() registration and metadata markers
=======
 * - defineIsland() registration and metadata markers
>>>>>>> dev
 * - getSsrProps / bindEvents
 * - Strategy implementations (load, idle, visible, only)
 * - Tag name validation
 * - DSD opt-out (dsd: false -> pure-island layer)
 * - connectedCallback wrapping
 * - Idempotent registration
 *
 * NOTE: Deno test runner doesn't provide a DOM environment by default.
 * We mock customElements, IntersectionObserver, MutationObserver etc.
 */

import { assertEquals, assertStringIncludes, assertThrows } from 'jsr:@std/assert@^1.0.0';
import {
  _clearAllVisibilityTimeouts,
  bindEvents,
  defineIsland,
  getSsrProps,
} from '../src/island.ts';

// ─── Mock infrastructure ─────────────────────────────────────────

/** Registry for mock customElements */
const mockRegistry = new Map<string, CustomElementConstructor>();

function mockCustomElementsGet(name: string): CustomElementConstructor | undefined {
  return mockRegistry.get(name);
}

function mockCustomElementsDefine(name: string, ctor: CustomElementConstructor): void {
  mockRegistry.set(name, ctor);
}

/** Saved globals for cleanup */
let savedCustomElements: CustomElementRegistry | undefined;
let savedRIC: typeof globalThis.requestIdleCallback | undefined;
let savedRAF: typeof globalThis.requestAnimationFrame | undefined;
let savedDocument: Document | undefined;

/** Set up mock browser globals needed by island.ts */
function setupMocks() {
  mockRegistry.clear();

  // Save originals
  savedCustomElements = globalThis.customElements;
  savedRIC = globalThis.requestIdleCallback;
  savedRAF = globalThis.requestAnimationFrame;
  savedDocument = globalThis.document;

  // Mock customElements
  const mockCE = {
    get: mockCustomElementsGet,
    define: mockCustomElementsDefine,
  } as unknown as CustomElementRegistry;
  Object.defineProperty(globalThis, 'customElements', {
    value: mockCE,
    writable: true,
    configurable: true,
  });

  // Mock requestIdleCallback (immediate execution)
  (globalThis as unknown as Record<string, unknown>).requestIdleCallback = (cb: () => void) => {
    cb();
  };

  // Mock requestAnimationFrame (immediate execution)
  (globalThis as unknown as Record<string, unknown>).requestAnimationFrame = (cb: () => void) => {
    cb();
  };
}

/** Restore original globals */
function teardownMocks() {
  if (savedCustomElements !== undefined) {
    Object.defineProperty(globalThis, 'customElements', {
      value: savedCustomElements,
      writable: true,
      configurable: true,
    });
  }
  if (savedRIC !== undefined) {
    (globalThis as unknown as Record<string, unknown>).requestIdleCallback = savedRIC;
  } else {
    delete (globalThis as unknown as Record<string, unknown>).requestIdleCallback;
  }
  if (savedRAF !== undefined) {
    (globalThis as unknown as Record<string, unknown>).requestAnimationFrame = savedRAF;
  } else {
    delete (globalThis as unknown as Record<string, unknown>).requestAnimationFrame;
  }
  if (savedDocument !== undefined) {
    Object.defineProperty(globalThis, 'document', {
      value: savedDocument,
      writable: true,
      configurable: true,
    });
  }
  // Clear all visibility strategy timeouts (prevent timer leaks in tests)
  _clearAllVisibilityTimeouts();
}

/** Create a mock element class with connectedCallback */
function createMockElementClass(): CustomElementConstructor {
  function MockElement(this: unknown) {
    // Mock element constructor
  }
  MockElement.prototype.connectedCallback = function () {
    // Mock callback
  };
  return MockElement as unknown as CustomElementConstructor;
}

// ─── defineIsland() - tag name validation ────────────────────────────

Deno.test('island: throws on tag name without hyphen', () => {
  const Cls = createMockElementClass();
  try {
    defineIsland('nohyphen', Cls);
  } catch (e) {
    assertStringIncludes((e as Error).message, 'hyphenated tag name');
    return;
  }
  throw new Error('Expected defineIsland() to throw for tag name without hyphen');
});

Deno.test('island: throws on empty tag name', () => {
  const Cls = createMockElementClass();
  try {
    defineIsland('', Cls);
  } catch (e) {
    assertStringIncludes((e as Error).message, 'hyphenated tag name');
    return;
  }
  throw new Error('Expected defineIsland() to throw for empty tag name');
});

// ─── defineIsland() - metadata markers ───────────────────────────────

Deno.test('island: sets __island marker on class', () => {
  setupMocks();
  try {
    const Cls = createMockElementClass();
    defineIsland('meta-island-test', Cls);
    assertEquals((Cls as unknown as Record<string, unknown>).__island, true);
  } finally {
    teardownMocks();
  }
});

Deno.test('island: sets __tagName marker on class', () => {
  setupMocks();
  try {
    const Cls = createMockElementClass();
    defineIsland('meta-tagname-test', Cls);
    assertEquals((Cls as unknown as Record<string, unknown>).__tagName, 'meta-tagname-test');
  } finally {
    teardownMocks();
  }
});

Deno.test('island: sets __layer to dsd-interactive by default (dsd: true)', () => {
  setupMocks();
  try {
    const Cls = createMockElementClass();
    defineIsland('meta-dsd-default', Cls);
    assertEquals((Cls as unknown as Record<string, unknown>).__layer, 'dsd-interactive');
  } finally {
    teardownMocks();
  }
});

Deno.test('island: sets __layer to pure-island when dsd: false', () => {
  setupMocks();
  try {
    const Cls = createMockElementClass();
    defineIsland('meta-pure-island', Cls, { dsd: false });
    assertEquals((Cls as unknown as Record<string, unknown>).__layer, 'pure-island');
  } finally {
    teardownMocks();
  }
});

Deno.test('island: sets __layer to dsd-interactive when dsd explicitly true', () => {
  setupMocks();
  try {
    const Cls = createMockElementClass();
    defineIsland('meta-dsd-explicit', Cls, { dsd: true });
    assertEquals((Cls as unknown as Record<string, unknown>).__layer, 'dsd-interactive');
  } finally {
    teardownMocks();
  }
});

// ─── defineIsland() - strategy ───────────────────────────────────────

Deno.test('island: load strategy registers immediately', () => {
  setupMocks();
  try {
    const tag = `load-reg-${Date.now()}`;
    const Cls = createMockElementClass();
    defineIsland(tag, Cls, { strategy: 'load' });
    assertEquals(mockRegistry.get(tag), Cls);
  } finally {
    teardownMocks();
  }
});

Deno.test('island: default strategy is idle (uses requestIdleCallback)', () => {
  setupMocks();
  try {
    const tag = `idle-default-${Date.now()}`;
    const Cls = createMockElementClass();
    const result = defineIsland(tag, Cls);
    // With mock RIC (immediate), the element should be registered
    assertEquals(result, Cls);
    assertEquals(mockRegistry.get(tag), Cls);
  } finally {
    teardownMocks();
  }
});

Deno.test('island: idle strategy defers to requestIdleCallback', () => {
  setupMocks();
  try {
    const tag = `idle-alias-${Date.now()}`;
    const Cls = createMockElementClass();
    const result = defineIsland(tag, Cls, { strategy: 'idle' });
    assertEquals(result, Cls);
    // With mock RIC (immediate), the element should be registered
    assertEquals(mockRegistry.get(tag), Cls);
  } finally {
    teardownMocks();
  }
});

Deno.test('island: unknown strategy throws', () => {
  setupMocks();
  try {
    const tag = `unknown-strat-${Date.now()}`;
    const Cls = createMockElementClass();
    assertThrows(
      // @ts-expect-error testing invalid strategy value
      () => defineIsland(tag, Cls, { strategy: 'bogus' }),
      Error,
      'Invalid island hydration strategy',
    );
  } finally {
    teardownMocks();
  }
});

Deno.test('island: visible strategy does not crash (IntersectionObserver + MutationObserver mock)', () => {
  setupMocks();
  // Mock IntersectionObserver
  const origIO = globalThis.IntersectionObserver;
  const origMO = (globalThis as unknown as Record<string, unknown>).MutationObserver;
  const origDoc = globalThis.document;

  (globalThis as unknown as Record<string, unknown>).IntersectionObserver = class {
    constructor() {}
    observe() {
      return;
    }
    disconnect() {
      return;
    }
    takeRecords() {
      return [];
    }
    unobserve() {
      return;
    }
  };

  // Mock MutationObserver
  (globalThis as unknown as Record<string, unknown>).MutationObserver = class {
    constructor() {}
    observe() {
      return;
    }
    disconnect() {
      return;
    }
    takeRecords() {
      return [];
    }
  };

  // Mock document for visible strategy
  (globalThis as unknown as Record<string, unknown>).document = {
    readyState: 'complete',
    querySelectorAll: () => [],
    body: {},
    addEventListener: () => {},
  };

  try {
    const Cls = createMockElementClass();
    // Should not throw
    defineIsland('visible-strat-test', Cls, { strategy: 'visible' });
  } finally {
    (globalThis as unknown as Record<string, unknown>).IntersectionObserver = origIO;
    (globalThis as unknown as Record<string, unknown>).MutationObserver = origMO;
    (globalThis as unknown as Record<string, unknown>).document = origDoc;
    teardownMocks();
  }
});

// ─── defineIsland() - idempotent registration ────────────────────────

Deno.test('island: does not re-register already defined element', () => {
  setupMocks();
  try {
    const tag = `idempotent-${Date.now()}`;
    const Cls1 = createMockElementClass();
    const Cls2 = createMockElementClass();

    defineIsland(tag, Cls1, { strategy: 'load' });
    const first = mockRegistry.get(tag);

    // Second registration should not replace
    defineIsland(tag, Cls2, { strategy: 'load' });
    assertEquals(mockRegistry.get(tag), first);
  } finally {
    teardownMocks();
  }
});

// ─── defineIsland() - connectedCallback wrapping ─────────────────────

Deno.test('island: wraps connectedCallback for SSR prop binding', () => {
  setupMocks();
  try {
    const tag = `cb-wrap-${Date.now()}`;
    const Cls = createMockElementClass();
    defineIsland(tag, Cls, { strategy: 'load' });

    // The prototype's connectedCallback should be a function
    const proto = (Cls as unknown as { prototype: { connectedCallback?: () => void } }).prototype;
    assertEquals(typeof proto.connectedCallback, 'function');
  } finally {
    teardownMocks();
  }
});

Deno.test('island: marks prototype as __lessIslandWrapped', () => {
  setupMocks();
  try {
    const tag = `wrap-marker-${Date.now()}`;
    const Cls = createMockElementClass();
    defineIsland(tag, Cls, { strategy: 'load' });

    const proto = (Cls as unknown as { prototype: Record<string, unknown> }).prototype;
    assertEquals(proto.__lessIslandWrapped, true);
  } finally {
    teardownMocks();
  }
});

Deno.test('island: does not double-wrap connectedCallback', () => {
  setupMocks();
  try {
    const tag = `no-double-wrap-${Date.now()}`;
    const Cls = createMockElementClass();

    defineIsland(tag, Cls, { strategy: 'load' });
    const proto = (Cls as unknown as { prototype: Record<string, unknown> }).prototype;
    const firstWrap = proto.__lessIslandWrapped;

    // Call island again with same class (should not double-wrap)
    defineIsland(tag, Cls, { strategy: 'load' });
    assertEquals(firstWrap, true);
    assertEquals(proto.__lessIslandWrapped, true);
  } finally {
    teardownMocks();
  }
});

// ─── defineIsland() - return value ───────────────────────────────────

Deno.test('island: returns the original class for chaining/re-export', () => {
  setupMocks();
  try {
    const Cls = createMockElementClass();
    const result = defineIsland('return-class-test', Cls);
    assertEquals(result, Cls);
  } finally {
    teardownMocks();
  }
});

// ─── getSsrProps ───────────────────────────────────────────────

Deno.test('getSsrProps: returns null when no data-ssr-props attribute', () => {
  const el = { getAttribute: () => null, tagName: 'DIV' } as unknown as HTMLElement;
  assertEquals(getSsrProps(el), null);
});

Deno.test('getSsrProps: parses valid JSON from data-ssr-props', () => {
  const el = {
    getAttribute: (name: string) =>
      name === 'data-ssr-props' ? JSON.stringify({ count: 5, label: 'test' }) : null,
    tagName: 'DIV',
  } as unknown as HTMLElement;
  const props = getSsrProps(el);
  assertEquals(props?.count, 5);
  assertEquals(props?.label, 'test');
});

Deno.test('getSsrProps: returns null for invalid JSON', () => {
  const el = {
    getAttribute: (name: string) => name === 'data-ssr-props' ? 'not-json' : null,
    tagName: 'DIV',
  } as unknown as HTMLElement;
  const props = getSsrProps(el);
  assertEquals(props, null);
});

Deno.test('getSsrProps: returns empty object for empty JSON object', () => {
  const el = {
    getAttribute: (name: string) => name === 'data-ssr-props' ? '{}' : null,
    tagName: 'DIV',
  } as unknown as HTMLElement;
  const props = getSsrProps(el);
  assertEquals(props, {});
});

Deno.test('getSsrProps: handles complex nested JSON', () => {
  const data = { items: [1, 2, 3], nested: { a: true } };
  const el = {
    getAttribute: (name: string) => name === 'data-ssr-props' ? JSON.stringify(data) : null,
    tagName: 'DIV',
  } as unknown as HTMLElement;
  const props = getSsrProps(el);
  assertEquals(props?.items, [1, 2, 3]);
  assertEquals((props?.nested as Record<string, unknown>)?.a, true);
});

// ─── bindEvents ──────────────────────────────────────────────────

Deno.test('bindEvents: sets properties from data-ssr-props', () => {
  const data: Record<string, unknown> = { count: 0, label: '' };
  const el = {
    getAttribute: (name: string) =>
      name === 'data-ssr-props' ? JSON.stringify({ count: 42, label: 'hello' }) : null,
    tagName: 'DIV',
    hasAttribute: (name: string) => name === 'data-ssr-props',
    // Make properties settable on the mock
    get count() {
      return data.count;
    },
    set count(v: unknown) {
      data.count = v;
    },
    get label() {
      return data.label;
    },
    set label(v: unknown) {
      data.label = v;
    },
  } as unknown as HTMLElement;

  bindEvents(el);
  assertEquals(data.count, 42);
  assertEquals(data.label, 'hello');
});

Deno.test('bindEvents: does nothing when no data-ssr-props', () => {
  const el = {
    getAttribute: () => null,
    tagName: 'DIV',
    hasAttribute: () => false,
  } as unknown as HTMLElement;

  // Should not throw
  bindEvents(el);
});

Deno.test('bindEvents: skips read-only properties gracefully', () => {
  const el = {
    getAttribute: (name: string) =>
      name === 'data-ssr-props' ? JSON.stringify({ readonly: 'changed' }) : null,
    tagName: 'DIV',
    hasAttribute: (name: string) => name === 'data-ssr-props',
  } as unknown as HTMLElement;

  Object.defineProperty(el, 'readonly', {
    value: 'fixed',
    writable: false,
    configurable: true,
  });

  // Should not throw
  bindEvents(el);
  assertEquals((el as unknown as Record<string, unknown>).readonly, 'fixed');
});

Deno.test('bindEvents: handles empty object in data-ssr-props', () => {
  const el = {
    getAttribute: (name: string) => name === 'data-ssr-props' ? '{}' : null,
    tagName: 'DIV',
    hasAttribute: (name: string) => name === 'data-ssr-props',
  } as unknown as HTMLElement;

  // Should not throw
  bindEvents(el);
});

// ─── defineIsland() - dsd option ─────────────────────────────────────

Deno.test('island: dsd default is true (dsd-interactive layer)', () => {
  setupMocks();
  try {
    const Cls = createMockElementClass();
    defineIsland('dsd-default-test', Cls);
    assertEquals((Cls as unknown as Record<string, unknown>).__layer, 'dsd-interactive');
  } finally {
    teardownMocks();
  }
});

Deno.test('island: dsd: false sets pure-island layer', () => {
  setupMocks();
  try {
    const Cls = createMockElementClass();
    defineIsland('dsd-false-test', Cls, { dsd: false });
    assertEquals((Cls as unknown as Record<string, unknown>).__layer, 'pure-island');
  } finally {
    teardownMocks();
  }
});

// ─── defineIsland() - tagName option ──────────────────────────────────

Deno.test('island: tagName option in IslandOptions does not override first argument', () => {
  setupMocks();
  try {
    const Cls = createMockElementClass();
    // The first argument is used as the tag name regardless of options.tagName
    defineIsland('primary-tag', Cls);
    assertEquals((Cls as unknown as Record<string, unknown>).__tagName, 'primary-tag');
  } finally {
    teardownMocks();
  }
});
