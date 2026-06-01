import type {
  LessBlogOptions,
  LessBuildContextLike,
  LessHeaderNavLink,
  LessI18nContextOptions,
  LessNavSection,
  LessPluginMeta,
} from './build-types.ts';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

export function isLessBlogOptions(value: unknown): value is LessBlogOptions {
  return isRecord(value) &&
    (value.contentDir === undefined || typeof value.contentDir === 'string') &&
    (value.basePath === undefined || typeof value.basePath === 'string');
}

export function isLessHeaderNavLink(value: unknown): value is LessHeaderNavLink {
  return isRecord(value) && typeof value.href === 'string' && typeof value.label === 'string';
}

export function isLessNavSection(value: unknown): value is LessNavSection {
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

export function isLessI18nOptions(value: unknown): value is LessI18nContextOptions {
  return isRecord(value) &&
    isStringArray(value.locales) &&
    typeof value.defaultLocale === 'string';
}

export function createPluginMeta(overrides: Partial<LessPluginMeta> = {}): LessPluginMeta {
  return {
    blogOptions: null,
    navSections: [],
    headerNav: [],
    sitemapOptions: null,
    i18nOptions: null,
    ...overrides,
  };
}

export function isLessPluginMeta(value: unknown): value is LessPluginMeta {
  return isRecord(value) &&
    (value.blogOptions === null || isLessBlogOptions(value.blogOptions)) &&
    Array.isArray(value.navSections) &&
    value.navSections.every(isLessNavSection) &&
    Array.isArray(value.headerNav) &&
    value.headerNav.every(isLessHeaderNavLink) &&
    (value.sitemapOptions === null || isRecord(value.sitemapOptions)) &&
    (value.i18nOptions === null || isLessI18nOptions(value.i18nOptions));
}

export function isLessBuildContextLike(value: unknown): value is LessBuildContextLike {
  return isRecord(value) && isLessPluginMeta(value.plugins);
}
