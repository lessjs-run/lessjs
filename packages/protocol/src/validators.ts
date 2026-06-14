import type {
  OpenElementBlogOptions,
  OpenElementBuildContextLike,
  OpenElementHeaderNavLink,
  OpenElementI18nContextOptions,
  OpenElementNavSection,
  OpenElementPluginMeta,
} from './build-types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isOpenBlogOptions(value: unknown): value is OpenElementBlogOptions {
  return isRecord(value) &&
    (value.contentDir === undefined || typeof value.contentDir === 'string') &&
    (value.basePath === undefined || typeof value.basePath === 'string');
}

export function isOpenHeaderNavLink(value: unknown): value is OpenElementHeaderNavLink {
  return isRecord(value) && typeof value.href === 'string' && typeof value.label === 'string';
}

export function isOpenNavSection(value: unknown): value is OpenElementNavSection {
  return isRecord(value) &&
    typeof value.section === 'string' &&
    Array.isArray(value.items) &&
    value.items.every((item) =>
      isRecord(item) &&
      typeof item.path === 'string' &&
      typeof item.label === 'string' &&
      (item.order === undefined || typeof item.order === 'number')
    );
}

export function isOpenI18nOptions(value: unknown): value is OpenElementI18nContextOptions {
  return isRecord(value) &&
    isStringArray(value.locales) &&
    typeof value.defaultLocale === 'string';
}

export function createPluginMeta(
  overrides: Partial<OpenElementPluginMeta> = {},
): OpenElementPluginMeta {
  return {
    blogOptions: null,
    navSections: [],
    headerNav: [],
    sitemapOptions: null,
    i18nOptions: null,
    ...overrides,
  };
}

export function isOpenPluginMeta(value: unknown): value is OpenElementPluginMeta {
  return isRecord(value) &&
    (value.blogOptions === null || isOpenBlogOptions(value.blogOptions)) &&
    Array.isArray(value.navSections) &&
    value.navSections.every(isOpenNavSection) &&
    Array.isArray(value.headerNav) &&
    value.headerNav.every(isOpenHeaderNavLink) &&
    (value.sitemapOptions === null || isRecord(value.sitemapOptions)) &&
    (value.i18nOptions === null || isOpenI18nOptions(value.i18nOptions));
}

export function isOpenBuildContextLike(value: unknown): value is OpenElementBuildContextLike {
  return isRecord(value) && isOpenPluginMeta(value.plugins);
}
