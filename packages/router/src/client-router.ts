/**
 * @openelement/router �� Client Router
 *
 * URLPattern-based SPA router. One Router instance per <open-layout>.
 *
 * start() sets up:
 *   1. Click delegation �� intercept all <a> clicks in shadow root
 *   2. Navigation API intercept �� prevent full-page loads
 *   3. Unified contentLoader callback �� fetch + swap page content
 *   4. Locale management �� update lang-switch after navigation
 *
 * Consumer contract:
 *   less-layout calls `router.start(opts)` once in connectedCallback.
 *   The Router takes over all navigation from that point.
 *   When the caller swaps content (in contentLoader), it must call
 *   router.syncAfterSwap(shadowRoot) to update lang-switch.
 */

interface NavigationLike extends EventTarget {
  addEventListener(type: 'navigate', listener: EventListener): void;
  removeEventListener(type: 'navigate', listener: EventListener): void;
}

interface NavigationNavigateEvent extends Event {
  canIntercept: boolean;
  hashChange: boolean;
  downloadRequest: boolean;
  destination: { url: string };
  intercept(opts: { handler: () => void }): void;
}

const LOCALE_LABELS: Record<string, string> = {
  zh: '\u4E2D\u6587',
  en: 'EN',
};

export interface RouterStartOptions {
  /** Called when navigation destination is resolved. Caller fetches + swaps. */
  contentLoader: (path: string, locale: string) => Promise<void>;
  /** Called after content swap to update nav highlights etc. */
  onAfterSwap?: (path: string, locale: string) => void;
}

/**
 * Router class that encapsulates all locale/path/navigation logic.
 * Instantiated by less-layout �� no signal dependencies.
 */
export class Router {
  #el: HTMLElement;
  #cleanup?: () => void;
  #options?: RouterStartOptions;

  constructor(element: HTMLElement) {
    this.#el = element;
  }

  // ������ Public Locale API ��������������������������������������������������������������������������������

  /** Available locales from [locales] attribute or prop �� lazy (SSR-safe) */
  get locales(): string[] {
    return this.#parseLocales();
  }

