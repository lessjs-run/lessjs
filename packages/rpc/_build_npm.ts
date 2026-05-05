/**
 * _build_npm.ts - Build @lessjs/rpc for npm via dnt
 *
 * Usage: deno run -A _build_npm.ts
 *
 * @lessjs/rpc has zero external dependencies (pure Web APIs),
 * so this is the simplest build script in the monorepo.
 */
import { build, emptyDir } from 'jsr:@deno/dnt@^0.42';

const version = JSON.parse(Deno.readTextFileSync('./deno.json')).version;

await emptyDir('./npm');

await build({
  entryPoints: [
    { name: '.', path: './src/index.ts' },
  ],
  outDir: './npm',
  typeCheck: false,
  compilerOptions: {
    skipLibCheck: true,
  },
  shims: {
    // No Deno namespace used, no Node built-ins needed
    deno: false,
    node: false,
  },
  package: {
    name: '@lessjs/rpc',
    version,
    description:
      'Zero-dependency RPC controller for Web Components — fetch with retry, abort, and loading states.',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/lessjs-run/LessJS.git',
    },
    bugs: {
      url: 'https://github.com/lessjs-run/LessJS/issues',
    },
  },
  postBuild() {
    Deno.copyFileSync('../LICENSE', './npm/LICENSE');
    Deno.copyFileSync('./README.md', './npm/README.md');
  },
});
