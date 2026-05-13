/**
 * @lessjs/signals - channel() unit tests
 *
 * Tests for named event channel (event bus).
 *
 * NOTE: In Deno (no DOM), channel()'s _channelTarget is null at module load,
 * so emit/on/once are no-ops. We test the channel API contract by verifying
 * the interface and the no-op behavior, then test the event bus logic
 * independently using a mock event target.
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { channel } from '../src/index.ts';

// ─── Channel API contract (no-op in Deno) ─────────────────────

Deno.test('channel() — API contract', async (t) => {
  await t.step('channel has correct name', () => {
    const ch = channel('test-channel');
    assertEquals(ch.name, 'test-channel');
  });

  await t.step('channel has emit, on, once methods', () => {
    const ch = channel('api-check');
    assertEquals(typeof ch.emit, 'function');
    assertEquals(typeof ch.on, 'function');
    assertEquals(typeof ch.once, 'function');
  });

  await t.step('emit does not throw in no-DOM environment', () => {
    const ch = channel('no-dom');
    // Should be a no-op without throwing
    ch.emit('test', { data: 1 });
  });

  await t.step('on returns an unsubscribe function', () => {
    const ch = channel('unsub');
    const unsub = ch.on('test', () => {});
    assertEquals(typeof unsub, 'function');
    unsub();
  });

  await t.step('once returns an unsubscribe function', () => {
    const ch = channel('unsub-once');
    const unsub = ch.once('test', () => {});
    assertEquals(typeof unsub, 'function');
    unsub();
  });
});

// ─── Event bus logic (independent mock) ───────────────────────
// Test the channel event bus pattern that would be used in a browser.

interface MockChannel {
  name: string;
  emit(event: string, data?: unknown): void;
  on(event: string, handler: (data: unknown) => void): () => void;
  once(event: string, handler: (data: unknown) => void): () => void;
}

function createMockChannel(name: string): MockChannel {
  type Listener = (data: unknown) => void;
  const listeners = new Map<string, Set<Listener>>();

  return {
    name,
    emit(event: string, data?: unknown): void {
      const set = listeners.get(`less:${name}:${event}`);
      if (set) {
        for (const fn of set) fn(data);
      }
    },
    on(event: string, handler: Listener): () => void {
      const key = `less:${name}:${event}`;
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)!.add(handler);
      return () => listeners.get(key)?.delete(handler);
    },
    once(event: string, handler: Listener): () => void {
      const key = `less:${name}:${event}`;
      const wrapper: Listener = (data) => {
        listeners.get(key)?.delete(wrapper);
        handler(data);
      };
      if (!listeners.has(key)) listeners.set(key, new Set());
      listeners.get(key)!.add(wrapper);
      return () => listeners.get(key)?.delete(wrapper);
    },
  };
}

Deno.test('channel() — event bus logic (mock)', async (t) => {
  await t.step('emit and on receive events', () => {
    const ch = createMockChannel('bus1');
    const received: unknown[] = [];
    ch.on('click', (data) => received.push(data));
    ch.emit('click', { x: 1, y: 2 });
    assertEquals(received.length, 1);
    assertEquals(received[0], { x: 1, y: 2 });
  });

  await t.step('multiple listeners on same event', () => {
    const ch = createMockChannel('bus2');
    const a: unknown[] = [];
    const b: unknown[] = [];
    ch.on('update', (data) => a.push(data));
    ch.on('update', (data) => b.push(data));
    ch.emit('update', 'hello');
    assertEquals(a, ['hello']);
    assertEquals(b, ['hello']);
  });

  await t.step('unsubscribe stops receiving events', () => {
    const ch = createMockChannel('bus3');
    const received: unknown[] = [];
    const unsub = ch.on('change', (data) => received.push(data));
    ch.emit('change', 1);
    unsub();
    ch.emit('change', 2);
    assertEquals(received, [1]);
  });

  await t.step('different events on same channel are independent', () => {
    const ch = createMockChannel('bus4');
    const clicks: unknown[] = [];
    const keys: unknown[] = [];
    ch.on('click', (data) => clicks.push(data));
    ch.on('keydown', (data) => keys.push(data));
    ch.emit('click', 'c1');
    ch.emit('keydown', 'k1');
    assertEquals(clicks, ['c1']);
    assertEquals(keys, ['k1']);
  });

  await t.step('different channels are isolated', () => {
    const ch1 = createMockChannel('isolated-1');
    const ch2 = createMockChannel('isolated-2');
    const received: unknown[] = [];
    ch1.on('ping', (data) => received.push(data));
    ch2.emit('ping', 'from-ch2');
    assertEquals(received.length, 0); // different channel namespace
  });

  await t.step('once receives event only one time', () => {
    const ch = createMockChannel('bus5');
    const received: unknown[] = [];
    ch.once('ping', (data) => received.push(data));
    ch.emit('ping', 1);
    ch.emit('ping', 2);
    assertEquals(received, [1]);
  });

  await t.step('once unsubscribe works before event fires', () => {
    const ch = createMockChannel('bus6');
    const received: unknown[] = [];
    const unsub = ch.once('ping', (data) => received.push(data));
    unsub();
    ch.emit('ping', 1);
    assertEquals(received.length, 0);
  });

  await t.step('emit with no data passes undefined', () => {
    const ch = createMockChannel('bus7');
    const received: unknown[] = [];
    ch.on('ping', (data) => received.push(data));
    ch.emit('ping');
    assertEquals(received.length, 1);
    assertEquals(received[0], undefined);
  });
});
