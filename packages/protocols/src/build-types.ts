/**
 * @openelement/protocols - Shared openElement build-time contract types.
 *
 * Zero-dependency contract layer. These are pure data interfaces consumed
 * by feature packages (@openelement/content, @openelement/i18n) and implemented by
 * build adapters (@openelement/adapter-vite).
 */

/** Blog options stored in the build context by @openelement/content. */
export interface OpenElementBlogOptions {
  contentDir?: string;
  basePath?: string;
}

/** Navigation section from @openelement/content. */
export interface OpenElementNavSection {
  section: string;
  items: Array<{ path: string; label: string; order?: number }>;
}

/** Header navigation link. */
export interface OpenElementHeaderNavLink {
  href: string;
  label: string;
}

/** i18n options stored in the build context by @openelement/i18n. */
export interface OpenElementI18nContextOptions {
  locales: string[];
  defaultLocale: string;
  [key: string]: unknown;
}

/** Plugin metadata interface: data bridge between sub-plugins and build context. */
export interface OpenElementPluginMeta {
  blogOptions: OpenElementBlogOptions | null;
  navSections: OpenElementNavSection[];
  headerNav: OpenElementHeaderNavLink[];
  sitemapOptions: Record<string, unknown> | null;
  i18nOptions: OpenElementI18nContextOptions | null;
  [key: string]: unknown;
}

/** Minimal build context interface that sub-plugins can use. */
export interface OpenElementBuildContextLike {
  plugins: OpenElementPluginMeta;
}
