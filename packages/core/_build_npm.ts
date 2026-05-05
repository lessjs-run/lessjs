/**
 * _build_npm.ts - Build @lessjs/core for npm via dnt
 *
 * Usage: deno run -A _build_npm.ts
 *
 * @lessjs/core depends on vite, hono, parse5, entities, and uses
 * Node built-in modules (node:fs, node:path). These need npm
 * dependency mappings and Node shims.
 */
import { build, emptyDir } from 'jsr:@deno/dnt@^0.42';

const version = JSON.parse(Deno.readTextFileSync('./deno.json')).version;

await emptyDir('./npm');

await build({
  entryPoints: [
    { name: '.', path: './src/index.ts' },
    { name: './render-dsd', path: './src/render-dsd.ts' },
    { name: './less-runtime', path: './src/less-runtime.ts' },
    { name: './cli/build', path: './src/cli/build.ts' },
    { name: './cli/build-client', path: './src/cli/build-client.ts' },
    { name: './cli/build-ssg', path: './src/cli/build-ssg.ts' },
  ],
  outDir: './npm',
  shims: {
    deno: true, // polyfill Deno namespace
    node: true, // polyfill node:path, node:fs
  },
  typeCheck: false,
  compilerOptions: {
    skipLibCheck: true,
  },
  package: {
    name: '@lessjs/core',
    version,
    description:
      'LessJS core framework — Vite plugin, DSD rendering, SSG pipeline, Hono serverless integration.',
    license: 'MIT',
    repository: {
      type: 'git',
      url: 'git+https://github.com/lessjs-run/LessJS.git',
    },
    bugs: {
      url: 'https://github.com/lessjs-run/LessJS/issues',
    },
    dependencies: {
      'hono': '^4',
      '@hono/vite-dev-server': '^0.25.3',
      'vite': '^8.0.10',
      'parse5': '^7.0.0',
      'entities': '^6.0.0',
    },
    devDependencies: {
      '@types/node': '^22.0.0',
      '@lit-labs/ssr-dom-shim': '^1.5.0',
    },
  },
  postBuild() {
    Deno.copyFileSync('../../LICENSE', './npm/LICENSE');
    Deno.copyFileSync('./README.md', './npm/README.md');
  },
});
