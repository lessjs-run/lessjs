/**
 * @lessjs/ui - less-layout
 *
 * App layout component with header, sidebar, and footer.
 * Swiss International Style: Pure B&W, minimal.
 *
 * Features:
 * - Sticky header with configurable navigation
 * - Collapsible sidebar with data-driven sections
 * - Mobile hamburger menu (L0 details/summary)
 * - Theme toggle via less-theme-toggle Island
 * - Footer with links
 *
 * LessJS Architecture:
 * - This is a static layout component (no client re-render needed)
 * - Theme toggle is handled by less-theme-toggle Island
 * - Navigation is data-driven via navItems property (no hardcoded links)
 *
 * Usage (data-driven navigation):
 * ```html
 * <less-layout current-path="/guide/getting-started"
 *   nav-items='[{"section":"Guide","items":[{"path":"/guide/getting-started","label":"Getting Started"}]}]'>
 * </less-layout>
 * ```
 *
 * Usage (default LessJS docs navigation, no nav-items attribute):
 * ```html
 * <less-layout current-path="/guide/getting-started">
 *   <main>Content here</main>
 * </less-layout>
 * ```
 *
 * NavItems schema:
 * ```ts
 * interface NavItem { path: string; label: string }
 * interface NavSection { section: string; items: NavItem[] }
 * ```
 */

import { css, type CSSResult, html, LitElement, nothing, type TemplateResult } from 'lit';
import { lessDesignTokens } from './design-tokens.js';
// CRITICAL: less-layout's template uses <less-theme-toggle>, so we MUST import it
// so that the SSR renderer can recursively render its DSD shadow root.
// Without this import, SSR outputs <less-theme-toggle></less-theme-toggle> without
// DSD, which means the theme toggle button is never rendered server-side and
// cannot be upgraded into a working client element.
import './less-theme-toggle.js';

export const tagName = 'less-layout';

/** A single navigation link */
export interface NavItem {
  /** URL path for internal links */
  path?: string;
  /** External URL (takes precedence over path) */
  href?: string;
  /** Display label */
  label: string;
}

/** A navigation section with a title and links */
export interface NavSection {
  /** Section title (shown as collapsible header) */
  section: string;
  /** Links in this section */
  items: NavItem[];
}

/** Header navigation link */
export interface HeaderNavLink {
  /** URL path or external URL */
  href: string;
  /** Display label */
  label: string;
}

