import { less } from '../packages/core/src/index.js';
import { lessContent } from '../packages/content/src/index.ts';
import { lessRootColorCSS } from '../packages/ui/src/tokens/colors.js';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Vite needs resolve.alias because JSR packages aren't in node_modules.
// Generated SSR entries import runtime helpers from '@lessjs/core/less-runtime',
// but at build time Vite resolves that specifier to a docs-only shim.
// The shim only re-exports runtime APIs (renderDSD, wrapInDocument, Hono),
// avoiding pull-in of build-time code (node:fs, Vite plugin internals).
// NOTE: __dirname is unavailable in Deno ESM — use import.meta instead.
const __dir = dirname(fileURLToPath(import.meta.url));
const runtimeShim = resolve(__dir, 'app/.less-runtime.ts');
const uiSrcDir = resolve(__dir, '../packages/ui/src');

// DRY: All color token values come from a single source of truth.
// lessRootColorCSS is generated from lessDarkColors/lessLightColors in tokens/colors.ts.
// Do NOT hand-write color values here — edit the source objects instead.
const colorTokensStyle =
  `<style>${lessRootColorCSS}body{margin:0;background:var(--less-bg-base);color:var(--less-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>`;

export default defineConfig({
  base: '/',
  plugins: [
    less({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      html: {
        title: 'LessJS',
      },
      // Use packageIslands to consume @lessjs/ui components
      // (less-theme-toggle is no longer a local copy — it comes from the package)
      packageIslands: ['@lessjs/ui'],
      // SSR configuration: bundle @lessjs/ui instead of externalizing
      // This fixes "Unsupported decorator location: field" error in SSR
      ssr: {
        noExternal: ['@lessjs/ui'],
      },
      pwa: {
        name: 'LessJS Framework — Less is More',
        shortName: 'LessJS',
        themeColor: '#000000',
        backgroundColor: '#ffffff',
      },
      inject: {
        stylesheets: [],
        scripts: [],
        headFragments: [
          // Meta: Open Graph / Twitter Cards
          '<meta property="og:site_name" content="LessJS">',
          '<meta property="og:type" content="website">',
          '<meta property="og:title" content="LessJS — Less is More">',
          '<meta property="og:description" content="DSD-first Web Standards framework. Zero-runtime core, SSG + Island architecture, Lit Web Components, Hono API routes.">',
          '<meta property="og:url" content="https://lessjs.org">',
          '<meta property="og:image" content="https://lessjs.org/assets/og-image.svg">',
          '<meta name="twitter:card" content="summary_large_image">',
          '<meta name="description" content="LessJS — Less is More. Web Standards-first Jamstack SSG with Island architecture. Zero-runtime core, DSD rendering, Lit Web Components, Hono API routes.">',
          // Non-blocking OpenProps: media="print" prevents render-block, onload switches to all
          '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-props@1.7.20/open-props.min.css" media="print" onload="this.media=\'all\'">',
          // Anti-flash: CLS prevention — removed by theme-init.js
          '<style id="less-anti-flash">html{visibility:hidden}</style>',
          // Favicon (transparent bg, less-than symbol)
          '<link rel="icon" type="image/svg+xml" href="/assets/less-logo.svg" />',
          '<link rel="apple-touch-icon" href="/assets/less-logo.svg" />',
          // DSD (Declarative Shadow DOM) polyfill removed — all modern browsers
          // (Chrome 90+, Safari 16.4+, Firefox 123+) support native DSD.
          // The old document.write() polyfill caused:
          //   1. "parser-blocking, cross-site script" browser warnings
          //   2. "Cannot use import statement outside a module" SyntaxError
          //   3. document.write() is hostile to modern browsers and CSP
          // Theme system: Pure B&W — Dark / Light
          // DRY: CSS values come from @lessjs/ui/tokens/colors.ts (single source of truth)
          colorTokensStyle,
          // Init theme from localStorage or prefers-color-scheme
          '<script src="/theme-init.js"></script>',
          // Mobile sidebar: universal JS for open/close (all browsers)
          '<script defer src="/mobile-menu.js"></script>',
          // Code syntax highlighting (Prism, loaded async to avoid blocking)
          '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" media="print" onload="this.media=\'all\'">',
          '<script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>',
          '<script defer src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>',
          // Prism auto-init: adds default language class + highlights after DSD settles
          '<script defer src="/prism-init.js"></script>',
          // Privacy-friendly analytics (GoatCounter, no cookies)
          '<script data-goatcounter="https://lessjs.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>',
        ],
      },
    }),
    // @lessjs/content: Blog + Nav + Sitemap (unified content plugin)
    lessContent({
      blog: {
        contentDir: resolve(__dir, 'content/blog'),
        basePath: '/blog',
      },
      nav: {
        routesDir: resolve(__dir, 'app/routes'),
        headerNav: [
          { href: '/guide/positioning', label: 'Docs' },
          { href: '/guide/architecture', label: 'Architecture' },
          { href: '/blog', label: 'Blog' },
          { href: '/ui', label: 'UI' },
          { href: '/roadmap', label: 'Roadmap' },
          { href: '/community', label: 'Community' },
          { href: 'https://jsr.io/@lessjs/core', label: 'JSR' },
        ],
      },
      sitemap: {
        hostname: 'https://lessjs.org',
      },
    }),
  ],
  resolve: {
    alias: [
      {
        find: '@lessjs/core/render-dsd',
        replacement: resolve(__dir, '../packages/core/src/render-dsd.ts'),
      },
      {
        find: '@lessjs/core/logger',
        replacement: resolve(__dir, '../packages/core/src/logger.ts'),
      },
      { find: '@lessjs/core/less-runtime', replacement: runtimeShim },
      {
        find: '@lessjs/core/navigation',
        replacement: resolve(__dir, '../packages/core/src/navigation.ts'),
      },
      {
        find: '@lessjs/core',
        replacement: resolve(__dir, '../packages/core/src/index.ts'),
      },
      {
        find: '@lessjs/adapter-lit/ssr',
        replacement: resolve(__dir, '../packages/adapter-lit/src/ssr.ts'),
      },
      {
        find: '@lessjs/adapter-lit',
        replacement: resolve(__dir, '../packages/adapter-lit/src/index.ts'),
      },
      { find: '@lessjs/ui/less-button', replacement: resolve(uiSrcDir, 'less-button.ts') },
      { find: '@lessjs/ui/less-card', replacement: resolve(uiSrcDir, 'less-card.ts') },
      { find: '@lessjs/ui/less-input', replacement: resolve(uiSrcDir, 'less-input.ts') },
      { find: '@lessjs/ui/less-code-block', replacement: resolve(uiSrcDir, 'less-code-block.ts') },
      { find: '@lessjs/ui/less-layout', replacement: resolve(uiSrcDir, 'less-layout.ts') },
      {
        find: '@lessjs/ui/less-theme-toggle',
        replacement: resolve(uiSrcDir, 'less-theme-toggle.ts'),
      },
      { find: '@lessjs/ui/less-hero-ping', replacement: resolve(uiSrcDir, 'less-hero-ping.ts') },
      { find: '@lessjs/ui/less-dialog', replacement: resolve(uiSrcDir, 'less-dialog.ts') },
      { find: '@lessjs/ui', replacement: resolve(uiSrcDir, 'index.ts') },
      // Subpath aliases MUST come before parent path (Vite prefix matching)
      {
        find: '@lessjs/content/sitemap',
        replacement: resolve(__dir, '../packages/content/src/sitemap/index.ts'),
      },
      { find: '@lessjs/content', replacement: resolve(__dir, '../packages/content/src/index.ts') },
    ],
  },
});
