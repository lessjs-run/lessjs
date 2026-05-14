# LessJS v0.14.1

> 5 commits since v0.14 (a04a7e5 → c50424b), 73 files changed

## Bug Fixes

- **Blank page on first load**: inject.scripts (theme-init.js) was emitted before inject.headFragments (anti-flash cloak). When theme-init.js ran to remove the cloak, the `<style id="less-anti-flash">` element didn't exist in the DOM yet. The anti-flash style was applied after theme-init.js ran and never removed, leaving the page `visibility: hidden` permanently. Fixed by swapping output order: headFragments first, scripts second.
- **Speculation Rules parsing error**: Home page rule had both `where: {}` (document matcher) and `source: 'list'` + `urls: ['/']` (list matcher), which the Speculation Rules API forbids. Split into separate rule shapes.
- **prism-html.min.js 404**: Prism has no `prism-html` component. HTML syntax highlighting uses `prism-markup`. Fixed CDN URL.
- **GoatCounter URL**: Changed protocol-relative URL (`//gc.zgo.at/count.js`) to full HTTPS (`https://gc.zgo.at/count.js`).
- **Service Worker**: Only intercepts same-origin requests now (cross-origin CDN/analytics pass through). `networkFirst` returns a 503 fallback instead of throwing when offline.

## Infrastructure

- **CI workflows**: Updated lint/test/deploy workflows with better caching and error handling.
- **E2E tests**: Playwright config and test helpers updated for mobile viewport testing.
- **Color tokens**: Gray scale values inlined in `generateRootColorCSS()` so they resolve immediately without waiting for OpenProps CDN.

## Website

- **404 page**: Fixed mobile responsive.
- **Blog posts**: Updated old posts referencing deprecated packages.
- **Changelog**: Updated router for better mobile layout.
- **less-term island**: CSS reformatting only (no functional change).
- **Guides**: Fixed outdated references in architecture, getting-started, and RPC pages.
