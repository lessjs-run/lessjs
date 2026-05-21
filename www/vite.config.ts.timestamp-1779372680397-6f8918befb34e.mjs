import 'node:module';
import { lessjs } from '@lessjs/app';
import { openPropsTokenSheet } from '@lessjs/ui/open-props-tokens';
import { defineConfig } from 'file:///C:/Users/Administrator/WorkBuddy/Claw/src-tmp/node_modules/.deno/vite@8.0.10/node_modules/vite/dist/node/index.js';
import.meta.url;
var vite_config_default = defineConfig({
  base: '/',
  build: { chunkSizeWarningLimit: 600 },
  plugins: [lessjs({
    routesDir: 'app/routes',
    islandsDir: 'app/islands',
    componentsDir: 'app/components',
    html: { title: 'LessJS' },
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
      name: 'LessJS Framework — Less is More',
      shortName: 'LessJS',
      themeColor: '#000000',
      backgroundColor: '#ffffff',
    },
    viewTransition: true,
    speculation: true,
    inject: {
      stylesheets: [{
        href: 'https://cdn.jsdelivr.net/npm/open-props@1.7.20/open-props.min.css',
        integrity: 'sha384-fsyUJwnN3qLArJUL5oaEYS3/WnhCmI4K5x+oB8wFigOMTJaIvys56ozH3+nE/qcf',
        attrs: {
          media: 'print',
          onload: "this.media='all'",
        },
      }, {
        href: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism.min.css',
        integrity: 'sha384-rCCjoCPCsizaAAYVoz1Q0CmCTvnctK0JkfCSjx7IIxexTBg+uCKtFYycedUjMyA2',
        attrs: {
          media: 'print',
          onload: "this.media='all'",
        },
      }],
      scripts: [
        { src: '/theme-init.js' },
        {
          src: '/mobile-menu.js',
          defer: true,
        },
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
          src: 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-markup.min.js',
          defer: true,
          integrity: 'sha384-HkMr0bZB9kBW4iVtXn6nd35kO/L/dQtkkUBkL9swzTEDMdIe5ExJChVDSnC79aNA',
        },
        {
          src: '/prism-init.js',
          defer: true,
        },
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
        '<meta property="og:title" content="LessJS — Less is More">',
        '<meta property="og:description" content="DSD-first Web Standards framework. Zero-runtime core, SSG + Island architecture, Lit Web Components, Hono API routes.">',
        '<meta property="og:url" content="https://lessjs.org">',
        '<meta property="og:image" content="https://lessjs.org/assets/og-image.svg">',
        '<meta name="twitter:card" content="summary_large_image">',
        '<meta name="description" content="LessJS — Less is More. Web Standards-first Jamstack SSG with Island architecture. Zero-runtime core, DSD rendering, Lit Web Components, Hono API routes.">',
        '<style id="less-anti-flash">html{visibility:hidden}</style>',
        '<link rel="icon" type="image/svg+xml" href="/assets/less-logo.svg" />',
        '<link rel="apple-touch-icon" href="/assets/less-logo.svg" />',
        `<style>${
          [...openPropsTokenSheet.cssRules].map((r) => r.cssText).join('\n')
        }body{margin:0;background:var(--gray-1);color:var(--gray-9);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
[data-theme="dark"] body {
  background: #030507;
  color: #e9ecef;
}
[data-theme="dark"] ::selection {
  background: rgba(124,111,245,0.3);
  color: #f1f3f5;
}</style>`,
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
          {
            href: '/guide/positioning',
            label: 'Framework',
          },
          {
            href: '/engine/architecture',
            label: 'Engine',
          },
          {
            href: '/registry',
            label: 'RegistryHub',
          },
          {
            href: '/blog',
            label: 'Blog',
          },
        ],
      },
      sitemap: { hostname: 'https://lessjs.org' },
    },
    i18n: {
      locales: ['en', 'zh'],
      defaultLocale: 'en',
    },
  })],
});
//#endregion
export { vite_config_default as default };

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidml0ZS5jb25maWcuanMiLCJuYW1lcyI6W10sInNvdXJjZXMiOlsiQzovVXNlcnMvQWRtaW5pc3RyYXRvci9Xb3JrQnVkZHkvQ2xhdy9zcmMtdG1wL3d3dy92aXRlLmNvbmZpZy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBsZXNzanMgfSBmcm9tICdAbGVzc2pzL2FwcCc7XG5pbXBvcnQgeyBvcGVuUHJvcHNUb2tlblNoZWV0IH0gZnJvbSAnQGxlc3Nqcy91aS9vcGVuLXByb3BzLXRva2Vucyc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcblxuLy8gd3d3LyBpcyBhIHB1cmUgSlNSIGNvbnN1bWVyIOKAlCBubyByZXNvbHZlLmFsaWFzIG5lZWRlZC5cbi8vIFRoZSByb290IGRlbm8uanNvbiB3b3Jrc3BhY2UgbWFwcGluZyByZXNvbHZlcyBqc3I6QGxlc3Nqcy8qIOKGkiBsb2NhbFxuLy8gcGFja2FnZXMvIGR1cmluZyBkZXYsIGFuZCBKU1IgdGFyYmFsbHMgaW4gcHJvZHVjdGlvbi5cblxuLy8gdjAuMjAuMDogbWlncmF0ZWQgZnJvbSBsZXNzUm9vdENvbG9yQ1NTIChkZWxldGVkKSB0byBvcGVuUHJvcHNUb2tlblNoZWV0XG5jb25zdCByb290Q1NTID0gWy4uLm9wZW5Qcm9wc1Rva2VuU2hlZXQuY3NzUnVsZXNdLm1hcCgocikgPT4gci5jc3NUZXh0KS5qb2luKCdcXG4nKTtcbmNvbnN0IGRhcmtDU1MgPSBgXG5bZGF0YS10aGVtZT1cImRhcmtcIl0gYm9keSB7XG4gIGJhY2tncm91bmQ6ICMwMzA1MDc7XG4gIGNvbG9yOiAjZTllY2VmO1xufVxuW2RhdGEtdGhlbWU9XCJkYXJrXCJdIDo6c2VsZWN0aW9uIHtcbiAgYmFja2dyb3VuZDogcmdiYSgxMjQsMTExLDI0NSwwLjMpO1xuICBjb2xvcjogI2YxZjNmNTtcbn1gO1xuY29uc3QgY29sb3JUb2tlbnNTdHlsZSA9XG4gIGA8c3R5bGU+JHtyb290Q1NTfWJvZHl7bWFyZ2luOjA7YmFja2dyb3VuZDp2YXIoLS1ncmF5LTEpO2NvbG9yOnZhcigtLWdyYXktOSk7Zm9udC1mYW1pbHk6LWFwcGxlLXN5c3RlbSxCbGlua01hY1N5c3RlbUZvbnQsXCJTZWdvZSBVSVwiLFJvYm90byxcIkhlbHZldGljYSBOZXVlXCIsQXJpYWwsc2Fucy1zZXJpZjstd2Via2l0LWZvbnQtc21vb3RoaW5nOmFudGlhbGlhc2VkOy1tb3otb3N4LWZvbnQtc21vb3RoaW5nOmdyYXlzY2FsZX0ke2RhcmtDU1N9PC9zdHlsZT5gO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBiYXNlOiAnLycsXG4gIGJ1aWxkOiB7XG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiA2MDAsXG4gIH0sXG4gIHBsdWdpbnM6IFtcbiAgICBsZXNzanMoe1xuICAgICAgcm91dGVzRGlyOiAnYXBwL3JvdXRlcycsXG4gICAgICBpc2xhbmRzRGlyOiAnYXBwL2lzbGFuZHMnLFxuICAgICAgY29tcG9uZW50c0RpcjogJ2FwcC9jb21wb25lbnRzJyxcbiAgICAgIGh0bWw6IHtcbiAgICAgICAgdGl0bGU6ICdMZXNzSlMnLFxuICAgICAgfSxcbiAgICAgIHBhY2thZ2VJc2xhbmRzOiBbJ0BsZXNzanMvdWknLCAnQHNob2VsYWNlLXN0eWxlL3Nob2VsYWNlJ10sXG4gICAgICBzc3I6IHtcbiAgICAgICAgbm9FeHRlcm5hbDogW1xuICAgICAgICAgICdAbGVzc2pzL3VpJyxcbiAgICAgICAgICAnQGxlc3Nqcy9hZGFwdGVyLXJlYWN0JyxcbiAgICAgICAgICAnQGxlc3Nqcy9hZGFwdGVyLXZhbmlsbGEnLFxuICAgICAgICAgICdAc2hvZWxhY2Utc3R5bGUvc2hvZWxhY2UnLFxuICAgICAgICAgICdtZWRpYS1jaHJvbWUnLFxuICAgICAgICAgICdyZWFjdCcsXG4gICAgICAgICAgJ3JlYWN0LWRvbScsXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgcHdhOiB7XG4gICAgICAgIG5hbWU6ICdMZXNzSlMgRnJhbWV3b3JrIOKAlCBMZXNzIGlzIE1vcmUnLFxuICAgICAgICBzaG9ydE5hbWU6ICdMZXNzSlMnLFxuICAgICAgICB0aGVtZUNvbG9yOiAnIzAwMDAwMCcsXG4gICAgICAgIGJhY2tncm91bmRDb2xvcjogJyNmZmZmZmYnLFxuICAgICAgfSxcbiAgICAgIHZpZXdUcmFuc2l0aW9uOiB0cnVlLFxuICAgICAgc3BlY3VsYXRpb246IHRydWUsXG4gICAgICBpbmplY3Q6IHtcbiAgICAgICAgLy8gSC0wNSBmaXg6IFVzZSBzdHJ1Y3R1cmVkIHN0eWxlc2hlZXRzIHdpdGggU1JJIGZvciBDRE4gQ1NTXG4gICAgICAgIHN0eWxlc2hlZXRzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaHJlZjogJ2h0dHBzOi8vY2RuLmpzZGVsaXZyLm5ldC9ucG0vb3Blbi1wcm9wc0AxLjcuMjAvb3Blbi1wcm9wcy5taW4uY3NzJyxcbiAgICAgICAgICAgIGludGVncml0eTogJ3NoYTM4NC1mc3lVSnduTjNxTEFySlVMNW9hRVlTMy9XbmhDbUk0SzV4K29COHdGaWdPTVRKYUl2eXM1Nm96SDMrbkUvcWNmJyxcbiAgICAgICAgICAgIGF0dHJzOiB7IG1lZGlhOiAncHJpbnQnLCBvbmxvYWQ6IFwidGhpcy5tZWRpYT0nYWxsJ1wiIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBocmVmOiAnaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcHJpc20vMS4yOS4wL3RoZW1lcy9wcmlzbS5taW4uY3NzJyxcbiAgICAgICAgICAgIGludGVncml0eTogJ3NoYTM4NC1yQ0Nqb0NQQ3NpemFBQVlWb3oxUTBDbUNUdm5jdEswSmtmQ1NqeDdJSXhleFRCZyt1Q0t0Rll5Y2VkVWpNeUEyJyxcbiAgICAgICAgICAgIGF0dHJzOiB7IG1lZGlhOiAncHJpbnQnLCBvbmxvYWQ6IFwidGhpcy5tZWRpYT0nYWxsJ1wiIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgLy8gSC0wNCBmaXg6IEFsbCBDRE4gc2NyaXB0cyBub3cgaGF2ZSBTUkkgaW50ZWdyaXR5IGhhc2hlc1xuICAgICAgICBzY3JpcHRzOiBbXG4gICAgICAgICAgeyBzcmM6ICcvdGhlbWUtaW5pdC5qcycgfSxcbiAgICAgICAgICB7IHNyYzogJy9tb2JpbGUtbWVudS5qcycsIGRlZmVyOiB0cnVlIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcHJpc20vMS4yOS4wL3ByaXNtLm1pbi5qcycsXG4gICAgICAgICAgICBkZWZlcjogdHJ1ZSxcbiAgICAgICAgICAgIGludGVncml0eTogJ3NoYTM4NC0wNno1RC8vVS94cHZ4Wkh1VXo5MnhCdnEzRHFCQkZpN1VwNTNIUnJiVjdKbHY3WXZoL01aN29lbmZVZTlpQ0V0JyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzpcbiAgICAgICAgICAgICAgJ2h0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3ByaXNtLzEuMjkuMC9jb21wb25lbnRzL3ByaXNtLWphdmFzY3JpcHQubWluLmpzJyxcbiAgICAgICAgICAgIGRlZmVyOiB0cnVlLFxuICAgICAgICAgICAgaW50ZWdyaXR5OiAnc2hhMzg0LUQ0NGJnWVlLdmFpRGg0Y09HbGoxZGJTRHBTY3RuMkZTVWoxMThIWkdtWkVTaFpjTzJ2Ly9RNXZ2aE55MjA2cHAnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOlxuICAgICAgICAgICAgICAnaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcHJpc20vMS4yOS4wL2NvbXBvbmVudHMvcHJpc20tdHlwZXNjcmlwdC5taW4uanMnLFxuICAgICAgICAgICAgZGVmZXI6IHRydWUsXG4gICAgICAgICAgICBpbnRlZ3JpdHk6ICdzaGEzODQtUGVPcUtOVy9waUVUYUNnOHJxS0Z5K1BtNktFazdlMzYvNVlaRTVYTy9PYUZkTysvQXczTzhxWjlxRFBLVlVneCcsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2NkbmpzLmNsb3VkZmxhcmUuY29tL2FqYXgvbGlicy9wcmlzbS8xLjI5LjAvY29tcG9uZW50cy9wcmlzbS1qc29uLm1pbi5qcycsXG4gICAgICAgICAgICBkZWZlcjogdHJ1ZSxcbiAgICAgICAgICAgIGludGVncml0eTogJ3NoYTM4NC1SaHJtRkZNYjBaQ0hJbWpGTXBSL1VFM1ZFdElWVEN0TnJ0S1FxWEN6cVhaTkphbGEwMk4zVWJWaGkrcXp3M0NZJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzogJ2h0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3ByaXNtLzEuMjkuMC9jb21wb25lbnRzL3ByaXNtLWJhc2gubWluLmpzJyxcbiAgICAgICAgICAgIGRlZmVyOiB0cnVlLFxuICAgICAgICAgICAgaW50ZWdyaXR5OiAnc2hhMzg0LTlXbWxOOEFCcG9GU1NIdkJHR2podkIzRS9EOFVrTkI5SHBMSmpCUUZDMlZTUXNNMW9kaVFEdjROYkVvKzdsMTUnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3JjOiAnaHR0cHM6Ly9jZG5qcy5jbG91ZGZsYXJlLmNvbS9hamF4L2xpYnMvcHJpc20vMS4yOS4wL2NvbXBvbmVudHMvcHJpc20tY3NzLm1pbi5qcycsXG4gICAgICAgICAgICBkZWZlcjogdHJ1ZSxcbiAgICAgICAgICAgIGludGVncml0eTogJ3NoYTM4NC0wbVYxM05ldTB4aEpGeWxJK0hWNDNDK1hpUjEzYkdTZUw3RDAvN2U2aEs3c0pndnl2SzZIVmplUXdtdlhUc3RZJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHNyYzpcbiAgICAgICAgICAgICAgJ2h0dHBzOi8vY2RuanMuY2xvdWRmbGFyZS5jb20vYWpheC9saWJzL3ByaXNtLzEuMjkuMC9jb21wb25lbnRzL3ByaXNtLW1hcmt1cC5taW4uanMnLFxuICAgICAgICAgICAgZGVmZXI6IHRydWUsXG4gICAgICAgICAgICBpbnRlZ3JpdHk6ICdzaGEzODQtSGtNcjBiWkI5a0JXNGlWdFhuNm5kMzVrTy9ML2RRdGtrVUJrTDlzd3pURURNZEllNUV4SkNoVkRTbkM3OWFOQScsXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7IHNyYzogJy9wcmlzbS1pbml0LmpzJywgZGVmZXI6IHRydWUgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzcmM6ICdodHRwczovL2djLnpnby5hdC9jb3VudC5qcycsXG4gICAgICAgICAgICBhc3luYzogdHJ1ZSxcbiAgICAgICAgICAgIGludGVncml0eTogJ3NoYTM4NC0yVWp2VnBwdGc0SmxFVmdKSTJQZHNjcmpPalBjaWwvNEYxWnZJTUo4MUNTaFFuRURTbFBJK2w0UGZvZ3ZUTFlpJyxcbiAgICAgICAgICAgIGF0dHJzOiB7ICdkYXRhLWdvYXRjb3VudGVyJzogJ2h0dHBzOi8vbGVzc2pzLmdvYXRjb3VudGVyLmNvbS9jb3VudCcgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICBoZWFkRnJhZ21lbnRzOiBbXG4gICAgICAgICAgJzxtZXRhIHByb3BlcnR5PVwib2c6c2l0ZV9uYW1lXCIgY29udGVudD1cIkxlc3NKU1wiPicsXG4gICAgICAgICAgJzxtZXRhIHByb3BlcnR5PVwib2c6dHlwZVwiIGNvbnRlbnQ9XCJ3ZWJzaXRlXCI+JyxcbiAgICAgICAgICAnPG1ldGEgcHJvcGVydHk9XCJvZzp0aXRsZVwiIGNvbnRlbnQ9XCJMZXNzSlMg4oCUIExlc3MgaXMgTW9yZVwiPicsXG4gICAgICAgICAgJzxtZXRhIHByb3BlcnR5PVwib2c6ZGVzY3JpcHRpb25cIiBjb250ZW50PVwiRFNELWZpcnN0IFdlYiBTdGFuZGFyZHMgZnJhbWV3b3JrLiBaZXJvLXJ1bnRpbWUgY29yZSwgU1NHICsgSXNsYW5kIGFyY2hpdGVjdHVyZSwgTGl0IFdlYiBDb21wb25lbnRzLCBIb25vIEFQSSByb3V0ZXMuXCI+JyxcbiAgICAgICAgICAnPG1ldGEgcHJvcGVydHk9XCJvZzp1cmxcIiBjb250ZW50PVwiaHR0cHM6Ly9sZXNzanMub3JnXCI+JyxcbiAgICAgICAgICAnPG1ldGEgcHJvcGVydHk9XCJvZzppbWFnZVwiIGNvbnRlbnQ9XCJodHRwczovL2xlc3Nqcy5vcmcvYXNzZXRzL29nLWltYWdlLnN2Z1wiPicsXG4gICAgICAgICAgJzxtZXRhIG5hbWU9XCJ0d2l0dGVyOmNhcmRcIiBjb250ZW50PVwic3VtbWFyeV9sYXJnZV9pbWFnZVwiPicsXG4gICAgICAgICAgJzxtZXRhIG5hbWU9XCJkZXNjcmlwdGlvblwiIGNvbnRlbnQ9XCJMZXNzSlMg4oCUIExlc3MgaXMgTW9yZS4gV2ViIFN0YW5kYXJkcy1maXJzdCBKYW1zdGFjayBTU0cgd2l0aCBJc2xhbmQgYXJjaGl0ZWN0dXJlLiBaZXJvLXJ1bnRpbWUgY29yZSwgRFNEIHJlbmRlcmluZywgTGl0IFdlYiBDb21wb25lbnRzLCBIb25vIEFQSSByb3V0ZXMuXCI+JyxcbiAgICAgICAgICAnPHN0eWxlIGlkPVwibGVzcy1hbnRpLWZsYXNoXCI+aHRtbHt2aXNpYmlsaXR5OmhpZGRlbn08L3N0eWxlPicsXG4gICAgICAgICAgJzxsaW5rIHJlbD1cImljb25cIiB0eXBlPVwiaW1hZ2Uvc3ZnK3htbFwiIGhyZWY9XCIvYXNzZXRzL2xlc3MtbG9nby5zdmdcIiAvPicsXG4gICAgICAgICAgJzxsaW5rIHJlbD1cImFwcGxlLXRvdWNoLWljb25cIiBocmVmPVwiL2Fzc2V0cy9sZXNzLWxvZ28uc3ZnXCIgLz4nLFxuICAgICAgICAgIGNvbG9yVG9rZW5zU3R5bGUsXG4gICAgICAgIF0sXG4gICAgICB9LFxuICAgICAgY29udGVudDoge1xuICAgICAgICBibG9nOiB7XG4gICAgICAgICAgY29udGVudERpcjogJ2NvbnRlbnQvYmxvZycsXG4gICAgICAgICAgYmFzZVBhdGg6ICcvYmxvZycsXG4gICAgICAgIH0sXG4gICAgICAgIG5hdjoge1xuICAgICAgICAgIHJvdXRlc0RpcjogJ2FwcC9yb3V0ZXMnLFxuICAgICAgICAgIGhlYWRlck5hdjogW1xuICAgICAgICAgICAgeyBocmVmOiAnL2d1aWRlL3Bvc2l0aW9uaW5nJywgbGFiZWw6ICdGcmFtZXdvcmsnIH0sXG4gICAgICAgICAgICB7IGhyZWY6ICcvZW5naW5lL2FyY2hpdGVjdHVyZScsIGxhYmVsOiAnRW5naW5lJyB9LFxuICAgICAgICAgICAgeyBocmVmOiAnL3JlZ2lzdHJ5JywgbGFiZWw6ICdSZWdpc3RyeUh1YicgfSxcbiAgICAgICAgICAgIHsgaHJlZjogJy9ibG9nJywgbGFiZWw6ICdCbG9nJyB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHNpdGVtYXA6IHtcbiAgICAgICAgICBob3N0bmFtZTogJ2h0dHBzOi8vbGVzc2pzLm9yZycsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgaTE4bjoge1xuICAgICAgICBsb2NhbGVzOiBbJ2VuJywgJ3poJ10sXG4gICAgICAgIGRlZmF1bHRMb2NhbGU6ICdlbicsXG4gICAgICB9LFxuICAgIH0pLFxuICBdLFxufSk7XG4iXSwibWFwcGluZ3MiOiI7Ozs7O0FBc0JBLElBQUEsc0JBQWUsYUFBYTtDQUMxQixNQUFNO0NBQ04sT0FBTyxFQUNMLHVCQUF1QixLQUN4QjtDQUNELFNBQVMsQ0FDUCxPQUFPO0VBQ0wsV0FBVztFQUNYLFlBQVk7RUFDWixlQUFlO0VBQ2YsTUFBTSxFQUNKLE9BQU8sVUFDUjtFQUNELGdCQUFnQixDQUFDLGNBQWMsMkJBQTJCO0VBQzFELEtBQUssRUFDSCxZQUFZO0dBQ1Y7R0FDQTtHQUNBO0dBQ0E7R0FDQTtHQUNBO0dBQ0E7R0FDRCxFQUNGO0VBQ0QsS0FBSztHQUNILE1BQU07R0FDTixXQUFXO0dBQ1gsWUFBWTtHQUNaLGlCQUFpQjtHQUNsQjtFQUNELGdCQUFnQjtFQUNoQixhQUFhO0VBQ2IsUUFBUTtHQUVOLGFBQWEsQ0FDWDtJQUNFLE1BQU07SUFDTixXQUFXO0lBQ1gsT0FBTztLQUFFLE9BQU87S0FBUyxRQUFRO0tBQW9CO0lBQ3RELEVBQ0Q7SUFDRSxNQUFNO0lBQ04sV0FBVztJQUNYLE9BQU87S0FBRSxPQUFPO0tBQVMsUUFBUTtLQUFvQjtJQUN0RCxDQUNGO0dBRUQsU0FBUztJQUNQLEVBQUUsS0FBSyxrQkFBa0I7SUFDekI7S0FBRSxLQUFLO0tBQW1CLE9BQU87S0FBTTtJQUN2QztLQUNFLEtBQUs7S0FDTCxPQUFPO0tBQ1AsV0FBVztLQUNaO0lBQ0Q7S0FDRSxLQUNFO0tBQ0YsT0FBTztLQUNQLFdBQVc7S0FDWjtJQUNEO0tBQ0UsS0FDRTtLQUNGLE9BQU87S0FDUCxXQUFXO0tBQ1o7SUFDRDtLQUNFLEtBQUs7S0FDTCxPQUFPO0tBQ1AsV0FBVztLQUNaO0lBQ0Q7S0FDRSxLQUFLO0tBQ0wsT0FBTztLQUNQLFdBQVc7S0FDWjtJQUNEO0tBQ0UsS0FBSztLQUNMLE9BQU87S0FDUCxXQUFXO0tBQ1o7SUFDRDtLQUNFLEtBQ0U7S0FDRixPQUFPO0tBQ1AsV0FBVztLQUNaO0lBQ0Q7S0FBRSxLQUFLO0tBQWtCLE9BQU87S0FBTTtJQUN0QztLQUNFLEtBQUs7S0FDTCxPQUFPO0tBQ1AsV0FBVztLQUNYLE9BQU8sRUFBRSxvQkFBb0Isd0NBQXdDO0tBQ3RFO0lBQ0Y7R0FDRCxlQUFlO0lBQ2I7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBQ0E7SUFDQTtJQUNBLFVBMUhNLENBQUMsR0FBRyxvQkFBb0IsU0FBUyxDQUFDLEtBQUssTUFBTSxFQUFFLFFBQVEsQ0FBQyxLQUFLLEtBV2pFLENBQVE7Ozs7Ozs7OztJQWdIWDtHQUNGO0VBQ0QsU0FBUztHQUNQLE1BQU07SUFDSixZQUFZO0lBQ1osVUFBVTtJQUNYO0dBQ0QsS0FBSztJQUNILFdBQVc7SUFDWCxXQUFXO0tBQ1Q7TUFBRSxNQUFNO01BQXNCLE9BQU87TUFBYTtLQUNsRDtNQUFFLE1BQU07TUFBd0IsT0FBTztNQUFVO0tBQ2pEO01BQUUsTUFBTTtNQUFhLE9BQU87TUFBZTtLQUMzQztNQUFFLE1BQU07TUFBUyxPQUFPO01BQVE7S0FDakM7SUFDRjtHQUNELFNBQVMsRUFDUCxVQUFVLHNCQUNYO0dBQ0Y7RUFDRCxNQUFNO0dBQ0osU0FBUyxDQUFDLE1BQU0sS0FBSztHQUNyQixlQUFlO0dBQ2hCO0VBQ0YsQ0FBQyxDQUNIO0NBQ0YsQ0FBQyJ9
