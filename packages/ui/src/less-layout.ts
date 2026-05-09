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
 * - SPA navigation via Navigation API (navigate/fetch/swap)
 *   Intercepts internal link clicks, uses navigate() for URL
 *   update, fetches new page HTML, and swaps slot content.
 *   Falls back to History API when Navigation API unavailable.
 *
 * LessJS Architecture:
 * - This is a Layer 2 (DSD Interactive) component
 * - v0.6.2: Uses WithDsdHydration Mixin for DSD hydration
 *   with declarative event binding and direct DOM manipulation
 * - Theme toggle is handled by less-theme-toggle Island
 * - Navigation is data-driven via navItems property (no hardcoded links)
 * - v0.9.0: Uses @lessjs/core/navigation for SPA navigation
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

import { css, type CSSResult, html, nothing, type TemplateResult } from 'lit';
import { lessDesignTokens } from './design-tokens.js';
import { DsdLitElement } from '@lessjs/adapter-lit';
import { navigate, onNavigate } from '@lessjs/core/navigation';

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

/**
 * App layout with DSD hydration and SPA navigation.
 *
 * Uses WithDsdHydration Mixin for the common DSD pattern:
 *   - Detects pre-populated shadow root from DSD
 *   - Binds events declared in `static hydrateEvents`
 *   - Cleans up listeners on disconnect
 *
 * v0.9.0: SPA navigation via Navigation API + fetch-and-swap.
 * Internal links use data-nav attribute; click handling is delegated
 * from the shadow root, working with both DSD and non-DSD modes.
 */
