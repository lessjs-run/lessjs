import { assertEquals } from 'jsr:@std/assert@1';
import { createAdapterRegistry } from '../src/adapter-registry.ts';
import type { RendererProtocol } from '../src/types.ts';

Deno.test('createAdapterRegistry scopes adapter state per registry instance', () => {
  const lit: RendererProtocol = { name: 'lit' };
  const react: RendererProtocol = { name: 'react' };

  const a = createAdapterRegistry();
  const b = createAdapterRegistry();

  a.register(lit);
  b.register(react);

  assertEquals(a.get()?.name, 'lit');
  assertEquals(a.get('lit')?.name, 'lit');
  assertEquals(a.get('react'), undefined);

  assertEquals(b.get()?.name, 'react');
  assertEquals(b.get('react')?.name, 'react');
  assertEquals(b.get('lit'), undefined);
});

Deno.test('AdapterRegistry clear removes default and named adapters', () => {
  const registry = createAdapterRegistry();
  registry.register({ name: 'vanilla' });
  registry.clear();

  assertEquals(registry.get(), undefined);
  assertEquals(registry.get('vanilla'), undefined);
  assertEquals(registry.getAll(), []);
});

Deno.test('AdapterRegistry register(undefined) resets only the default adapter', () => {
  const registry = createAdapterRegistry();
  registry.register({ name: 'lit' });
  registry.register({ name: 'react' });

  registry.register(undefined);

  assertEquals(registry.get(), undefined);
  assertEquals(registry.get('lit')?.name, 'lit');
  assertEquals(registry.get('react')?.name, 'react');
  assertEquals(registry.getAll().map((adapter) => adapter.name), ['lit', 'react']);
});
