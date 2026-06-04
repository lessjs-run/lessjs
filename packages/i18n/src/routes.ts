/**
 * @openelement/i18n - Route helpers for i18n
 *
 * Helpers for creating locale-aware routes in openElement.
 * ADR 0018: These helpers require explicit locale lists since
 * module-level state (getI18nLocales()) has been removed.
 */

/**
 * Generate getStaticPaths() return for locale-aware routes.
 *
 * ADR 0018: locales parameter is now REQUIRED (no module-level state fallback).
 * Import locales from @openelement/generated/i18n in route components.
 *
 * Usage in route file:
 * ```ts
 * import { i18nStaticPaths } from '@openelement/i18n';
 * import { locales } from '@openelement/generated/i18n';
 *
 * export function getStaticPaths() {
 *   return i18nStaticPaths(locales); // -> [{ locale: 'en' }, { locale: 'zh' }]
 * }
 * ```
 */
export function i18nStaticPaths(
  locales: string[],
): Array<Record<string, string>> {
  return locales.map((locale) => ({ locale }));
}

/**
 * Switch a URL path to a different locale.
 * e.g. switchLocale('/en/guide/overview', 'zh') -> '/zh/guide/overview'
 *      switchLocale('/guide/overview', 'zh', ['en', 'zh']) -> '/zh/guide/overview'
 */
export function switchLocale(
  currentPath: string,
  targetLocale: string,
  locales: string[],
): string {
  // Strip any existing locale prefix
  let stripped = currentPath;
  for (const loc of locales) {
    if (stripped === `/${loc}` || stripped.startsWith(`/${loc}/`)) {
      stripped = stripped.slice(loc.length + 1) || '/';
      break;
    }
  }
  // Prepend target locale
  return `/${targetLocale}${stripped}`;
}

export interface LocalePath {
  locale: string;
  path: string;
  localizedPath: string;
  isDefaultLocalePath: boolean;
}

export function normalizeLocalePath(
  pathname: string,
  options: { locales: string[]; defaultLocale: string },
): LocalePath {
  const locales = options.locales.length > 0 ? options.locales : [options.defaultLocale];
  const defaultLocale = locales.includes(options.defaultLocale)
    ? options.defaultLocale
    : locales[0];
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const parts = cleanPath.split('/').filter(Boolean);
  const first = parts[0];
  const hasLocalePrefix = first !== undefined && locales.includes(first);
  const locale = hasLocalePrefix ? first : defaultLocale;
  const rest = hasLocalePrefix ? parts.slice(1) : parts;
  const path = rest.length === 0 ? '/' : `/${rest.join('/')}`;
  return {
    locale,
    path,
    localizedPath: locale === defaultLocale ? path : `/${locale}${path === '/' ? '' : path}`,
    isDefaultLocalePath: locale === defaultLocale,
  };
}
