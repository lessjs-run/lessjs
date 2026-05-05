/**
 * _build_npm.ts - Build @lessjs/create for npm
 *
 * @lessjs/create is a Deno CLI that scaffolds LessJS projects.
 * The npm package wraps it with a Node.js shim that calls `deno run -A jsr:@lessjs/create`.
 *
 * Prerequisites: User must have Deno 2.7+ installed.
 *
 * Usage: deno run -A _build_npm.ts
 */
import { emptyDir } from 'jsr:@deno/dnt';

const version = JSON.parse(Deno.readTextFileSync('./deno.json')).version;

await emptyDir('./npm');

// Create the Node.js CLI wrapper
const binScript = `#!/usr/bin/env node
// @lessjs/create - LessJS project scaffolding (Deno wrapper)
// Requires Deno 2.7+ installed on the system.
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Check if deno is available
try {
  execSync('deno --version', { stdio: 'ignore' });
} catch {
  console.error('Error: Deno is required to use @lessjs/create.');
  console.error('Install Deno from: https://deno.com/');
  console.error('');
  console.error('Or run directly: deno run -A jsr:@lessjs/create <project-name>');
  process.exit(1);
}

// Pass through all arguments to the Deno CLI
const args = process.argv.slice(2).join(' ');
const cmd = 'deno run -A jsr:@lessjs/create ' + args;

try {
  execSync(cmd, { stdio: 'inherit' });
} catch (error) {
  // deno will already have printed the error
  process.exit(1);
}
`;

// Write the wrapper script
Deno.writeTextFileSync('./npm/cli.mjs', binScript);
// Make executable on Unix
Deno.chmodSync('./npm/cli.mjs', 0o755);

// Build package.json
const pkgJson = {
  name: '@lessjs/create',
  version,
  description: 'Scaffold a new LessJS project — Deno-first, DSD + Island Architecture + SSG.',
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'git+https://github.com/lessjs-run/LessJS.git',
  },
  bugs: {
    url: 'https://github.com/lessjs-run/LessJS/issues',
  },
  type: 'module',
  bin: {
    'create-lessjs': './cli.mjs',
  },
};

Deno.writeTextFileSync('./npm/package.json', JSON.stringify(pkgJson, null, 2));

// Copy license
Deno.copyFileSync('../../LICENSE', './npm/LICENSE');
