import { assertEquals } from 'jsr:@std/assert@^1.0.0';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const FILES = [
  'www/__tests__/build-output.test.ts',
  'packages/create/__tests__/cli.test.ts',
  'packages/adapter-vite/__tests__/entry-generators.test.ts',
  'packages/adapter-vite/__tests__/build-manifest.test.ts',
];

Deno.test('audit gate: no boolean expressions passed to assertExists in hardened tests', () => {
  const offenders: string[] = [];

  for (const file of FILES) {
    const content = readFileSync(join(Deno.cwd(), file), 'utf-8');
    const lines = content.split(/\r?\n/);
    for (const [index, line] of lines.entries()) {
      if (
        /assertExists\([^,\)]*(?:\.includes\(|===|!==|>=|<=|>|<|\|\||&&)/.test(line)
      ) {
        offenders.push(`${file}:${index + 1}: ${line.trim()}`);
      }
    }
  }

  assertEquals(offenders, []);
});
