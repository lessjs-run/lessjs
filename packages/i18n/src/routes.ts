/**
 * @lessjs/i18n - Route helpers for i18n
 *
 * Helpers for creating locale-aware routes in LessJS.
 * ADR 0018: These helpers require explicit locale lists since
 * module-level state (getI18nLocales()) has been removed.
 */

/**
 * Generate getStaticPaths() return for locale-aware routes.
 *
 * ADR 0018: locales parameter is now REQUIRED (no module-level state fallback).
 * Import locales from virtual:less-i18n-data in route components.
 *
 * Usage in route file:
 * ```ts
 * import { i18nStaticPaths } from '@lessjs/i18n';
 * import { locales } from 'virtual:less-i18n-data';
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
