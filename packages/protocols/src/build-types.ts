/**
 * @openelement/protocols — Shared LessJS build-time contract types.
 *
 * Zero-dependency contract layer. These are pure data interfaces consumed
 * by feature packages (@openelement/content, @openelement/i18n) and implemented by
 * build adapters (@openelement/adapter-vite).
 */

/** Blog options stored in the build context by @openelement/content. */
export interface LessBlogOptions {
  contentDir?: string;
  basePath?: string;
}

/** Navigation section from @openelement/content. */
export interface LessNavSection {
  section: string;
  items: Array<{ path: string; label: string; order?: number }>;
}

/** Header navigation link. */
export interface LessHeaderNavLink {
  href: string;
  label: string;
}

/** i18n options stored in the build context by @openelement/i18n. */
export interface LessI18nContextOptions {
  locales: string[];
  defaultLocale: string;
  [key: string]: unknown;
}

/** Plugin metadata interface: data bridge between sub-plugins and build context. */
export interface LessPluginMeta {
  blogOptions: LessBlogOptions | null;
  navSections: LessNavSection[];
  headerNav: LessHeaderNavLink[];
  sitemapOptions: Record<string, unknown> | null;
  i18nOptions: LessI18nContextOptions | null;
  [key: string]: unknown;
}

/** Minimal build context interface that sub-plugins can use. */
export interface LessBuildContextLike {
  plugins: LessPluginMeta;
}
