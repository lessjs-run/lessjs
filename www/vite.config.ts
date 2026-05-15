import { lessjs } from '@lessjs/app';
import { lessRootColorCSS } from '@lessjs/ui/tokens/colors';
import { defineConfig } from 'vite';

// www/ is a pure JSR consumer — no resolve.alias needed.
// The root deno.json workspace mapping resolves jsr:@lessjs/* → local
// packages/ during dev, and JSR tarballs in production.

const colorTokensStyle =
  `<style>${lessRootColorCSS}body{margin:0;background:var(--less-bg-base);color:var(--less-text-primary);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}</style>`;

export default defineConfig({
  base: '/',
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
      packageIslands: ['@lessjs/ui'],
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
          { src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js', defer: true },
          {
            src:
              'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js',
            defer: true,
          },
          {
            src:
              'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js',
            defer: true,
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js',
            defer: true,
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js',
            defer: true,
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js',
            defer: true,
          },
          {
            src:
              'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js',
            defer: true,
          },
          { src: '/prism-init.js', defer: true },
          {
            src: 'https://gc.zgo.at/count.js',
            async: true,
            attrs: { 'data-goatcounter': 'https://lessjs.goatcounter.com/count' },
          },
        ],
        headFragments: [
          '<meta property="og:site_name" content="LessJS">',
          '<meta property="og:type" content="website">',
          '<meta property="og:title" content="LessJS — Less is More">',
          '<meta property="og:description" content="DSD-first Web Standards framework. Zero-runtime core, SSG + Island architecture, Lit Web Components, Hono API routes.">',
          '<meta property="og:url" content="https://lessjs.org">',
          '<meta property="og:image" content="https://lessjs.org/assets/og-image.svg">',
          '<meta name="twitter:card" content="summary_large_image">',
          '<meta name="description" content="LessJS — Less is More. Web Standards-first Jamstack SSG with Island architecture. Zero-runtime core, DSD rendering, Lit Web Components, Hono API routes.">',
          '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/open-props@1.7.20/open-props.min.css" media="print" onload="this.media=\'all\'">',
          '<style id="less-anti-flash">html{visibility:hidden}</style>',
          '<link rel="icon" type="image/svg+xml" href="/assets/less-logo.svg" />',
          '<link rel="apple-touch-icon" href="/assets/less-logo.svg" />',
          colorTokensStyle,
          '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css" media="print" onload="this.media=\'all\'">',
        ],
      },
      content: {
        blog: {
          contentDir: 'content/blog',
          basePath: '/blog',
        },
        nav: {
          routesDir: 'app/routes',
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
      i18n: {
        locales: ['en', 'zh'],
        defaultLocale: 'en',
      },
    }),
  ],
});
