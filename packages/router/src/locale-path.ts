/**
 * Locale-aware path normalization shared by @openelement/router and @openelement/i18n.
 *
 * This utility is intentionally placed in router (the lowest-level path package)
 * so both router and i18n can share a single implementation without i18n needing
 * to own routing concerns or router needing to depend on i18n.
 */

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
