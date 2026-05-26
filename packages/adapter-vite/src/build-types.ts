/**
 * @lessjs/adapter-vite - Build-time shared types.
 *
 * Originally in @lessjs/core (G10 fix) to break the circular dependency
 * between adapter-vite <-> content/i18n. Moved back to adapter-vite in
 * v0.22 (SOP-002) — the circular dependency is resolved because
 * adapter-vite no longer imports from content or i18n at module level.
 *
 * These types contain zero Vite-specific imports - they are pure data
 * interfaces that content and i18n use to communicate with the build context.
 * The actual LessBuildContext class (which has Vite Plugin dependencies)
 * remains in adapter-vite and implements these interfaces.
 */

/** Blog options stored in the build context by @lessjs/content */
export interface LessBlogOptions {
  contentDir?: string;
  basePath?: string;
}

/** Navigation section from @lessjs/content */
export interface LessNavSection {
  section: string;
  items: Array<{ path: string; label: string; order?: number }>;
}

/** Header navigation link */
export interface LessHeaderNavLink {
  href: string;
  label: string;
}

/** i18n options stored in the build context by @lessjs/i18n */
export interface LessI18nContextOptions {
  locales: string[];
  defaultLocale: string;
  [key: string]: unknown;
}

/**
 * Plugin metadata interface - the data bridge between sub-plugins
 * (content, i18n) and the build context.
 *
 * This is the interface that content/i18n import instead of the full
 * LessBuildContext class. The adapter-vite PluginMeta class implements
 * this interface and adds Vite-specific Plugin references.
 */
export interface LessPluginMeta {
  blogOptions: LessBlogOptions | null;
  navSections: LessNavSection[];
  headerNav: LessHeaderNavLink[];
  sitemapOptions: Record<string, unknown> | null;
  i18nOptions: LessI18nContextOptions | null;
  /**
   * Allow Vite-specific plugin references (blogDataPlugin, i18nDataPlugin)
   * without importing Vite types into core. adapter-vite's PluginMeta adds
   * these as `Plugin | null` fields.
   */
  [key: string]: unknown;
}

/**
 * Minimal build context interface that sub-plugins can use.
 * Only exposes the `plugins` field - the only part content/i18n need.
 */
export interface LessBuildContextLike {
  plugins: LessPluginMeta;
}
