import { lessjs } from '@lessjs/app';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { defineConfig } from 'vite';

// www/ is a pure JSR consumer - no resolve.alias needed.
// The root deno.json workspace mapping resolves jsr:@lessjs/* -> local
// packages/ during dev, and JSR tarballs in production.

// v0.20.0: migrated from lessRootColorCSS (deleted) to openPropsTokenSheet.
// v0.23.0: :host rules don't apply in global CSS context. Replace :host with
//   :root so CSS custom properties (--gray-*, --text-*, --bg-*, etc.) are
//   available to regular DOM elements outside shadow trees. Shadow DOM still
//   inherits these from :root per CSS spec.
const _rawCSS = [...openPropsTokenSheet.cssRules].map((r) => r.cssText).join('\n');
const rootCSS = _rawCSS
  .replace(/:host\s*\{/g, ':root, :host {')
  .replace(
    /:host\(\[data-theme="dark"\]\)\s*\{/g,
    'html[data-theme="dark"], :host([data-theme="dark"]) {',
  );
const darkCSS = `
[data-theme="dark"] body {
  background: #030507;
  color: #e9ecef;
}
[data-theme="dark"] ::selection {
  background: rgba(124,111,245,0.3);
  color: #f1f3f5;
}`;
const colorTokensStyle =
  `<style>${rootCSS}body{margin:0;background:var(--gray-1);color:var(--gray-9);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}${darkCSS}</style>`;

export default defineConfig({
  base: '/',
  build: {
    chunkSizeWarningLimit: 600,
  },
  // v0.24.1 (ADR-0057): Configure esbuild JSX transform to use LessJS automatic runtime.
  // Must match root deno.json compilerOptions.jsx / jsxImportSource.
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: '@lessjs/core',
  },
  plugins: [
    lessjs({
      routesDir: 'app/routes',
      islandsDir: 'app/islands',
      componentsDir: 'app/components',
      html: {
        title: 'LessJS',
      },
      packageIslands: ['@lessjs/ui', '@shoelace-style/shoelace'],
      ssr: {
        noExternal: [
          '@lessjs/ui',
          '@lessjs/adapter-react',
          '@lessjs/adapter-vanilla',
          '@shoelace-style/shoelace',
          'media-chrome',
          'react',
          'react-dom',
        ],
      },
      pwa: {
        name: 'LessJS Framework - Less is More',
        shortName: 'LessJS',
        themeColor: '#000000',
        backgroundColor: '#ffffff',
      },
      viewTransition: true,
      speculation: true,
      inject: {
        // H-05 fix: Use structured stylesheets with SRI for CDN CSS
        stylesheets: [
          {
            href: 'https://cdn.jsdelivr.net/npm/open-props@1.7.20/open-props.min.css',
            integrity: 'sha384-fsyUJwnN3qLArJUL5oaEYS3/WnhCmI4K5x+oB8wFigOMTJaIvys56ozH3+nE/qcf',
            attrs: { media: 'print', onload: "this.media='all'" },
          },
          {
            href: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css',
            integrity: 'sha384-rCCjoCPCsizaAAYVoz1Q0CmCTvnctK0JkfCSjx7IIxexTBg+uCKtFYycedUjMyA2',
            attrs: { media: 'print', onload: "this.media='all'" },
          },
        ],
        // H-04 fix: All CDN scripts now have SRI integrity hashes
        scripts: [
          { src: '/theme-init.js' },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js',
            defer: true,
            integrity: 'sha384-06z5D//U/xpvxZHuUz92xBvq3DqBBFi7Up53HRrbV7Jlv7Yvh/MZ7oenfUe9iCEt',
          },
          {
            src:
              'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js',
            defer: true,
            integrity: 'sha384-D44bgYYKvaiDh4cOGlj1dbSDpSctn2FSUj118HZGmZEShZcO2v//Q5vvhNy206pp',
          },
          {
            src:
              'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js',
            defer: true,
            integrity: 'sha384-PeOqKNW/piETaCg8rqKFy+Pm6KEk7e36/5YZE5XO/OaFdO+/Aw3O8qZ9qDPKVUgx',
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js',
            defer: true,
            integrity: 'sha384-RhrmFFMb0ZCHImjFMpR/UE3VEtIVTCtNrtKQqXCzqXZNJala02N3UbVhi+qzw3CY',
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js',
            defer: true,
            integrity: 'sha384-9WmlN8ABpoFSSHvBGGjhvB3E/D8UkNB9HpLJjBQFC2VSQsM1odiQDv4NbEo+7l15',
          },
          {
            src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-css.min.js',
            defer: true,
            integrity: 'sha384-0mV13Neu0xhJFylI+HV43C+XiR13bGSeL7D0/7e6hK7sJgvyvK6HVjeQwmvXTstY',
          },
          {
            src:
              'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js',
            defer: true,
            integrity: 'sha384-HkMr0bZB9kBW4iVtXn6nd35kO/L/dQtkkUBkL9swzTEDMdIe5ExJChVDSnC79aNA',
          },
          { src: '/prism-init.js', defer: true },
          {
            src: 'https://gc.zgo.at/count.js',
            async: true,
            integrity: 'sha384-2UjvVpptg4JlEVgJI2PdscrjOjPcil/4F1ZvIMJ81CShQnEDSlPI+l4PfogvTLYi',
            attrs: { 'data-goatcounter': 'https://lessjs.goatcounter.com/count' },
          },
        ],
        headFragments: [
          '<meta property="og:site_name" content="LessJS">',
          '<meta property="og:type" content="website">',
          '<meta property="og:title" content="LessJS - Less is More">',
          '<meta property="og:description" content="DSD-first Web Standards framework. Zero-runtime core, SSG + Island architecture, Lit Web Components, Hono API routes.">',
          '<meta property="og:url" content="https://lessjs.org">',
          '<meta property="og:image" content="https://lessjs.org/assets/og-image.svg">',
          '<meta name="twitter:card" content="summary_large_image">',
          '<meta name="description" content="LessJS - Less is More. Web Standards-first Jamstack SSG with Island architecture. Zero-runtime core, DSD rendering, Lit Web Components, Hono API routes.">',
          '<style id="less-anti-flash">html{visibility:hidden}</style>',
          '<link rel="icon" type="image/svg+xml" href="/assets/less-logo.svg" />',
          '<link rel="apple-touch-icon" href="/assets/less-logo.svg" />',
          colorTokensStyle,
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
            { href: '/guide/getting-started', label: 'Guide' },
            { href: '/api/reference', label: 'API' },
            { href: '/architecture/architecture', label: 'Architecture' },
            { href: '/registry', label: 'Hub' },
            { href: '/blog', label: 'Blog' },
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
