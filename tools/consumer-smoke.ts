#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env --allow-net
/**
 * consumer-smoke — v0.35.6 (Cell 007)
 *
 * Post-publish smoke test: creates a temporary consumer project,
 * installs @openelement/core from JSR, and verifies basic usage works.
 *
 * Usage:
 *   deno run -A tools/consumer-smoke.ts
 *   deno run -A tools/consumer-smoke.ts --local  (use local workspace)
 *   deno run -A tools/consumer-smoke.ts --version 0.35.6
 */

function getArg(flag: string): string | null {
  const idx = Deno.args.indexOf(flag);
  if (idx !== -1 && idx + 1 < Deno.args.length) {
    return Deno.args[idx + 1];
  }
  return null;
}

async function run(
  cmd: string,
  args: string[],
  cwd?: string,
): Promise<{ success: boolean; output: string }> {
  const command = new Deno.Command(cmd, {
    args,
    cwd,
    stdout: 'piped',
    stderr: 'piped',
  });

  const result = await command.output();
  const stdout = new TextDecoder().decode(result.stdout);
  const stderr = new TextDecoder().decode(result.stderr);

  return {
    success: result.code === 0,
    output: (stdout + stderr).slice(0, 2000),
  };
}

async function main(): Promise<void> {
  const useLocal = Deno.args.includes('--local');
  const version = getArg('--version') ?? '0.36.0';
  const projectRoot = Deno.cwd().replace(/\\/g, '/');

  console.log('🔍 Consumer Smoke Test');
  console.log(`   Mode: ${useLocal ? 'local workspace' : `JSR @openelement/core@${version}`}`);
  console.log('');

  // Create temp directory
  const tmpDir = await Deno.makeTempDir({ prefix: 'openelement-smoke-' });
  console.log(`   Temp dir: ${tmpDir}`);

  try {
    // Create minimal deno.json
    const denoJson = useLocal
      ? {
        imports: {
          '@openelement/core': `file:///${projectRoot}/packages/core/src/index.ts`,
        },
        compilerOptions: {
          jsx: 'react-jsx',
          jsxImportSource: '@openelement/core',
        },
        unstable: ['sloppy-imports'],
      }
      : {
        imports: {
          '@openelement/core': `jsr:@openelement/core@^${version}`,
        },
        compilerOptions: {
          jsx: 'react-jsx',
          jsxImportSource: '@openelement/core',
        },
      };

    await Deno.writeTextFile(
      `${tmpDir}/deno.json`,
      JSON.stringify(denoJson, null, 2),
    );

    // Create minimal test file
    const testContent = `
import { isVNode, type VNode } from '@openelement/core';

const node: VNode = {
  tag: 'div',
  props: { class: 'test' },
  children: ['Hello openElement'],
};

console.log('isVNode:', isVNode(node));
console.log('tag:', node.tag);
console.log('children:', node.children);
console.log('Smoke test passed!');
`;

    await Deno.writeTextFile(`${tmpDir}/smoke.ts`, testContent.trim());

    // Run type check
    console.log('');
    console.log('   Step 1: Type check...');
    const checkResult = await run('deno', ['check', 'smoke.ts'], tmpDir);
    if (!checkResult.success) {
      console.error(`   ❌ Type check failed:\n${checkResult.output}`);
      Deno.exit(1);
    }
    console.log('   ✅ Type check passed');

    // Run the smoke test
    console.log('   Step 2: Execute...');
    const runResult = await run('deno', ['run', 'smoke.ts'], tmpDir);
    if (!runResult.success) {
      console.error(`   ❌ Execution failed:\n${runResult.output}`);
      Deno.exit(1);
    }
    console.log('   ✅ Execution passed');
    console.log(`   Output: ${runResult.output.trim().split('\n').slice(-1)[0]}`);

    console.log('');
    console.log('✅ Consumer smoke test passed!');
  } finally {
    // Cleanup
    try {
      await Deno.remove(tmpDir, { recursive: true });
    } catch { /* ok */ }
  }
}

main();