export class LessLayout extends DsdLitElement {
  /** Declarative event bindings for DSD hydration */
  static hydrateEvents = [
    { selector: 'summary.mobile-menu-btn', event: 'click', method: '_toggleMenu' },
  ];

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
        display: flex;
        flex-direction: column;
      }

      .app-layout[home] .layout-main {
        flex: 1;
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

        /* === Sidebar: unified desktop/mobile (v0.6) ===
        *
        * v0.6: SINGLE .docs-sidebar for both desktop and mobile.
        * - Desktop: position:sticky, border-right, always visible
        * - Mobile: position:fixed, slides in from left via transform
        * - Home page: hidden via width:0 (not display:none — preserves transform)
        *
        * This replaces the old dual-sidebar approach (.docs-sidebar for desktop
        * + .mobile-sidebar-overlay for mobile) which caused duplicate content
        * and inconsistent styling between breakpoints.
        */
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

        /* Home page: hide sidebar while keeping box model alive for transitions.
        * NOT display:none — that kills the box model and makes transform unusable. */
        :host([home]) .docs-sidebar {
          width: 0;
          min-width: 0;
          padding: 0;
          overflow: hidden;
          border-right: none;
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

        /* === Mobile Responsive ===
        *
        * v0.6: Unified sidebar. On mobile, .docs-sidebar becomes a fixed overlay
        * that slides in from the left via transform. No separate mobile sidebar
        * overlay element — eliminates content duplication and style inconsistency.
        */
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
            /* Desktop sticky properties are overridden by fixed */
          }

          /* Home page on mobile: always hidden via transform + invisible */
          :host([home]) .docs-sidebar {
            width: min(300px, 80vw);
            min-width: auto;
            padding: var(--less-size-4) 0;
            border-right: 0.5px solid var(--less-border);
            transform: translateX(-101%);
            pointer-events: none;
            visibility: hidden;
          }

          :host([menu-open]) .docs-sidebar {
            transform: translateX(0);
            box-shadow: var(--less-shadow-sidebar, 4px 0 24px rgba(0, 0, 0, 0.3));
          }

          :host([home][menu-open]) .docs-sidebar {
            transform: translateX(-101%);
          }

          /* Home page on mobile: hide hamburger menu (no sidebar to show)
            and prevent backdrop from appearing */
          :host([home]) .mobile-menu {
            display: none;
          }

          :host([home]) .mobile-backdrop {
            display: none;
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

          .app-footer {
            padding: var(--less-size-6) var(--less-size-4);
          }

          .app-footer .divider {
            display: none;
          }

          .app-footer p {
            line-height: 1.8;
          }
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
        .app-footer {
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

    /** When DSD hydrated, return nothing — the shadow DOM already has content. */
    override render(): TemplateResult | typeof nothing {
      if (this._dsdHydrated) return nothing;
      return this._renderLayout();
    }

    /** Extract the full layout template so render() can skip it for DSD. */
    private _renderLayout(): TemplateResult {
      return html`
        <div class="app-layout" ?home="${this.home}">
          <header class="app-header">
            <nav class="header-inner" aria-label="Primary navigation">
              <a class="logo" href="/">${this.logoText}<span class="logo-sub">${this
                .logoSub}</span></a>
              ${this._renderHeaderNav()}
              <div class="header-right">
                <slot name="header-actions"></slot>
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
            </nav>
          </header>
          <div class="mobile-backdrop"></div>
          <div class="layout-body">
            ${!this.home ? this._renderSidebarNav() : nothing}
            <main class="layout-main">
              <slot></slot>
            </main>
          </div>
          <footer class="app-footer">
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
      `;
    }

    override connectedCallback() {
      super.connectedCallback(); // Mixin handles _hydrateEvents()

      // Layout-specific: set up native <details> toggle for mobile menu
      if (this._dsdHydrated) {
        this._setupDetailsToggle();
      }

      // ── SPA navigation: event delegation for all internal nav links ──
      // Uses data-nav attribute instead of @click on each <a> tag.
      // This works with both DSD (pre-rendered HTML) and non-DSD (Lit render)
      // because event delegation at the shadow root level catches all clicks.
      this._navCleanup = this._setupNavDelegation();

      // ── Listen for navigation events ──
      // After navigate() updates the URL, swap in the new page content
      // via fetch-and-swap so the user gets a SPA-like experience.
      this._navUnlisten = onNavigate((url, navType) => {
        if (navType === 'push') {
          this.currentPath = url.pathname;
          this._loadContent(url.pathname);
        }
      });
    }

    override disconnectedCallback() {
      super.disconnectedCallback();
      this._navCleanup?.();
      this._navUnlisten?.();
    }

    /**
     * Set up native <details> toggle event listener.
     * This uses the platform's native toggle event, not Lit's @click,
     * so it works with both DSD and non-DSD rendering.
     */
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

    /** Explicit toggle: directly sets open + menu-open (no native <details> reliance) */
    private _toggleMenu(e: Event) {
      e.preventDefault();
      const details = this.shadowRoot?.querySelector('details.mobile-menu');
      if (!details) return;
      const willOpen = !details.hasAttribute('open');
      details.toggleAttribute('open', willOpen);
      this.toggleAttribute('menu-open', willOpen);
      // Accessibility: set inert on main content when menu is open
      this._syncInert(willOpen);
    }

    /** Accessibility: mark main content as inert when mobile menu is open */
    private _syncInert(menuOpen: boolean) {
      const main = this.shadowRoot?.querySelector('.layout-main');
      if (main) {
        if (menuOpen) {
          main.setAttribute('inert', '');
        } else {
          main.removeAttribute('inert');
        }
      }
    }

    // ─── Private fields ───────────────────────────────────────────
    /** Cleanup for nav click delegation */
    private _navCleanup?: () => void;
    /** Cleanup for onNavigate listener */
    private _navUnlisten?: () => void;

    // ─── SPA Navigation ───────────────────────────────────────────

    /**
     * Set up event delegation for all nav links on the shadow root.
     * Intercepts clicks on <a data-nav="..."> elements and routes them
     * through the Navigation API for SPA-like page transitions.
     */
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
     * Fetch a new page and swap its content into the layout's slot.
     *
     * Strategy (SSG-optimized):
     *   1. Fetch the full HTML of the target page
     *   2. Parse and find the <less-layout> element
     *   3. Replace this element's children with the new page's
     *      light DOM content (projected via <slot>)
     *   4. Update currentPath for sidebar highlighting
     *   5. Scroll to top
     *
     * If anything fails (network, parsing), falls back to full reload.
     */
    private async _loadContent(path: string): Promise<void> {
      try {
        const resp = await fetch(path);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const html = await resp.text();

        const tmp = document.createElement('div');
        tmp.innerHTML = html;

        const newLayout = tmp.querySelector<HTMLElement>('less-layout');
        if (!newLayout) throw new Error('No less-layout found in response');

        // Replace this layout's light DOM children with the new page's
        // (they are projected through <slot></slot> in the template)
        while (this.firstChild) this.removeChild(this.firstChild);
        while (newLayout.firstChild) this.appendChild(newLayout.firstChild);

        // Update sidebar active state
        this.currentPath = path;

        // Scroll to top for a fresh viewport
        globalThis.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        // Fallback: full reload — Navigation API already updated the URL,
        // so this acts as a normal page load from the new URL
        globalThis.location.reload();
      }
    }

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
          data-nav="${isExternal ? '' : path}"
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

    /** Shared nav items for both desktop and mobile sidebar */
    private _renderSidebarItems(): TemplateResult {
      const nav = this.navItems || [];
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
      const links = this.headerNav || [];
      return html`
        <nav class="header-nav">
          ${links.map(
            (link) =>
              html`
                <a href="${link.href}" data-nav="${link.href.startsWith('http')
                  ? ''
                  : link.href}">${link.label}</a>
              `,
          )}
        </nav>
      `;
    }
  }

  // Guard: idempotent across SSR paths
  if (!customElements.get(tagName)) customElements.define(tagName, LessLayout);
