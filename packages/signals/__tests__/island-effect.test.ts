/**
 * @lessjs/signals - islandEffect() unit tests
 *
 * Tests for island-aware effect with auto-disconnect.
 * MutationObserver is mocked since Deno has no browser DOM.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { islandEffect, signal } from '../src/index.ts';

// ─── Mock DOM environment ───────────────────────────────────

class MockElement {
  isConnected = true;
  parentNode: MockParentNode | null = null;
  /** parentElement mirrors parentNode for islandEffect's observeParent() */
  get parentElement(): MockParentNode | null {
    return this.parentNode;
  }
}

class MockParentNode {
  childNodes: MockElement[] = [];
  observerCallbacks: Array<() => void> = [];

  appendChild(child: MockElement) {
    child.parentNode = this;
    this.childNodes.push(child);
  }

  removeChild(child: MockElement) {
    this.childNodes = this.childNodes.filter((c) => c !== child);
    child.parentNode = null;
    child.isConnected = false;
    // Notify MutationObserver
    for (const cb of this.observerCallbacks) cb();
  }
}

// Patch global MutationObserver
const OriginalMO = globalThis.MutationObserver;
// deno-lint-ignore no-explicit-any
const OriginalSetInterval = (globalThis as any).setInterval;
// deno-lint-ignore no-explicit-any
const OriginalClearInterval = (globalThis as any).clearInterval;

/** Track which intervalIds were cleared */
let clearedIntervalIds: Set<number> = new Set();
let nextIntervalId = 1;

function installMocks() {
  // deno-lint-ignore no-explicit-any
  (globalThis as any).MutationObserver = class {
    _callback: () => void;
    _target: MockParentNode | null = null;

    constructor(callback: () => void) {
      this._callback = callback;
    }

    observe(target: unknown, _options?: unknown) {
      if (target instanceof MockParentNode) {
        this._target = target;
        target.observerCallbacks.push(() => this._callback());
      }
    }

    disconnect() {
      this._target = null;
    }
  };

  clearedIntervalIds = new Set();
  nextIntervalId = 1;

  // deno-lint-ignore no-explicit-any
  (globalThis as any).setInterval = (_fn: () => void, _ms: number) => {
    return nextIntervalId++;
  };

  // deno-lint-ignore no-explicit-any
  (globalThis as any).clearInterval = (id: number) => {
    clearedIntervalIds.add(id);
  };
}

function restoreMocks() {
  // deno-lint-ignore no-explicit-any
  (globalThis as any).MutationObserver = OriginalMO;
  // deno-lint-ignore no-explicit-any
  (globalThis as any).setInterval = OriginalSetInterval;
  // deno-lint-ignore no-explicit-any
  (globalThis as any).clearInterval = OriginalClearInterval;
}

/** Flush microtask queue */
function flush(): Promise<void> {
  return new Promise((resolve) => {
    queueMicrotask(() => {
      queueMicrotask(() => resolve());
    });
  });
}

Deno.test('islandEffect() - lifecycle', async (t) => {
  installMocks();

  await t.step('runs effect callback initially', () => {
    const host = new MockElement();
    const parent = new MockParentNode();
    parent.appendChild(host);

    let count = 0;
    const dispose = islandEffect(host as unknown as Element, () => {
      count++;
    });
    assertEquals(count, 1);
    dispose();
  });

  await t.step('re-runs when signal changes', async () => {
    const host = new MockElement();
    const parent = new MockParentNode();
    parent.appendChild(host);

    const s = signal(0);
    let observed = 0;
    const dispose = islandEffect(host as unknown as Element, () => {
      observed = s.value;
    });
    assertEquals(observed, 0);
    s.value = 42;
    await flush();
    assertEquals(observed, 42);
    dispose();
  });

  await t.step('auto-disposes when host is disconnected', async () => {
    const host = new MockElement();
    const parent = new MockParentNode();
    parent.appendChild(host);

    const s = signal(0);
    let count = 0;
    const dispose = islandEffect(host as unknown as Element, () => {
      s.value;
      count++;
    });
    assertEquals(count, 1);

    // Disconnect host (triggers MutationObserver callback)
    parent.removeChild(host);
    assertEquals(host.isConnected, false);

    // Change signal - effect should NOT re-run (auto-disposed)
    s.value = 1;
    await flush();
    assertEquals(count, 1);

    // Calling dispose again should be safe (idempotent)
    dispose();
  });

  await t.step('auto-dispose clears interval (no leak)', () => {
    const host = new MockElement();
    const parent = new MockParentNode();
    parent.appendChild(host);

    const s = signal(0);
    let count = 0;
    const _dispose = islandEffect(host as unknown as Element, () => {
      s.value;
      count++;
    });

    // The interval id assigned by our mock
    const intervalId = nextIntervalId - 1;

    // Auto-dispose via MO
    parent.removeChild(host);

    // The interval should have been cleared by teardown()
    assertEquals(clearedIntervalIds.has(intervalId), true);
  });

  await t.step('explicit dispose clears interval (no leak)', () => {
    const host = new MockElement();
    const parent = new MockParentNode();
    parent.appendChild(host);

    const s = signal(1);
    let count = 0;
    const dispose = islandEffect(host as unknown as Element, () => {
      s.value;
      count++;
    });

    const intervalId = nextIntervalId - 1;
    assertEquals(count, 1);
    dispose();

    // The interval should have been cleared
    assertEquals(clearedIntervalIds.has(intervalId), true);
  });

  await t.step('effect cleanup function is called on dispose', () => {
    const host = new MockElement();
    const parent = new MockParentNode();
    parent.appendChild(host);

    let cleanupCalled = false;
    const dispose = islandEffect(host as unknown as Element, () => {
      return () => {
        cleanupCalled = true;
      };
    });
    dispose();
    assertEquals(cleanupCalled, true);
  });

  await t.step('double dispose is safe (idempotent teardown)', () => {
    const host = new MockElement();
    const parent = new MockParentNode();
    parent.appendChild(host);

    let cleanupCount = 0;
    const dispose = islandEffect(host as unknown as Element, () => {
      return () => {
        cleanupCount++;
      };
    });
    dispose();
    dispose(); // second call should be no-op
    assertEquals(cleanupCount, 1);
  });

  await t.step('auto-dispose cleanup function is called', () => {
    const host = new MockElement();
    const parent = new MockParentNode();
    parent.appendChild(host);

    const s = signal(0);
    let cleanupCalled = false;
    const _dispose = islandEffect(host as unknown as Element, () => {
      s.value;
      return () => {
        cleanupCalled = true;
      };
    });

    // Auto-dispose via MO
    parent.removeChild(host);

    assertEquals(cleanupCalled, true);
  });

  restoreMocks();
});
