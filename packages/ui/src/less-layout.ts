/**
 * @lessjs/ui - less-layout
 *
 * App layout component with header, sidebar, and footer.
 * Swiss International Style: Pure B&W, minimal.
 *
 * v0.20.0: Migrated from DsdLitElement to DsdElement (Ocean component).
 *   - CSSStyleSheet replaces Lit css\`\`
 *   - render() returns string
 *   - @click bindings for mobile menu toggle
 *   - SPA navigation via Navigation API (navigate/fetch/swap) preserved
 *   - Event delegation at shadow root level for nav clicks
 *
 * @csspart container - The app-layout root div
 * @csspart header - The sticky header element
 * @csspart sidebar - The docs-sidebar nav
 * @csspart main - The layout-main element
 * @csspart footer - The app-footer element
 * @csspart nav - The header-nav element
 * @csspart nav-toggle - The mobile menu toggle button
 *
 * Usage:
 * ```html
 * <less-layout current-path="/guide/getting-started"
 *   nav-items='[{"section":"Guide","items":[{"path":"/guide/getting-started","label":"Getting Started"}]}]'>
 * </less-layout>
 * ```
 */

import {
  DsdElement,
  html,
  StyleSheet,
  type StyleSheetLike,
  type TemplateResult,
  unsafeHTML,
} from '@lessjs/core';
import { navigate, onNavigate } from '@lessjs/core/navigation';
import { openPropsTokenSheet } from './open-props-tokens.js';
import './less-theme-toggle.js';

export const tagName = 'less-layout';

export interface NavItem {
  path?: string;
  href?: string;
  label: string;
}

export interface NavSection {
  section: string;
  items: NavItem[];
}

export interface HeaderNavLink {
  href: string;
  label: string;
}

