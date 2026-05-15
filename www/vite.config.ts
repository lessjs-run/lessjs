import { lessjs } from '../packages/app/src/index.ts';
import { lessRootColorCSS } from '../packages/ui/src/tokens/colors.js';
import { defineConfig } from 'vite';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep Vite aligned with the Deno workspace when the docs site builds package sources.
const __dir = dirname(fileURLToPath(import.meta.url));

const workspaceAlias = [
  {
    find: '@lessjs/core/context',
    replacement: resolve(__dir, '../packages/core/src/context.ts'),
  },
  {
    find: '@lessjs/core/errors',
    replacement: resolve(__dir, '../packages/core/src/errors.ts'),
  },
  {
    find: '@lessjs/core/logger',
    replacement: resolve(__dir, '../packages/core/src/logger.ts'),
  },
  {
    find: '@lessjs/core/navigation',
    replacement: resolve(__dir, '../packages/core/src/navigation.ts'),
  },
  {
    find: '@lessjs/core',
    replacement: resolve(__dir, '../packages/core/src/index.ts'),
  },
  {
    find: '@lessjs/ui',
    replacement: resolve(__dir, '../packages/ui/src/index.ts'),
  },
  // rolldown does not support subpath resolution from a file:// alias
  // (treats index.ts/less-layout as a directory path → ENOTDIR).
  // Each component subpath must be listed explicitly in the Vite alias.
  {
    find: '@lessjs/ui/design-tokens',
    replacement: resolve(__dir, '../packages/ui/src/design-tokens.ts'),
  },
  {
    find: '@lessjs/ui/less-button',
    replacement: resolve(__dir, '../packages/ui/src/less-button.ts'),
  },
  {
    find: '@lessjs/ui/less-card',
    replacement: resolve(__dir, '../packages/ui/src/less-card.ts'),
  },
  {
    find: '@lessjs/ui/less-code-block',
    replacement: resolve(__dir, '../packages/ui/src/less-code-block.ts'),
  },
  {
    find: '@lessjs/ui/less-dialog',
    replacement: resolve(__dir, '../packages/ui/src/less-dialog.ts'),
  },
  {
    find: '@lessjs/ui/less-hero-ping',
    replacement: resolve(__dir, '../packages/ui/src/less-hero-ping.ts'),
  },
  {
    find: '@lessjs/ui/less-input',
    replacement: resolve(__dir, '../packages/ui/src/less-input.ts'),
  },
  {
    find: '@lessjs/ui/less-layout',
    replacement: resolve(__dir, '../packages/ui/src/less-layout.ts'),
  },
  {
    find: '@lessjs/ui/less-theme-toggle',
    replacement: resolve(__dir, '../packages/ui/src/less-theme-toggle.ts'),
  },
  {
    find: '@lessjs/ui/tokens/color-values',
    replacement: resolve(__dir, '../packages/ui/src/tokens/color-values.ts'),
  },
  {
    find: '@lessjs/ui/tokens/colors',
    replacement: resolve(__dir, '../packages/ui/src/tokens/colors.ts'),
  },
  {
    find: '@lessjs/adapter-lit',
    replacement: resolve(__dir, '../packages/adapter-lit/src/index.ts'),
  },
  {
    find: '@lessjs/adapter-vite/build-context',
    replacement: resolve(
      __dir,
      '../packages/adapter-vite/src/build-context.ts',
    ),
  },
  {
    find: '@lessjs/adapter-vite',
    replacement: resolve(__dir, '../packages/adapter-vite/src/index.ts'),
  },
  {
    find: '@lessjs/content/sitemap',
    replacement: resolve(__dir, '../packages/content/src/sitemap/index.ts'),
  },
  {
    find: '@lessjs/content',
    replacement: resolve(__dir, '../packages/content/src/index.ts'),
  },
  {
    find: '@lessjs/i18n',
    replacement: resolve(__dir, '../packages/i18n/src/index.ts'),
  },
  {
    find: '@lessjs/app',
    replacement: resolve(__dir, '../packages/app/src/index.ts'),
  },
];