export class LessLayout extends LitElement {
  static override styles: CSSResult[] = [
    lessDesignTokens,
    css`
      :host {
        display: block;
      }

      /* === Layout Shell === */
      .app-layout {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        background: var(--less-bg-base);
        color: var(--less-text-primary);
        font-family: var(--less-font-sans);
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .layout-body {
        display: flex;
        flex: 1;
      }

      .layout-main {
        flex: 1;
        min-width: 0;
      }

      .app-layout[home] .layout-body {
        display: block;
      }

      /* === Header === */
      .app-header {
        position: sticky;
        top: 0;
        z-index: var(--less-z-sticky);
        background: var(--less-bg-base);
        border-bottom: 0.5px solid var(--less-border);
      }

      .header-inner {
        max-width: var(--less-layout-max-width, 1400px);
        margin: 0 auto;
        padding: 0 var(--less-size-8);
        display: flex;
        align-items: center;
        height: var(--less-layout-header-height, 56px);
        gap: var(--less-size-6);
      }

      /* === Mobile Menu (L0: details/summary) === */
      .mobile-menu {
        display: none;
      }

      .mobile-menu-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: 0.5px solid var(--less-border);
        border-radius: var(--less-radius-md);
        background: transparent;
        color: var(--less-text-tertiary);
        cursor: pointer;
        padding: 0;
        list-style: none;
        transition:
          color var(--less-transition-normal),
          border-color var(--less-transition-normal),
          background var(--less-transition-normal);
        }

        .mobile-menu-btn::-webkit-details-marker {
          display: none;
        }

        .mobile-menu-btn::marker {
          content: "";
        }

        .mobile-menu-btn:hover,
        .mobile-menu-btn:focus-visible {
          color: var(--less-text-primary);
          border-color: var(--less-border-hover);
          background: var(--less-accent-subtle);
        }

        .mobile-menu[open] .mobile-menu-btn {
          color: var(--less-text-primary);
          background: var(--less-accent-subtle);
          border-color: var(--less-border-hover);
        }

        /* === Logo === */
        .logo {
          font-size: var(--less-font-size-sm);
          font-weight: var(--less-font-weight-extrabold);
          color: var(--less-text-primary);
          text-decoration: none;
          letter-spacing: var(--less-letter-spacing-widest);
          text-transform: uppercase;
          transition: opacity var(--less-transition-normal);
          white-space: nowrap;
        }

        .logo:hover {
          opacity: 0.6;
        }

        .logo-sub {
          font-size: var(--less-font-size-xs);
          font-weight: var(--less-font-weight-normal);
          color: var(--less-text-muted);
          margin-left: var(--less-size-2);
          letter-spacing: var(--less-letter-spacing-wide);
          text-transform: none;
        }

        /* === Header Nav === */
        .header-nav {
          display: flex;
          gap: 0.125rem;
          flex: 1;
        }

        .header-nav a {
          color: var(--less-text-tertiary);
          text-decoration: none;
          font-size: var(--less-font-size-sm);
          font-weight: var(--less-font-weight-medium);
          padding: var(--less-size-2) var(--less-size-3);
          letter-spacing: var(--less-letter-spacing-wide);
          transition: color var(--less-transition-normal);
          border-radius: var(--less-radius-md);
        }

        .header-nav a:hover {
          color: var(--less-text-primary);
          text-decoration: underline;
        }

        /* === Header Right === */
        .header-right {
          display: flex;
          align-items: center;
          gap: var(--less-size-2);
          margin-left: auto;
        }

        /* === GitHub Link === */
        .github-link {
          display: inline-flex;
          align-items: center;
          gap: var(--less-size-2);
          color: var(--less-text-muted);
          text-decoration: none;
          font-size: var(--less-font-size-xs);
          font-weight: var(--less-font-weight-medium);
          letter-spacing: var(--less-letter-spacing-wide);
          padding: var(--less-size-2) var(--less-size-3);
          border: 0.5px solid var(--less-border);
          border-radius: var(--less-radius-md);
          transition: color var(--less-transition-normal), border-color var(--less-transition-normal);
        }

        .github-link:hover {
          color: var(--less-text-secondary);
          border-color: var(--less-border-hover);
        }

        .github-link svg {
          flex-shrink: 0;
        }

        /* === Sidebar (Desktop) === */
        .docs-sidebar {
          width: clamp(200px, 20vw, 280px);
          flex-shrink: 0;
          border-right: 0.5px solid var(--less-border);
          padding: var(--less-size-6) 0;
          overflow-y: auto;
          height: calc(100vh - var(--less-layout-header-height, 56px));
          position: sticky;
          top: var(--less-layout-header-height, 56px);
          scrollbar-width: thin;
        }

        .nav-section {
          margin-bottom: var(--less-size-5);
        }

        .nav-section summary {
          font-size: var(--less-font-size-xs);
          font-weight: var(--less-font-weight-bold);
          text-transform: uppercase;
          letter-spacing: 0.14em;
          color: var(--less-text-muted);
          padding: 0 var(--less-size-5);
          margin-bottom: var(--less-size-2);
          cursor: pointer;
          list-style: none;
          display: flex;
          align-items: center;
          gap: var(--less-size-2);
          user-select: none;
        }

        .nav-section summary::-webkit-details-marker {
          display: none;
        }

        .nav-section summary::marker {
          content: "";
        }

        .nav-section summary::before {
          content: "▾";
          font-size: 0.5rem;
          transition: transform var(--less-transition-normal);
          display: inline-block;
        }

        .nav-section[open] summary::before {
          transform: rotate(0deg);
        }

        .nav-section:not([open]) summary::before {
          transform: rotate(-90deg);
        }

        .nav-section summary:hover {
          color: var(--less-text-tertiary);
        }

        .docs-sidebar a {
          display: block;
          color: var(--less-text-tertiary);
          text-decoration: none;
          font-size: var(--less-font-size-sm);
          padding: 0.3rem var(--less-size-5);
          transition: color var(--less-transition-normal), background var(--less-transition-normal);
          border-left: 1px solid transparent;
        }

        .docs-sidebar a:hover {
          color: var(--less-text-primary);
          background: var(--less-accent-subtle);
        }

        .docs-sidebar a.active,
        .docs-sidebar a[aria-current="page"] {
          color: var(--less-text-primary);
          border-left-color: var(--less-text-primary);
          background: var(--less-accent-subtle);
          font-weight: var(--less-font-weight-medium);
        }

        /* === Mobile Backdrop === */
        .mobile-backdrop {
          position: fixed;
          inset: 0;
          top: var(--less-layout-header-height, 56px);
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.5) 0%,
            rgba(0, 0, 0, 0.35) 40%,
            rgba(0, 0, 0, 0.25) 100%
          );
          z-index: 80;
          opacity: 0;
          pointer-events: none;
          transition: opacity var(--less-transition-slow);
        }

        /* === Mobile Responsive === */
        @media (max-width: 900px) {
          .mobile-menu {
            display: block;
          }

          .header-inner {
            padding: 0 var(--less-size-4);
            gap: var(--less-size-3);
          }

          .header-nav {
            display: none;
          }

          .github-text {
            display: none;
          }

          .header-right {
            gap: var(--less-size-2);
          }

          .docs-sidebar {
            position: fixed;
            top: var(--less-layout-header-height, 56px);
            left: 0;
            width: min(300px, 80vw);
            height: calc(100vh - var(--less-layout-header-height, 56px));
            z-index: 90;
            background: var(--less-bg-base);
            border-right: 0.5px solid var(--less-border);
            border-bottom: none;
            padding: var(--less-size-4) 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
            transform: translateX(-101%);
            transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
            will-change: transform;
            box-shadow: none;
          }

          /* Mobile overlay sidebar: always in DOM, shown/hidden by menu-open */
          .mobile-sidebar-overlay {
            display: none;
            position: fixed;
            top: var(--less-layout-header-height, 56px);
            left: 0;
            width: min(300px, 80vw);
            height: calc(100vh - var(--less-layout-header-height, 56px));
            z-index: 90;
            background: var(--less-bg-base);
            border-right: 0.5px solid var(--less-border);
            padding: var(--less-size-4) 0;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }

          :host([menu-open]) .mobile-sidebar-overlay {
            display: block;
          }

          :host([menu-open]) .docs-sidebar {
            transform: translateX(0);
            box-shadow: var(--less-shadow-sidebar, 4px 0 24px rgba(0, 0, 0, 0.3));
          }

          :host([menu-open]) .mobile-backdrop {
            opacity: 1;
            pointer-events: auto;
          }

          .nav-section {
            margin-bottom: var(--less-size-2);
          }

          .nav-section summary {
            padding: var(--less-size-2) var(--less-size-4);
            font-size: var(--less-font-size-xs);
          }

          .docs-sidebar a {
            padding: var(--less-size-2) var(--less-size-4) var(--less-size-2) var(--less-size-7);
            font-size: var(--less-font-size-sm);
          }

          .layout-main {
            width: 100%;
          }

          .app-footer footer {
            padding: var(--less-size-6) var(--less-size-4);
          }

          .app-footer .divider {
            display: none;
          }

          .app-footer p {
            line-height: 1.8;
          }
        }

        /* Mobile overlay sidebar: hidden on desktop, shown on mobile by menu-open */
        .mobile-sidebar-overlay {
          display: none;
        }

        @media (max-width: 480px) {
          .logo-sub {
            display: none;
          }

          .github-link {
            padding: var(--less-size-2);
            border: none;
          }

          .header-inner {
            padding: 0 var(--less-size-3);
          }
        }

        /* === Footer === */
        .app-footer footer {
          padding: var(--less-size-8);
          border-top: 0.5px solid var(--less-border);
          text-align: center;
          color: var(--less-text-muted);
          font-size: var(--less-font-size-xs);
          letter-spacing: var(--less-letter-spacing-wide);
          background: var(--less-bg-base);
        }

        .app-footer p {
          margin: 0.25rem 0;
        }

        .app-footer a {
          color: var(--less-text-tertiary);
          transition: color var(--less-transition-normal);
        }

        .app-footer a:hover {
          color: var(--less-text-primary);
          text-decoration: underline;
        }

        .app-footer .divider {
          display: inline-block;
          width: 1px;
          height: 8px;
          background: var(--less-border-hover);
          vertical-align: middle;
          margin: 0 var(--less-size-3);
        }
      `,
    ];