const sheet: StyleSheetLike = new StyleSheet();
sheet.replaceSync(`
  :host {
    display: block;
  }

  .app-layout {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--gray-0);
    color: var(--gray-9);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .layout-body {
    display: flex;
    flex: 1;
    max-width: 1400px;
    margin: 0 auto;
  }

  .layout-main {
    flex: 1;
    min-width: 0;
    width: 100%;
  }

  .app-layout[home] .layout-body {
    display: flex;
    flex-direction: column;
  }

  .app-layout[home] .layout-main {
    flex: 1;
  }

  .app-header {
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(255, 255, 255, 0.82);
    backdrop-filter: blur(16px) saturate(180%);
    -webkit-backdrop-filter: blur(16px) saturate(180%);
    border-bottom: var(--border-size-1) solid var(--gray-3);
  }

  :host([data-theme="dark"]) .app-header {
    background: rgba(3, 5, 7, 0.85);
    border-bottom-color: var(--gray-3);
  }

  .header-inner {
    max-width: 1400px;
    margin: 0 auto;
    padding: 0 64px;
    display: flex;
    align-items: center;
    height: 56px;
    gap: 24px;
  }

  .mobile-menu {
    display: none;
  }

  .mobile-tab-bar {
    display: none;
  }

  .mobile-menu-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    background: transparent;
    color: var(--gray-6);
    cursor: pointer;
    padding: 0;
    list-style: none;
    transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
  }

  .mobile-menu-btn::-webkit-details-marker { display: none; }
  .mobile-menu-btn::marker { content: ""; }

  .mobile-menu-btn:hover, .mobile-menu-btn:focus-visible {
    color: var(--gray-9);
    border-color: var(--gray-5);
    background: rgba(83,74,183,0.06);
  }

  .mobile-menu[open] .mobile-menu-btn {
    color: var(--gray-9);
    background: rgba(83,74,183,0.06);
    border-color: var(--gray-5);
  }

  .logo {
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-7);
    color: var(--gray-9);
    text-decoration: none;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    transition: opacity 0.2s ease;
    white-space: nowrap;
  }

  .logo:hover { opacity: 0.6; }

  .logo-sub {
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-4);
    color: var(--gray-5);
    margin-left: var(--size-2);
    letter-spacing: 0.02em;
    text-transform: none;
  }

  .header-nav {
    display: flex;
    gap: 0.125rem;
    flex: 1;
  }

  .header-nav a {
    color: var(--gray-6);
    text-decoration: none;
    font-size: var(--font-size-0);
    font-weight: var(--font-weight-5);
    padding: var(--size-2) var(--size-3);
    letter-spacing: 0.02em;
    transition: color 0.2s ease;
    border-radius: var(--radius-2);
  }

  .header-nav a:hover {
    color: var(--gray-9);
    text-decoration: underline;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--size-2);
    margin-left: auto;
  }

  .github-link {
    display: inline-flex;
    align-items: center;
    gap: var(--size-2);
    color: var(--gray-5);
    text-decoration: none;
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-5);
    letter-spacing: 0.02em;
    padding: var(--size-2) var(--size-3);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .github-link:hover {
    color: var(--gray-7);
    border-color: var(--gray-5);
  }

  .github-link svg { flex-shrink: 0; }

  .lang-switch {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
    height: 24px;
    padding: 0 var(--size-2);
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-5);
    color: var(--gray-5);
    border: var(--border-size-1) solid var(--gray-3);
    border-radius: var(--radius-2);
    background: transparent;
    cursor: pointer;
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: color 0.2s ease, border-color 0.2s ease;
  }

  .lang-switch:hover {
    color: var(--gray-7);
    border-color: var(--gray-5);
  }

  .docs-sidebar {
    width: clamp(200px, 20vw, 280px);
    flex-shrink: 0;
    border-right: var(--border-size-1) solid var(--gray-3);
    padding: var(--size-6) 0;
    overflow-y: auto;
    height: calc(100vh - 56px);
    position: sticky;
    top: 56px;
    scrollbar-width: thin;
  }

  :host([home]) .docs-sidebar {
    width: 0;
    min-width: 0;
    padding: 0;
    overflow: hidden;
    border-right: none;
  }

  .nav-section {
    margin-bottom: var(--size-5);
  }

  .nav-section summary {
    font-size: var(--font-size-00);
    font-weight: var(--font-weight-7);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--gray-5);
    padding: 0 var(--size-5);
    margin-bottom: var(--size-2);
    cursor: pointer;
    list-style: none;
    display: flex;
    align-items: center;
    gap: var(--size-2);
    user-select: none;
  }

  .nav-section summary::-webkit-details-marker { display: none; }
  .nav-section summary::marker { content: ""; }

  .nav-section summary::before {
    content: ";
    font-size: 0.5rem;
    transition: transform 0.2s ease;
    display: inline-block;
  }

  .nav-section[open] summary::before { transform: rotate(0deg); }
  .nav-section:not([open]) summary::before { transform: rotate(-90deg); }
  .nav-section summary:hover { color: var(--gray-6); }

  .docs-sidebar a {
    display: block;
    color: var(--gray-6);
    text-decoration: none;
    font-size: var(--font-size-0);
    padding: 0.3rem var(--size-5);
    transition: color 0.2s ease, background 0.2s ease;
    border-left: 1px solid transparent;
  }

  .docs-sidebar a:hover {
    color: var(--gray-9);
    background: rgba(83,74,183,0.06);
  }

  .docs-sidebar a.active,
  .docs-sidebar a[aria-current="page"] {
    color: var(--gray-9);
    border-left-color: var(--gray-9);
    background: rgba(83,74,183,0.06);
    font-weight: var(--font-weight-5);
  }

  .mobile-backdrop {
    position: fixed;
    inset: 0;
    top: 56px;
    background: linear-gradient(to right, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.25) 100%);
    z-index: 80;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s ease;
  }

  @media (max-width: 900px) {
    .mobile-menu { display: block; }
    .header-inner { padding: 0 var(--size-4); gap: var(--size-3); }
    .header-nav { display: none; }
    .github-text { display: none; }
    .header-right { gap: var(--size-2); }

    .docs-sidebar {
      position: fixed;
      top: 56px;
      left: 0;
      width: min(300px, 80vw);
      height: calc(100vh - 56px);
      z-index: 90;
      background: var(--gray-0);
      border-right: var(--border-size-1) solid var(--gray-3);
      border-bottom: none;
      padding: var(--size-4) 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      transform: translateX(-101%);
      transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      will-change: transform;
      box-shadow: none;
    }

    :host([home]) .docs-sidebar {
      width: min(300px, 80vw);
      min-width: auto;
      padding: var(--size-4) 0;
      border-right: var(--border-size-1) solid var(--gray-3);
      transform: translateX(-101%);
      pointer-events: none;
      visibility: hidden;
    }

    :host([menu-open]) .docs-sidebar {
      transform: translateX(0);
      box-shadow: 4px 0 24px rgba(0, 0, 0, 0.3);
    }

    :host([home][menu-open]) .docs-sidebar { transform: translateX(-101%); }
    :host([home]) .mobile-menu { display: none; }
    :host([home]) .mobile-backdrop { display: none; }

    :host([menu-open]) .mobile-backdrop { opacity: 1; pointer-events: auto; }

    .nav-section { margin-bottom: var(--size-2); }
    .nav-section summary { padding: var(--size-2) var(--size-4); font-size: var(--font-size-00); }
    .docs-sidebar a { padding: var(--size-2) var(--size-4) var(--size-2) var(--size-7); font-size: var(--font-size-0); }
    .layout-main { width: 100%; }

    .app-footer { padding: var(--size-6) var(--size-4); padding-bottom: calc(var(--size-6) + 56px); }
    .app-footer .divider { display: none; }
    .app-footer p { line-height: 1.8; }

    .mobile-tab-bar {
      display: flex;
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      height: 56px;
      z-index: 100;
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(16px) saturate(180%);
      -webkit-backdrop-filter: blur(16px) saturate(180%);
      border-top: var(--border-size-1) solid var(--gray-3);
      padding: 0 env(safe-area-inset-right) 0 env(safe-area-inset-left);
      padding-bottom: env(safe-area-inset-bottom);
    }

    :host([data-theme="dark"]) .mobile-tab-bar {
      background: rgba(3, 5, 7, 0.88);
      border-top-color: var(--gray-3);
    }

    .tab-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      color: var(--gray-5);
      text-decoration: none;
      font-size: 10px;
      font-weight: var(--font-weight-5);
      letter-spacing: 0.02em;
      transition: color 0.2s ease;
      -webkit-tap-highlight-color: transparent;
      padding: 4px 0;
    }

    .tab-item svg { width: 20px; height: 20px; flex-shrink: 0; }
    .tab-item:hover, .tab-item:focus-visible { color: var(--gray-9); }
    .tab-item.active { color: var(--gray-9); }
    .tab-item.active svg { stroke-width: 2; }
  }

  @media (max-width: 640px) {
    .header-right { gap: var(--size-1); }
    .lang-switch { display: none; }
    ::slotted([slot="header-actions"]) .search-trigger span,
    ::slotted([slot="header-actions"]) .search-trigger kbd { display: none; }
  }

  @media (max-width: 480px) {
    .logo-sub { display: none; }
    .github-link { padding: var(--size-2); border: none; }
    .github-link .github-text { display: none; }
    .header-inner { padding: 0 var(--size-3); gap: var(--size-2); }
    .header-right { gap: 2px; }
    .mobile-menu-btn { width: 28px; height: 28px; }
  }

  .app-footer {
    padding: 64px;
    border-top: var(--border-size-1) solid var(--gray-3);
    text-align: center;
    color: var(--gray-5);
    font-size: var(--font-size-00);
    letter-spacing: 0.02em;
    background: var(--gray-0);
  }

  .app-footer p { margin: 0.25rem 0; }
  .app-footer a { color: var(--gray-6); transition: color 0.2s ease; }
  .app-footer a:hover { color: var(--gray-9); text-decoration: underline; }

  .app-footer .divider {
    display: inline-block;
    width: 1px;
    height: 8px;
    background: var(--gray-5);
    vertical-align: middle;
    margin: 0 var(--size-3);
  }
`);