// DRY: All color token values come from a single source of truth.
// lessRootColorCSS is generated from lessDarkColors/lessLightColors in tokens/colors.ts.
// Do NOT hand-write color values here — edit the source objects instead.
const colorTokensStyle = `<style>${lessRootColorCSS}body{margin:0;background:var(--less-bg-base);color:var(--less-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>`;

export default defineConfig({
  base: '/',
  resolve: {
    alias: workspaceAlias,
  },
  build: {
    chunkSizeWarningLimit: 1500,
  },
  plugins: [
    lessjs({
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
      viewTransition: true,
      speculation: true,
      inject: {
        stylesheets: [],
        scripts: [
          { src: '/theme-init.js' },
          { src: '/mobile-menu.js', defer: true },
          // H-04 fix: Added SRI (Subresource Integrity) to all external CDN scripts
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
            defer: true,
            attrs: {
              integrity: 'sha256-57iL3cbHV7L8jLET4kaYAasUp47BqPraTWOR41c/X58=',
              crossorigin: 'anonymous',
            },
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js',
            defer: true,
            attrs: {
              integrity: 'sha256-A0Xqg+Ere5dOlTx5pk3qNaQDLCUSdtwuwuCAg+2iT0=',
              crossorigin: 'anonymous',
            },
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js',
            defer: true,
            attrs: {
              integrity: 'sha256-hS9VE7ucqdskf4bs/OdKzJHFQXSdNJKRVyQFGP74FSo=',
              crossorigin: 'anonymous',
            },
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js',
            defer: true,
            attrs: {
              integrity: 'sha256-lW2GuqfsQQZ1jzVKwtFAvc1/wQPezgL3PtErjWY+Q=',
              crossorigin: 'anonymous',
            },
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js',
            defer: true,
            attrs: {
              integrity: 'sha256-YmCBQRDlGC8pVuO9JXQpVI2dvyqbZqY3GbJs+frJZqc=',
              crossorigin: 'anonymous',
            },
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js',
            defer: true,
            attrs: {
              integrity:
                'sha256-jJdg26fybqhCAWkZVE3Ztzp4o21bHphCAWkZVE3Ztzp4o=',
              crossorigin: 'anonymous',
            },
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js',
            defer: true,
            attrs: {
              integrity: 'sha256-h5/J0lbDUtmA4FOFf6cHMwhTuL+2fOKE6mYaJN7FdW4=',
              crossorigin: 'anonymous',
            },
          },
          { src: '/prism-init.js', defer: true },
          // H-04 fix: GoatCounter with SRI
          {
            src: 'https://gc.zgo.at/count.js',
            async: true,
            attrs: {
              integrity:
                'sha256-eSt6vSbB+2rmKQaDPgmjASUeJkGBbmbmnk+Vq6UY8/4/A=',
              crossorigin: 'anonymous',
              'data-goatcounter': 'https://lessjs.goatcounter.com/count',
            },
          },
        ],
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
          // H-05 fix: Added SRI (Subresource Integrity) to external stylesheets
          '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-props@1.7.20/open-props.min.css" media="print" onload="this.media=\'all\'" integrity="sha256-S8m+xmPrf+8st2gNKYPYj85php3vudhp3php3vudCJAMNyYH1w=" crossorigin="anonymous">',
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
          // Mobile sidebar: universal JS for open/close (all browsers)
          // Code syntax highlighting (Prism, loaded async to avoid blocking)
          // H-05 fix: Added SRI to Prism theme stylesheet
          '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" media="print" onload="this.media=\'all\'" integrity="sha256-ko4jrn874LF8dHwW29/xabhh8YBleWfvxb8nQce4Fc=" crossorigin="anonymous">',
          // Pre-load common grammars with PROPER dependency order:
          // typescript extends javascript → javascript MUST load before typescript
          // Prism auto-init: adds default language class + highlights after DSD settles
          // Privacy-friendly analytics (GoatCounter, no cookies)
        ],
      },
      // @lessjs/content: Blog + Nav + Sitemap (unified content plugin)
      content: {
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
      },
      // @lessjs/i18n: Internationalization (locales, path helpers)
      i18n: {
        locales: ['en', 'zh'],
        defaultLocale: 'en',
      },
    }),
  ],
});
