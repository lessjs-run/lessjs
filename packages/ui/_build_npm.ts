/**
 * _build_npm.ts - Build @lessjs/ui for npm
 *
 * @lessjs/ui is pre-built via Vite into dist/. This script packages
 * the dist/ output into an npm-compatible package with a proper
 * package.json and lit as a peer dependency.
 *
 * Usage: deno run -A _build_npm.ts
 */
import { copy, emptyDir } from 'jsr:@deno/dnt@^0.42';

const version = JSON.parse(Deno.readTextFileSync('./deno.json')).version;

await emptyDir('./npm');

// Build package.json
const pkgJson = {
  name: '@lessjs/ui',
  version,
  description:
    'LessJS UI component library — Web Components with Lit, Swiss International Style design tokens.',
  license: 'MIT',
  repository: {
    type: 'git',
    url: 'git+https://github.com/lessjs-run/LessJS.git',
  },
  bugs: {
    url: 'https://github.com/lessjs-run/LessJS/issues',
  },
  type: 'module',
  exports: {
    '.': './dist/index.js',
    './less-button': './dist/less-button.js',
    './less-card': './dist/less-card.js',
    './less-input': './dist/less-input.js',
    './less-code-block': './dist/less-code-block.js',
    './less-layout': './dist/less-layout.js',
    './less-theme-toggle': './dist/less-theme-toggle.js',
    './less-hero-ping': './dist/less-hero-ping.js',
    './less-ui-plugin': './dist/less-ui-plugin.js',
    './design-tokens': './dist/design-tokens.js',
    './tokens/colors': './dist/tokens/colors.js',
  },
  peerDependencies: {
    lit: '^3.2.0',
  },
};

// Write package.json
Deno.writeTextFileSync('./npm/package.json', JSON.stringify(pkgJson, null, 2));

// Copy dist/
await copy('./dist', './npm/dist', { overwrite: true });

// Copy license
Deno.copyFileSync('../../LICENSE', './npm/LICENSE');