  /** Current locale from attribute or URL */
  get locale(): string {
    const prop = (this.#el as unknown as Record<string, unknown>).locale;
    if (typeof prop === 'string') return prop;
    const attr = this.#el.getAttribute('locale');
    if (attr) return attr;
    return this.#parseUrl().locale;
  }

  /** Current path without locale prefix */
  get path(): string {
    return this.#parseUrl().path;
  }

  /** Path to switch to the other locale */
  switchPath(): string {
    const { locale, path } = this.#parseUrl();
    const target = this.locales.find((l) => l !== locale) || this.locales[0];
    return `/${target}${path}`;
  }

  /** Label for the other locale (e.g. "����" or "EN") */
  switchLabel(): string {
    const { locale } = this.#parseUrl();
    const target = this.locales.find((l) => l !== locale) || this.locales[0];
    return LOCALE_LABELS[target] || target.toUpperCase();
  }

  /** Add locale prefix to a path if needed */
  localize(path: string): string {
    if (this.locales.length <= 1) return path;
    if (path.startsWith('http')) return path;
    for (const loc of this.locales) {
      if (path === `/${loc}` || path.startsWith(`/${loc}/`)) return path;
    }
    return `/${this.locale}${path}`;
  }

  /** Update lang-switch DOM element (for SPA navigation) */
  updateSwitch(shadowRoot: ShadowRoot): void {
    const link = shadowRoot.querySelector('.lang-switch') as HTMLAnchorElement | null;
    if (!link) return;
    link.textContent = this.switchLabel();
    link.setAttribute('href', this.switchPath());
  }

  // ������ SPA Navigation �� start/stop ������������������������������������������������������������

  /**
   * Start the SPA router.
   *
   * Sets up click delegation on the shadow root AND Navigation API interception.
   * Both paths route through the same contentLoader callback.
   *
   * Call once per component lifecycle (in connectedCallback).
   * Returns void �� cleanup is internal. Call stop() to dispose.
   */
  start(opts: RouterStartOptions): void {
    this.#options = opts;

    if (this.#el.shadowRoot) {
      this.#setupClickDelegation(this.#el.shadowRoot);
    }
    this.#setupNavigationApi();

    // Listen for popstate (back/forward �� Navigation API handles this natively
    // but we need the fallback for browsers without Navigation API)
    this.#setupPopState();
  }

  /**
   * Stop the SPA router. Removes all event listeners.
   */
  stop(): void {
    this.#cleanup?.();
    this.#cleanup = undefined;
  }

  /**
   * Navigate programmatically to a new URL.
   * Updates browser history without full-page load.
   */
  navigateTo(href: string): void {
    const url = new URL(href, location.origin);
    if (url.origin !== location.origin) {
      location.href = href;
      return;
    }

    history.pushState(null, '', url.pathname + url.search + url.hash);
    this.#navigateNow(url.pathname);
  }

  /**
   * Replace current history entry (useful for lang switches where
   * the user stays on the "same" page).
   */
  replaceTo(href: string): void {
    const url = new URL(href, location.origin);
    if (url.origin !== location.origin) return;

    history.replaceState(null, '', url.pathname + url.search + url.hash);
    this.#navigateNow(url.pathname);
  }

  // ������ Setup helpers ����������������������������������������������������������������������������������������

  #setupClickDelegation(root: ShadowRoot): void {
    const handler = (e: Event) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>('a');
      if (!link) return;
      const href = link.getAttribute('href');
      if (!href) return;

      // Skip external, hash-only, and mailto links
      if (
        href.startsWith('http') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('javascript:')
      ) {
        return;
      }

      e.preventDefault();
      e.stopImmediatePropagation();

      // For lang-switch, use replaceState to avoid adding to history
      const isLangSwitch = link.classList.contains('lang-switch');
      if (isLangSwitch) {
        this.replaceTo(href);
      } else {
        this.navigateTo(href);
      }
    };
    root.addEventListener('click', handler);
    const prev = this.#cleanup;
    this.#cleanup = () => {
      root.removeEventListener('click', handler);
      prev?.();
    };
  }

  #setupNavigationApi(): void {
    const nav = (globalThis as typeof globalThis & { navigation?: NavigationLike }).navigation;
    if (!nav) return;

    const onNav: EventListener = (event) => {
      const e = event as NavigationNavigateEvent;
      if (!e.canIntercept || e.hashChange || e.downloadRequest) return;

      const url = new URL(e.destination.url);
      if (url.origin !== location.origin) return;

      e.intercept({
        handler: () => this.#navigateNow(url.pathname),
      });
    };

    try {
      nav.addEventListener('navigate', onNav);
      const prev = this.#cleanup;
      this.#cleanup = () => {
        try {
          nav.removeEventListener('navigate', onNav);
        } catch { /* */ }
        prev?.();
      };
    } catch {
      // Navigation API not available �� relying on popstate fallback
    }
  }

  #setupPopState(): void {
    const handler = () => {
      this.#navigateNow(location.pathname);
    };
    globalThis.addEventListener('popstate', handler);
    const prev = this.#cleanup;
    this.#cleanup = () => {
      globalThis.removeEventListener('popstate', handler);
      prev?.();
    };
  }

  // ������ Core navigation logic ������������������������������������������������������������������������

  #navigateNow(pathname: string): void {
    const { locale } = this.#parseUrlFrom(pathname);
    this.#el.setAttribute('current-path', pathname);
    this.#el.setAttribute('locale', locale);

    const opts = this.#options;
    if (!opts) return;

    // Update lang-switch immediately (before async fetch)
    if (this.#el.shadowRoot) {
      this.updateSwitch(this.#el.shadowRoot);
    }

    opts.contentLoader(pathname, locale).then(() => {
      // After content swap: update lang-switch again (content may have new one)
      if (this.#el.shadowRoot) {
        this.updateSwitch(this.#el.shadowRoot);
      }
      opts.onAfterSwap?.(pathname, locale);
    }).catch((err) => {
      console.warn('[openelement/router] content load failed:', err);
      // Fallback: full page reload
      location.reload();
    });
  }

  // ������ Internal helpers ����������������������������������������������������������������������������������

  #parseUrl(): { locale: string; path: string } {
    if (typeof globalThis.location === 'undefined') {
      const locale = this.#el.getAttribute('locale') || 'en';
      const path = this.#el.getAttribute('current-path') || '/';
      return { locale, path };
    }
    return this.#parseUrlFrom(location.pathname);
  }

  #parseUrlFrom(pathname: string): { locale: string; path: string } {
    const locales = this.locales;
    const defaultLocale = this.#el.getAttribute('locale') || locales[0] || 'en';
    const normalized = normalizeLocalePath(pathname, { locales, defaultLocale });
    return { locale: normalized.locale, path: normalized.path };
  }

  #parseLocales(): string[] {
    try {
      const raw = ((this.#el as unknown as Record<string, unknown>).locales) ||
        this.#el.getAttribute('locales');
      if (raw) {
        if (Array.isArray(raw)) return raw as string[];
        if (typeof raw === 'string') {
          try {
            return JSON.parse(raw);
          } catch {
            return ['en'];
          }
        }
      }
      return ['en'];
    } catch {
      return ['en'];
    }
  }
}

/**
 * v0.28.1: Locale path normalization �� kept local (not imported from @openelement/i18n)
 * because router publishes to JSR independently and i18n may not be in the dependency graph.
 * 15 lines of duplication is acceptable for independent packages.
 */
function normalizeLocalePath(
  pathname: string,
  options: { locales: string[]; defaultLocale: string },
): { locale: string; path: string } {
  const locales = options.locales.length > 0 ? options.locales : [options.defaultLocale];
  const defaultLocale = locales.includes(options.defaultLocale)
    ? options.defaultLocale
    : locales[0];
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const parts = cleanPath.split('/').filter(Boolean);
  const first = parts[0];
  const hasLocalePrefix = first !== undefined && locales.includes(first);
  return {
    locale: hasLocalePrefix ? first : defaultLocale,
    path: '/' + (hasLocalePrefix ? parts.slice(1) : parts).join('/'),
  };
}
