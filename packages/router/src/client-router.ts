/**
 * @lessjs/router — Client Router
 *
 * URLPattern-based routing for SPA navigation.
 * Replaces all manual string parsing previously in less-layout.
 */

// deno-lint-ignore no-explicit-any
declare const navigation: any;

export interface RouterState {
  locale: string;
  path: string;
  locales: string[];
}

const LOCALE_LABELS: Record<string, string> = {
  zh: '\u4E2D\u6587',
  en: 'EN',
};

/**
 * Router class that encapsulates all locale/path/navigation logic.
 * Instantiated by less-layout — no signal dependencies.
 */
export class Router {
  #el: HTMLElement;
  #locales: string[];

  constructor(element: HTMLElement) {
    this.#el = element;
    this.#locales = this.#parseLocales();
  }

  /** Available locales from [locales] attribute or prop */
  get locales(): string[] {
    return this.#locales;
  }

  /** Current locale from attribute or URL */
  get locale(): string {
    const prop = (this.el as unknown as Record<string, unknown>).locale;
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
    const target = this.#locales.find((l) => l !== locale) || this.#locales[0];
    return `/${target}${path}`;
  }

  /** Label for the other locale (e.g. "中文" or "EN") */
  switchLabel(): string {
    const { locale } = this.#parseUrl();
    const target = this.#locales.find((l) => l !== locale) || this.#locales[0];
    return LOCALE_LABELS[target] || target.toUpperCase();
  }

  /** Add locale prefix to a path if needed */
  localize(path: string): string {
    if (this.#locales.length <= 1) return path;
    if (path.startsWith('http')) return path;
    for (const loc of this.#locales) {
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

  /** Parse current URL via URLPattern */
  #parseUrl(): { locale: string; path: string } {
    try {
      const pattern = new URLPattern({ pathname: '/:locale?/:page*' });
      const m = pattern.exec(globalThis.location?.pathname ?? '/')?.pathname?.groups;
      return {
        locale: m?.locale || 'en',
        path: '/' + (m?.page || ''),
      };
    } catch {
      // URLPattern not available (SSR) — fallback
      return { locale: 'en', path: '/' };
    }
  }

  /** Parse locales from element attribute or prop */
  #parseLocales(): string[] {
    try {
      const el = this.el as unknown as Record<string, unknown>;
      const raw = el.locales || this.#el.getAttribute('locales');
      if (!raw) return ['en'];
      if (Array.isArray(raw)) return raw as string[];
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
}

/**
 * Set up client-side SPA navigation using Navigation API + URLPattern.
 * Returns an AbortController for cleanup.
 */
export function setupClientRouter(
  onNavigate: (state: RouterState) => void,
): AbortController {
  const ac = new AbortController();

  try {
    navigation.addEventListener(
      'navigate',
      (
        e: {
          canIntercept: boolean;
          hashChange: boolean;
          downloadRequest: boolean;
          destination: { url: string };
          intercept: (opts: { handler: () => void }) => void;
        },
      ) => {
        if (!e.canIntercept || e.hashChange || e.downloadRequest) return;

        const url = new URL(e.destination.url);
        if (url.origin !== location.origin) return;

        const pattern = new URLPattern({ pathname: '/:locale?/:page*' });
        const m = pattern.exec(url.pathname)?.pathname?.groups;

        if (m) {
          e.intercept({
            handler: () =>
              onNavigate({
                locale: m.locale || 'en',
                path: '/' + (m.page || ''),
                locales: [], // filled by caller
              }),
          });
        }
      },
      { signal: ac.signal },
    );
  } catch {
    // Navigation API not available — graceful degradation
  }

  return ac;
}
