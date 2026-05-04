import { kiss } from '../packages/kiss-core/src/index.js';
import { kissRootColorCSS } from '../packages/kiss-ui/src/tokens/colors.js';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Vite needs resolve.alias because JSR packages aren't in node_modules.
// Generated SSR entries import runtime helpers from '@kissjs/core',
// but at build time Vite resolves that specifier to a docs-only shim.
// The shim only re-exports runtime APIs (renderDSD, wrapInDocument, Hono),
// avoiding pull-in of build-time code (node:fs, Vite plugin internals).
// NOTE: __dirname is unavailable in Deno ESM — use import.meta instead.
const __dir = dirname(fileURLToPath(import.meta.url));
const runtimeShim = resolve(__dir, 'app/.kiss-runtime.ts');
const uiSrcDir = resolve(__dir, '../packages/kiss-ui/src');

// DRY: All color token values come from a single source of truth.
// kissRootColorCSS is generated from kissDarkColors/kissLightColors in tokens/colors.ts.
// Do NOT hand-write color values here — edit the source objects instead.
const colorTokensStyle =
  `<style>${kissRootColorCSS}body{margin:0;background:var(--kiss-bg-base);color:var(--kiss-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>`;

export default defineConfig({
  base: '/',
  plugins: [
    kiss({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      html: {
        title: 'KISS',
      },
      // Use packageIslands to consume @kissjs/ui components
      // (kiss-theme-toggle is no longer a local copy — it comes from the package)
      packageIslands: ['@kissjs/ui'],
      // SSR configuration: bundle @kissjs/ui instead of externalizing
      // This fixes "Unsupported decorator location: field" error in SSR
      ssr: {
        noExternal: ['@kissjs/ui'],
      },
      pwa: {
        name: 'KISS Framework',
        shortName: 'KISS',
        themeColor: '#000000',
        backgroundColor: '#ffffff',
      },
      inject: {
        stylesheets: [],
        scripts: [],
        headFragments: [
          // Meta
          '<meta name="description" content="KISS Framework — Web Standards-first Jamstack SSG with Island architecture. Zero-runtime core, DSD rendering, Lit Web Components, Hono API routes.">',
          // Non-blocking OpenProps: media="print" prevents render-block, onload switches to all
          '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-props@1.7.20/open-props.min.css" media="print" onload="this.media=\'all\'">',
          // Anti-flash: CLS prevention — removed by theme-init.js
          '<style id="kiss-anti-flash">html{visibility:hidden}</style>',
          // Favicon
          '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
          // DSD (Declarative Shadow DOM) polyfill removed — all modern browsers
          // (Chrome 90+, Safari 16.4+, Firefox 123+) support native DSD.
          // The old document.write() polyfill caused:
          //   1. "parser-blocking, cross-site script" browser warnings
          //   2. "Cannot use import statement outside a module" SyntaxError
          //   3. document.write() is hostile to modern browsers and CSP
          // Theme system: Pure B&W — Dark / Light
          // DRY: CSS values come from @kissjs/ui/tokens/colors.ts (single source of truth)
          colorTokensStyle,
          // Init theme from localStorage or prefers-color-scheme
          '<script src="/theme-init.js"></script>',
          // Mobile sidebar: close on backdrop click
          '<script defer src="/mobile-sidebar.js"></script>',
          // :has() fallback for older browsers (Safari < 15.4, Firefox < 121)
          '<script defer src="/has-fallback.js"></script>',
        ],
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: '@kissjs/core/render-dsd',
        replacement: resolve(__dir, '../packages/kiss-core/src/render-dsd.ts'),
      },
      { find: '@kissjs/core', replacement: runtimeShim },
      {
        find: '@kissjs/adapter-lit/ssr',
        replacement: resolve(__dir, '../packages/kiss-adapter-lit/src/ssr.ts'),
      },
      {
        find: '@kissjs/adapter-lit',
        replacement: resolve(__dir, '../packages/kiss-adapter-lit/src/index.ts'),
      },
      { find: '@kissjs/ui/kiss-button', replacement: resolve(uiSrcDir, 'kiss-button.ts') },
      { find: '@kissjs/ui/kiss-card', replacement: resolve(uiSrcDir, 'kiss-card.ts') },
      { find: '@kissjs/ui/kiss-input', replacement: resolve(uiSrcDir, 'kiss-input.ts') },
      { find: '@kissjs/ui/kiss-code-block', replacement: resolve(uiSrcDir, 'kiss-code-block.ts') },
      { find: '@kissjs/ui/kiss-layout', replacement: resolve(uiSrcDir, 'kiss-layout.ts') },
      {
        find: '@kissjs/ui/kiss-theme-toggle',
        replacement: resolve(uiSrcDir, 'kiss-theme-toggle.ts'),
      },
      { find: '@kissjs/ui/kiss-hero-ping', replacement: resolve(uiSrcDir, 'kiss-hero-ping.ts') },
      { find: '@kissjs/ui/kiss-ui-plugin', replacement: resolve(uiSrcDir, 'kiss-ui-plugin.ts') },
      { find: '@kissjs/ui/design-tokens', replacement: resolve(uiSrcDir, 'design-tokens.ts') },
      { find: '@kissjs/ui/tokens/colors', replacement: resolve(uiSrcDir, 'tokens/colors.ts') },
      { find: '@kissjs/ui', replacement: resolve(uiSrcDir, 'index.ts') },
    ],
  },
});