    static override properties = {
      home: { type: Boolean, reflect: true },
      currentPath: { type: String, attribute: 'current-path' },
      navItems: { type: Array, attribute: 'nav-items' },
      headerNav: { type: Array, attribute: 'header-nav' },
      logoText: { type: String, attribute: 'logo-text' },
      logoSub: { type: String, attribute: 'logo-sub' },
      githubUrl: { type: String, attribute: 'github-url' },
    };

    /** Whether to show the home layout (no sidebar, full-width) */
    declare home: boolean;
    /** Current URL path, used to highlight the active navigation link */
    declare currentPath: string;
    /** Sidebar navigation sections (data-driven; falls back to default LessJS docs nav) */
    declare navItems: NavSection[] | undefined;
    /** Header navigation links (data-driven; falls back to default) */
    declare headerNav: HeaderNavLink[] | undefined;
    /** Logo text (default: "LessJS") */
    declare logoText: string;
    /** Logo subtitle (default: "framework") */
    declare logoSub: string;
    /** GitHub repository URL (default: LessJS repo) */
    declare githubUrl: string;

    constructor() {
      super();
      this.home = false;
      this.currentPath = '';
      this.navItems = undefined;
      this.headerNav = undefined;
      this.logoText = 'LessJS';
      this.logoSub = '';
      this.githubUrl = 'https://github.com/lessjs-run/LessJS';
    }

