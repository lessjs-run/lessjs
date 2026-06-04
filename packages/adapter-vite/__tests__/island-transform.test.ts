/**
 * @openelement/adapter-vite - island-transform.ts tests (Deno)
 */
import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { islandTransformPlugin } from '../src/island-transform.ts';
import { generateClientEntry } from '../src/entry-generators.ts';

type TransformFn = (code: string, id: string) => string | null;

Deno.test('island-transform - islandTransformPlugin', async (t) => {
  const plugin = islandTransformPlugin('app/islands');

  await t.step('returns a Vite plugin', () => {
    assertEquals(plugin.name, 'open:island-transform');
    assertEquals(typeof plugin.transform, 'function');
  });

  await t.step('injects __island marker and __tagName for island files', () => {
    const transform = plugin.transform as unknown as TransformFn;
    const result = transform(
      'export default class MyCounter extends LitElement {}',
      '/project/app/islands/my-counter.ts',
    );
    assertEquals(result!.includes('export const __island = true'), true);
    assertEquals(result!.includes("export const __tagName = 'my-counter'"), true);
  });

  await t.step('does NOT inject CJS-style registration code', () => {
    const transform = plugin.transform as unknown as TransformFn;
    const result = transform(
      'export default class MyCounter extends LitElement {}',
      '/project/app/islands/my-counter.ts',
    );
    // Should NOT contain the old CJS patterns
    assertEquals(result!.includes('exports.default'), false);
    assertEquals(result!.includes('module.exports'), false);
  });

  await t.step('skips non-island files', () => {
    const transform = plugin.transform as unknown as TransformFn;
    const result = transform(
      'export default class Header extends LitElement {}',
      '/project/app/components/header.ts',
    );
    assertEquals(result, null);
  });

  await t.step('warns for tag names without hyphen', () => {
    const transform = plugin.transform as unknown as TransformFn;
    // When called with proper context, it returns null for no-hyphen names
    const result = transform.call(
      { warn: () => {} },
      'export default class Counter extends LitElement {}',
      '/project/app/islands/counter.ts',
    );
    assertEquals(result, null);
  });

  await t.step('errors for tag names with unsafe characters', () => {
    const transform = plugin.transform as unknown as TransformFn;
    let errorThrown = false;
    const mockContext = {
      error: (msg: string) => {
        errorThrown = true;
        // In Vite, this.error() throws - simulate by throwing
        throw new Error(msg);
      },
      warn: () => {},
    };
    try {
      // "my-mod!.ts" -> fileToTagName strips .ts -> "my-mod!" - has hyphen AND
      // exclamation mark, triggers error() for unsafe characters
      transform.call(
        mockContext,
        'export default class MyMod extends LitElement {}',
        '/project/app/islands/my-mod!.ts',
      );
    } catch (e) {
      // Expected: this.error() throws for unsafe chars
      assertEquals((e as Error).message.includes('unsafe characters'), true);
    }
    assertEquals(errorThrown, true, 'this.error() should have been called');
  });

  await t.step('handles Windows-style paths', () => {
    const winPlugin = islandTransformPlugin('app\\islands');
    const transform = winPlugin.transform as unknown as TransformFn;
    const result = transform(
      'export default class MyCounter extends LitElement {}',
      'C:\\project\\app\\islands\\my-counter.ts',
    );
    assertEquals(result!.includes('export const __island = true'), true);
  });
});

Deno.test('entry-generators - generateClientEntry (v0.5.0 CE upgrade)', async (t) => {
  await t.step('no legacy SSR client imports - CE-native upgrade', () => {
    const islands = [
      {
        tagName: 'my-counter',
        modulePath: '/app/islands/my-counter.ts',
        strategy: 'idle' as const,
      },
    ];
    const code = generateClientEntry(islands);
    // v0.5.0: browser CE spec upgrades elements automatically
    assertEquals(
      code.includes('lit-element-hydrate-support'),
      false,
    );
  });

  await t.step('registers custom elements via dynamic import', () => {
    const islands = [
      {
        tagName: 'my-counter',
        modulePath: '/app/islands/my-counter.ts',
        strategy: 'idle' as const,
      },
      {
        tagName: 'theme-toggle',
        modulePath: '@openelement/ui/open-theme-toggle',
        isPackage: true,
        strategy: 'idle' as const,
      },
    ];
    const code = generateClientEntry(islands);
    // All islands (local + package) use dynamic import() - they self-register
    assertEquals(code.includes('import("/app/islands/my-counter.ts")'), true);
    assertEquals(code.includes('import("@openelement/ui/open-theme-toggle")'), true);
    // No explicit customElements.define() in generated entry
    assertEquals(code.includes("customElements.define('my-counter'"), false);
  });

  await t.step('uses requestIdleCallback for idle loading', () => {
    const islands = [
      {
        tagName: 'my-counter',
        modulePath: '/app/islands/my-counter.ts',
        strategy: 'idle' as const,
      },
    ];
    const code = generateClientEntry(islands);
    assertEquals(code.includes('requestIdleCallback'), true);
    assertEquals(code.includes('function __load'), true);
  });

  await t.step('dispatches open:ready event after upgrade', () => {
    const islands = [
      {
        tagName: 'my-counter',
        modulePath: '/app/islands/my-counter.ts',
        strategy: 'idle' as const,
      },
    ];
    const code = generateClientEntry(islands);
    // v0.5.0: no old marker, CE-native upgrade
    assertEquals(code.includes('defer-hydration'), false);
    assertEquals(code.includes('open:ready'), true);
    assertEquals(code.includes('LitElement'), false);
  });

  await t.step('returns no-client-JS comment for empty islands', () => {
    const code = generateClientEntry([]);
    assertEquals(code.includes('No islands detected'), true);
    assertEquals(code.includes('hydrate'), false);
  });
});