export class LessLayout extends DsdElement {
  static override styles = [openPropsTokenSheet, sheet];
  static override observedAttributes = [
    'current-path',
    'nav-items',
    'header-nav',
    'logo-text',
    'logo-sub',
    'github-url',
    'edit-url',
    'locale',
    'locales',
  ];

  private _navCleanup?: () => void;
  private _navUnlisten?: () => void;
  private _themeHandler?: (e: Event) => void;

  override render(): string | TemplateResult {
    return this._renderLayout();
  }

  private _getStr(attr: string, def: string): string {
    // JS property first (set by injectProps in SSR), then HTML attribute
    const camel = attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const prop = (this as Record<string, unknown>)[camel];
    if (prop !== undefined && prop !== null) return String(prop);
    return this.getAttribute(attr) || def;
  }

  private _getBool(attr: string): boolean {
    // JS property first (set by injectProps in SSR), then HTML attribute
    const camel = attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    const prop = (this as Record<string, unknown>)[camel];
    if (typeof prop === 'boolean') return prop;
    return this.hasAttribute(attr);
  }

  private _currentPath(): string {
    // JS property first (set by injectProps in SSR), then HTML attributes
    let cp = (this as Record<string, unknown>).currentPath as string | undefined;
    if (!cp) cp = this.getAttribute('current-path') || this.getAttribute('currentpath') || '';
    return cp;
  }