    override firstUpdated() {
      this._syncMenuState();
    }

    /** Explicit toggle: directly sets open + menu-open (no native <details> reliance) */
    private _toggleMenu(e: Event) {
      e.preventDefault();
      const details = this.shadowRoot?.querySelector('details.mobile-menu');
      if (!details) return;
      const willOpen = !details.hasAttribute('open');
      details.toggleAttribute('open', willOpen);
      this.toggleAttribute('menu-open', willOpen);
    }

    /** Sync menu-open attribute with details.open initial state */
    private _syncMenuState() {
      const details = this.shadowRoot?.querySelector('details.mobile-menu');
      if (details) {
        details.addEventListener('toggle', () => {
          this.toggleAttribute('menu-open', (details as HTMLDetailsElement).open);
        });
        this.toggleAttribute('menu-open', (details as HTMLDetailsElement).open);
      }
    }

    /** Default LessJS docs navigation — sync with docs/app/nav-data.ts */
    private static readonly DEFAULT_NAV: NavSection[] = [
      {
        section: 'Start Here',
        items: [
          { path: '/guide/positioning', label: 'Framework Positioning' },
          { path: '/guide/getting-started', label: 'Getting Started' },
          { path: '/guide/design-philosophy', label: 'Design Philosophy' },
          { path: '/guide/architecture', label: 'Architecture' },
        ],
      },
      {
        section: 'Core Model',
        items: [
          { path: '/guide/routing', label: 'Routing' },
          { path: '/guide/ssg', label: 'Rendering & SSG' },
          { path: '/guide/islands', label: 'Island Upgrade' },
          { path: '/guide/api-routes', label: 'API Routes' },
          { path: '/guide/api-design', label: 'API Design' },
        ],
      },
      {
        section: 'Production',
        items: [
          { path: '/guide/configuration', label: 'Configuration' },
          { path: '/guide/security-middleware', label: 'Security & Middleware' },
          { path: '/guide/error-handling', label: 'Error Handling' },
          { path: '/guide/testing', label: 'Testing' },
          { path: '/guide/deployment', label: 'Deployment' },
        ],
      },
      {
        section: 'Packages',
        items: [
          { path: '/ui', label: 'Design System' },
          { path: '/styling/less-ui', label: '@lessjs/ui' },
          { path: '/styling/web-awesome', label: 'Web Awesome' },
          { path: '/examples', label: 'Examples' },
        ],
      },
      {
        section: 'Strategy',
        items: [
          { path: '/roadmap', label: 'Roadmap' },
          { path: '/guide/less-compiler', label: '.less Compiler' },
          { path: '/guide/pwa', label: 'PWA Support' },
          { path: '/guide/blog-system', label: 'Blog System' },
          { path: '/decisions', label: 'Architecture Decisions' },
        ],
      },
      {
        section: 'Examples',
        items: [
          { path: '/demo', label: 'Live Demo' },
          { path: '/examples/hello', label: 'Hello World' },
          { path: '/examples/minimal-blog', label: 'Minimal Blog' },
          { path: '/examples/fullstack', label: 'Fullstack' },
        ],
      },
      {
        section: 'History',
        items: [
          { path: '/blog', label: 'Blog' },
          { path: '/blog/v0-5-alpha1', label: 'v0.5 Alpha 1' },
          { path: '/blog/v0-5-0', label: 'v0.5.0' },
          { path: '/blog/v0-4-0', label: 'v0.4.0' },
          { path: '/blog/less-compiler', label: '.less Compiler Note' },
          { path: '/changelog', label: 'Changelog' },
          { path: '/contributing', label: 'Contributing' },
        ],
      },
    ];

