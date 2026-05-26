/**
 * Compatibility re-export for v0.23.
 *
 * Canonical shared build contract types live in @lessjs/protocols. This path
 * remains temporarily so existing consumers of @lessjs/adapter-vite/build-types
 * keep working during the migration window.
 */
export type {
  LessBlogOptions,
  LessBuildContextLike,
  LessHeaderNavLink,
  LessI18nContextOptions,
  LessNavSection,
  LessPluginMeta,
} from '@lessjs/protocols/build-types';
