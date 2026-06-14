import type { Plugin } from 'vite';

/**
 * Stub modules for retained optional product-line packages.
 *
 * v0.40 removes framework interop adapters from the core package graph, so
 * deleted adapter packages are intentionally not stubbed here.
 */
export const OPTIONAL_PACKAGE_STUBS: Record<string, string> = {
  '@openelement/content': [
    'export async function loadBlogData() { return { posts: [], basePath: "" }; }',
  ].join('\n'),
  '@openelement/content/sitemap': [
    'export function generateSitemap() { return []; }',
  ].join('\n'),
  '@openelement/app/i18n': [
    'export function loadI18nData() { return { locales: [], defaultLocale: "en" }; }',
  ].join('\n'),
};

export function optionalPackageStubsPlugin(): Plugin {
  return {
    name: 'open:optional-package-stubs',
    enforce: 'pre',
    async resolveId(id) {
      if (!(id in OPTIONAL_PACKAGE_STUBS)) return;
      const resolved = await this.resolve(id, undefined, { skipSelf: true });
      if (resolved) return null;
      return `\0open:optional-stub:${id}`;
    },
    load(id) {
      const prefix = '\0open:optional-stub:';
      if (!id.startsWith(prefix)) return;
      return OPTIONAL_PACKAGE_STUBS[id.slice(prefix.length)];
    },
  };
}