    /** Default header navigation links — sync with docs/app/nav-data.ts */
    private static readonly DEFAULT_HEADER_NAV: HeaderNavLink[] = [
      { href: '/guide/positioning', label: 'Docs' },
      { href: '/guide/architecture', label: 'Architecture' },
      { href: '/examples', label: 'Examples' },
      { href: '/ui', label: 'UI' },
      { href: '/roadmap', label: 'Roadmap' },
      { href: 'https://jsr.io/@lessjs/core', label: 'JSR' },
    ];

    private _navLink(path: string, text: string) {
      const isExternal = path.startsWith('http');
      const isActive = !isExternal && this.currentPath === path;
      return html`
        <a
          href="${path}"
          class="${isActive ? 'active' : ''}"
          aria-current="${isActive ? 'page' : undefined}"
          target="${isExternal ? '_blank' : nothing}"
          rel="${isExternal ? 'noopener noreferrer' : nothing}"
        >${text}</a>
      `;
    }

    private _renderSidebarNav(): TemplateResult | typeof nothing {
      return html`
        <nav class="docs-sidebar" aria-label="Documentation navigation">
          ${this._renderSidebarItems()}
        </nav>
      `;
    }

    /** Mobile overlay sidebar: position fixed, shown/hidden by menu-open toggle */
    private _renderMobileSidebar(): TemplateResult {
      return html`
        <nav class="mobile-sidebar-overlay" aria-label="Mobile navigation">
          ${this._renderSidebarItems()}
        </nav>
      `;
    }

    /** Shared nav items for both desktop and mobile sidebar */
    private _renderSidebarItems(): TemplateResult {
      const nav = this.navItems || LessLayout.DEFAULT_NAV;
      return html`
        ${nav.map(
          (section) =>
            html`
              <details class="nav-section" open>
                <summary class="nav-section-title">${section.section}</summary>
                ${section.items.map(
                  (item) => this._navLink(item.href || item.path || '#', item.label),
                )}
              </details>
            `,
        )}
      `;
    }

    private _renderHeaderNav(): TemplateResult | typeof nothing {
      const links = this.headerNav || LessLayout.DEFAULT_HEADER_NAV;
      return html`
        <nav class="header-nav">
          ${links.map(
            (link) =>
              html`
                <a href="${link.href}">${link.label}</a>
              `,
          )}
        </nav>
      `;
    }

    override render(): TemplateResult {
      return html`
        <div class="app-layout" ?home="${this.home}">
          <header class="app-header">
            <div class="header-inner">
              <a class="logo" href="/">${this.logoText}<span class="logo-sub">${this
                .logoSub}</span></a>
              ${this._renderHeaderNav()}
              <div class="header-right">
                <details class="mobile-menu">
                  <summary class="mobile-menu-btn" aria-label="Toggle navigation" @click="${this
                    ._toggleMenu}">
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
                <a class="github-link" href="${this.githubUrl}" aria-label="GitHub repository">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path
                      d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
                    />
                  </svg>
                  <span class="github-text">GitHub</span>
                </a>
              </div>
            </div>
          </header>
          <div class="mobile-backdrop"></div>
          <div class="layout-body">
            ${!this.home ? this._renderSidebarNav() : nothing}
            <!-- Mobile overlay sidebar: always rendered, position:fixed, toggled by menu-open -->
            ${this._renderMobileSidebar()}
            <main class="layout-main">
              <slot></slot>
            </main>
          </div>
          <div class="app-footer">
            <footer>
              <p>
                Built with <a href="${this.githubUrl}" target="_blank" rel="noopener noreferrer"
                >LessJS Framework</a>
                <span class="divider"></span>
                Self-bootstrapped from JSR
                <span class="divider"></span>
                LESS IS MORE
              </p>
            </footer>
          </div>
        </div>
      `;
    }
  }

  // Guard: idempotent across SSR paths
  try {
    customElements.define(tagName, LessLayout);
  } catch { /* already defined */ }
