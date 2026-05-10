import { assertFalse } from 'jsr:@std/assert@^1.0.0';

const CASES = [
  ['./api-consumer.ts', 'default', [
    'apiUrl',
    'apiData',
    'apiLoading',
    'apiError',
    'name',
    'helloMsg',
    'helloLoading',
    'helloError',
  ]],
  ['./counter-island.ts', 'default', ['count']],
];

for (const [path, exportName, props] of CASES) {
  Deno.test(`docs island ${path}: reactive properties are not shadowed`, async () => {
    const mod = await import(`../app/islands/${path as string}`);
    const Cls = mod[exportName as string] as { new (): object };
    const instance = new Cls() as Record<string, unknown>;

    for (const prop of props as string[]) {
      assertFalse(
        Object.prototype.hasOwnProperty.call(instance, prop),
        `${path}.${prop} must use Lit's generated accessor, not an own class field`,
      );
    }
  });
}