  private _navItems(): NavSection[] {
    try {
      // JS property first (set by injectProps in SSR), then HTML attribute
      const prop = (this as Record<string, unknown>).navItems;
      if (prop && Array.isArray(prop)) return prop as NavSection[];
      const raw = this.getAttribute('nav-items');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private _headerNav(): HeaderNavLink[] {
    try {
      // JS property first (set by injectProps in SSR), then HTML attribute
      const prop = (this as Record<string, unknown>).headerNav;
      if (prop && Array.isArray(prop)) return prop as HeaderNavLink[];
      const raw = this.getAttribute('header-nav');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private _locales(): string[] {
    try {
      // Check JS property first (set by injectProps in SSR), then HTML attribute
      const raw = (this as Record<string, unknown>).locales || this.getAttribute('locales');
      if (!raw) return ['en'];
      if (Array.isArray(raw)) return raw as string[];
      // String from HTML attribute - try JSON parse
      if (typeof raw === 'string') {
        try {
          return JSON.parse(raw);
        } catch {
          return ['en'];
        }
      }
      return ['en'];
    } catch {
      return ['en'];
    }
  }

  private _locale(): string {
    const prop = (this as Record<string, unknown>).locale;
    if (typeof prop === 'string') return prop;
    return this.getAttribute('locale') || 'en';
  }

  // --- i18n helpers ---

  private _otherLocalePath(): string {
    const locales = this._locales();
    const locale = this._locale();
    const others = locales.filter((l) => l !== locale);
    const target = others[0] || locales[0];
    const path = this._currentPath();
    for (const loc of locales) {
      if (path === `/${loc}` || path.startsWith(`/${loc}/`)) {
        return `/${target}${path.slice(loc.length + 1) || '/'}`;
      }
    }
    return `/${target}${path}`;
  }

  private _otherLocaleLabel(): string {
    const others = this._locales().filter((l) => l !== this._locale());
    const target = others[0] || this._locales()[0];
    return target === 'zh' ? '\u4E2D\u6587' : 'EN';
  }

  private _localizePath(path: string): string {
    const locales = this._locales();
    if (locales.length <= 1) return path;
    if (path.startsWith('http')) return path;
    for (const loc of locales) {
      if (path === `/${loc}` || path.startsWith(`/${loc}/`)) return path;
    }
    return `/${this._locale()}${path}`;
  }

  // --- Icons ---

  private _icon(label: string): string {
    const icons: Record<string, string> = {
      Framework:
        `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3h10M5 3v6h7M12 9v3M5 17h7"/></svg>`,
      Engine:
        `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="3"/><path d="M10 1v2M10 17v2M3.5 3.5l1.4 1.4M15.1 15.1l1.4 1.4M1 10h2M17 10h2M3.5 16.5l1.4-1.4M15.1 4.9l1.4-1.4"/></svg>`,
      RegistryHub:
        `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2l7 4v8l-7 4-7-4V6z"/><path d="M10 10l7-4M10 10v8M10 10L3 6"/></svg>`,
      Blog:
        `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="14" height="16" rx="2"/><path d="M7 6h6M7 10h6M7 14h3"/></svg>`,
    };
    return icons[label] ||
      `<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="8"/><path d="M6 6l3 5 5 3-3-5z"/></svg>`;
  }

  // --- Main render ---

  private _renderLayout() {
    const home = this._getBool('home');
    const logoText = this._esc(this._getStr('logo-text', 'LessJS'));
    const logoSub = this._esc(this._getStr('logo-sub', ''));
    const githubUrl = this._getStr('github-url', 'https://github.com/lessjs-run/LessJS');
    const editUrl = this.getAttribute('edit-url') || '';
    const locales = this._locales();
    const otherLocaleLabel = locales.length > 1 ? this._esc(this._otherLocaleLabel()) : '';
    const otherLocalePath = locales.length > 1 ? this._otherLocalePath() : '';

    const headerNavHtml = this._renderHeaderNavHtml();
    const sidebarHtml = !home ? this._renderSidebarNavHtml() : '';
    const mobileTabHtml = this._renderMobileTabBarHtml();
    const langSwitchHtml = locales.length > 1
      ? html`
        <a class="lang-switch" href="${otherLocalePath}">${otherLocaleLabel}</a>
      `
      : '';

    const footerHtml = html`
      <footer class="app-footer" part="footer">
        <p>
          ${editUrl
            ? html`
              <a href="${editUrl}" target="_blank" rel="noopener" style="margin-right:0.75rem;"
              >Edit this page</a>
            `
            : ''} Built with <a href="${githubUrl}" target="_blank" rel="noopener noreferrer"
          >LessJS Framework</a>
          <span class="divider"></span>
          Self-bootstrapped from JSR
          <span class="divider"></span>
          LESS IS MORE
        </p>
      </footer>
    `;

    return html`
      <div class="app-layout" ${home ? ' home' : ''} part="container">
        <header class="app-header" part="header">
          <nav class="header-inner" aria-label="Primary navigation">
            <a class="logo" href="/">${logoText}<span class="logo-sub">${logoSub}</span></a>
            ${unsafeHTML(headerNavHtml)}
            <div class="header-right">
              <slot name="header-actions"></slot>
              <details class="mobile-menu">
                <summary
                  class="mobile-menu-btn"
                  part="nav-toggle"
                  aria-label="Toggle navigation"
                  @click="${this._toggleMenu}"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                  >
                    <line x1="3" y1="4.5" x2="15" y2="4.5" />
                    <line x1="3" y1="9" x2="15" y2="9" />
                    <line x1="3" y1="13.5" x2="15" y2="13.5" />
                  </svg>
                </summary>
              </details>
              <less-theme-toggle></less-theme-toggle>
              ${langSwitchHtml}
              <a class="github-link" href="${githubUrl}" aria-label="GitHub repository">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path
                    d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                  />
                </svg>
                <span class="github-text">GitHub</span>
              </a>
            </div>
          </nav>
        </header>
        <div class="mobile-backdrop"></div>
        <div class="layout-body">
          ${unsafeHTML(sidebarHtml)}
          <main class="layout-main" part="main">
            <slot></slot>
          </main>
        </div>
        ${footerHtml} ${unsafeHTML(mobileTabHtml)}
      </div>
    `;
  }

  private _renderHeaderNavHtml(): string {
    const links = this._headerNav();
    if (links.length === 0) return '';
    const items = links.map((link) => {
      const localized = this._localizePath(link.href);
      const isExternal = link.href.startsWith('http');
      return `<a href="${this._escAttr(localized)}" data-nav="${isExternal ? '' : localized}">${
        this._esc(link.label)
      }</a>`;
    }).join('');
    return `<nav class="header-nav" part="nav">${items}</nav>`;
  }

  private _renderSidebarNavHtml(): string {
    const nav = this._navItems();
    if (nav.length === 0) return '';
    const sections = nav.map((section) => {
      const items = section.items.map((item) => {
        const href = item.href || item.path || '#';
        const localized = this._localizePath(href);
        const isExternal = href.startsWith('http');
        const cp = this._currentPath();
        const isActive = !isExternal && cp === localized;
        return `<a href="${this._escAttr(localized)}"
          class="${isActive ? 'active' : ''}"
          aria-current="${isActive ? 'page' : ''}"
          data-nav="${isExternal ? '' : localized}"
        >${this._esc(item.label)}</a>`;
      }).join('');
      return `<details class="nav-section" open>
        <summary class="nav-section-title">${this._esc(section.section)}</summary>
        ${items}
      </details>`;
    }).join('');
    return `<nav class="docs-sidebar" part="sidebar" aria-label="Documentation navigation">${sections}</nav>`;
  }

  private _renderMobileTabBarHtml(): string {
    const links = this._headerNav();
    if (links.length === 0) return '';

    const sectionRoot = (href: string): string => {
      const segs = href.split('/').filter(Boolean);
      const start = this._locales().length > 1 && this._locales().includes(segs[0]) ? 1 : 0;
      return segs.length > start + 1 ? '/' + segs[start] : href;
    };

    const cp = this._currentPath();
    let rawPath = cp;
    for (const loc of this._locales()) {
      if (cp === `/${loc}` || cp.startsWith(`/${loc}/`)) {
        rawPath = cp.slice(loc.length + 1) || '/';
        break;
      }
    }

    const items = links.map((link) => {
      const localized = this._localizePath(link.href);
      const isExternal = link.href.startsWith('http');
      const root = sectionRoot(link.href);
      const isActive = !isExternal && (rawPath === root || rawPath.startsWith(root + '/'));
      const icon = this._icon(link.label);
      return `<a class="tab-item${isActive ? ' active' : ''}"
        href="${this._escAttr(localized)}"
        data-nav="${isExternal ? '' : localized}"
        aria-current="${isActive ? 'page' : ''}"
      >${icon}<span>${this._esc(link.label)}</span></a>`;
    }).join('');

    return `<nav class="mobile-tab-bar" aria-label="Quick navigation">${items}</nav>`;
  }

  // --- Lifecycle ---

  override connectedCallback(): void {
    super.connectedCallback();

    const locales = this._locales();
    if (locales.length > 1) {
      const cp = this._currentPath();
      for (const loc of locales) {
        if (cp === `/${loc}` || cp.startsWith(`/${loc}/`)) {
          this.setAttribute('locale', loc);
          break;
        }
      }
    }

    // Sync data-theme from document.documentElement on connect
    const docTheme = document.documentElement?.dataset?.theme;
    if (docTheme) {
      this.setAttribute('data-theme', docTheme);
    }

    // Listen for theme change events from less-theme-toggle
    this._themeHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.theme) {
        this.setAttribute('data-theme', detail.theme);
        this._propagateTheme(detail.theme);
      }
    };
    globalThis.addEventListener?.('less:theme-change', this._themeHandler);

    if (this._dsdHydrated) {
      this._setupDetailsToggle();
    }

    this._navCleanup = this._setupNavDelegation();
    this._navUnlisten = onNavigate((url, navType) => {
      if (navType === 'push') {
        this.setAttribute('current-path', url.pathname);
        this._loadContent(url.pathname);
      }
    });
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._navCleanup?.();
    this._navUnlisten?.();
    if (this._themeHandler) {
      globalThis.removeEventListener?.('less:theme-change', this._themeHandler);
    }
  }

  override attributeChangedCallback(name: string, old: string | null, val: string | null): void {
    if (old === val) return;
    if (name === 'current-path') {
      this._updateActiveNav();
    }
  }

  // --- Mobile menu ---

  private _setupDetailsToggle(): void {
    if (!this.shadowRoot) return;
    const details = this.shadowRoot.querySelector('details.mobile-menu');
    if (details) {
      details.addEventListener('toggle', () => {
        const isOpen = (details as HTMLDetailsElement).open;
        this.toggleAttribute('menu-open', isOpen);
        this._syncInert(isOpen);
      });
      this.toggleAttribute('menu-open', (details as HTMLDetailsElement).open);
    }
  }

  private _toggleMenu(e: Event): void {
    e.preventDefault();
    const details = this.shadowRoot?.querySelector('details.mobile-menu');
    if (!details) return;
    const willOpen = !details.hasAttribute('open');
    details.toggleAttribute('open', willOpen);
    this.toggleAttribute('menu-open', willOpen);
    this._syncInert(willOpen);
  }

  private _syncInert(menuOpen: boolean): void {
    const main = this.shadowRoot?.querySelector('.layout-main');
    if (main) {
      if (menuOpen) main.setAttribute('inert', '');
      else main.removeAttribute('inert');
    }
  }

  // --- SPA Navigation ---

  private _setupNavDelegation(): () => void {
    if (!this.shadowRoot) return () => {};
    const handler = (e: Event) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('[data-nav]');
      if (!link) return;
      const path = link.getAttribute('data-nav');
      if (!path || path.startsWith('http')) return;
      e.preventDefault();
      navigate(path);
    };
    this.shadowRoot.addEventListener('click', handler);
    return () => this.shadowRoot?.removeEventListener('click', handler);
  }

  /**
   * Recursively propagate data-theme to all custom element descendants,
   * including those nested inside shadow DOM trees.
   */
  private _propagateTheme(theme: string): void {
    const walk = (root: Element | ShadowRoot) => {
      root.querySelectorAll('*').forEach((el) => {
        if (el.tagName.includes('-')) {
          el.setAttribute('data-theme', theme);
        }
        if (el.shadowRoot) {
          walk(el.shadowRoot);
        }
      });
    };
    walk(this);
  }

  private async _loadContent(path: string): Promise<void> {
    try {
      const resp = await fetch(path);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const html = await resp.text();
      const tmp = new DOMParser().parseFromString(html, 'text/html').body;
      const newLayout = tmp.querySelector<HTMLElement>('less-layout');
      if (!newLayout) throw new Error('No less-layout found');
      while (this.firstChild) this.removeChild(this.firstChild);
      while (newLayout.firstChild) this.appendChild(newLayout.firstChild);
      this.setAttribute('current-path', path);

      // Ensure newly inserted components inherit current theme
      const currentTheme = this.getAttribute('data-theme') ||
        document.documentElement?.dataset?.theme;
      if (currentTheme) {
        this._propagateTheme(currentTheme);
      }

      globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      globalThis.location.reload();
    }
  }

  private _updateActiveNav(): void {
    if (!this.shadowRoot || !this._dsdHydrated) return;
    const cp = this._currentPath();
    const links = this.shadowRoot.querySelectorAll(
      '.docs-sidebar a[data-nav], .header-nav a[data-nav]',
    );
    links.forEach((a) => {
      const nav = a.getAttribute('data-nav');
      const isActive = nav === cp;
      a.classList.toggle('active', isActive);
      if (isActive) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  // --- Utilities ---

  private _esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  private _escAttr(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(
      />/g,
      '&gt;',
    );
  }
}

export default LessLayout;

// Guard: idempotent across SSR paths
if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
  customElements.define(tagName, LessLayout);
}
