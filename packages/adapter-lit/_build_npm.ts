/**
 * _build_npm.ts - Build @lessjs/adapter-lit for npm via dnt
 *
 * Zero-dependency — detects Lit TemplateResult by duck-typing at runtime.
 * Usage: deno run -A _build_npm.ts
 */
import { build, emptyDir } from 'jsr:@deno/dnt@^0.42';

const version = JSON.parse(Deno.readTextFileSync('./deno.json')).version;

await emptyDir('./npm');

await build({
  entryPoints: [
    { name: '.', path: './src/index.ts' },
    { name: './ssr', path: './src/ssr.ts' },
  ],
  outDir: './npm',
  typeCheck: false,
  compilerOptions: {
    skipLibCheck: true,
  },
  shims: { deno: false, node: false },
  package: {
    name: '@lessjs/adapter-lit',
    version,
    description:
      'Lit SSR adapter for LessJS — converts Lit TemplateResult to clean DSD HTML without @lit-labs/ssr.',
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
    Deno.copyFileSync('../../LICENSE', './npm/LICENSE');
  },
});
