/**
 * @openelement/adapter-vite — Optional Package Stubs.
 *
 * Extracted from index.ts in v0.22 (SOP-004: adapter-vite decomposition).
 *
 * When a consumer project imports package islands (e.g. @openelement/adapter-lit)
 * but hasn't installed the package, Vite would normally fail to resolve
 * the bare specifier. These stubs provide no-op implementations so the
 * build doesn't break — the consumer gets a build warning instead of an error.
 *
 * This is pure data + a simple plugin factory. No logic, no dependencies.
 */

import type { Plugin } from 'vite';

/**
 * Stub modules for optional adapters that consumers may reference
 * in their config but haven't installed. Each stub exports no-op
 * functions so the import resolves without error.
 */
export const OPTIONAL_PACKAGE_STUBS: Record<string, string> = {
  '@openelement/adapter-lit': [
    'class DsdLitElement extends (globalThis.HTMLElement || class{}) {}',
    'export { DsdLitElement };',
    'export function installLitAdapter() {}',
    'export function uninstallLitAdapter() {}',
    'export const WithDsdHydration = undefined;',
  ].join('\n'),
  '@openelement/adapter-lit/ssr': [
    'export function installLitAdapter() {}',
    'export function uninstallLitAdapter() {}',
  ].join('\n'),
  '@openelement/adapter-vanilla': [
    'class DsdVanillaElement extends (globalThis.HTMLElement || class{}) {}',
    'export { DsdVanillaElement };',
    'export function installVanillaAdapter() {}',
    'export function uninstallVanillaAdapter() {}',
  ].join('\n'),
  '@openelement/adapter-vanilla/ssr': [
    'export function installVanillaAdapter() {}',
    'export function uninstallVanillaAdapter() {}',
  ].join('\n'),
  '@openelement/adapter-react': [
    'class DsdReactElement extends (globalThis.HTMLElement || class{}) {}',
    'export { DsdReactElement };',
    'export function installReactAdapter() {}',
    'export function uninstallReactAdapter() {}',
    'export const WithDsdHydration = undefined;',
    'export function renderReactToString() { return ""; }',
    'export function isReactElement() { return false; }',
  ].join('\n'),
  '@openelement/adapter-react/ssr': [
    'export function installReactAdapter() {}',
    'export function uninstallReactAdapter() {}',
  ].join('\n'),
  '@openelement/content': [
    'export async function loadBlogData() { return { posts: [], basePath: "" }; }',
  ].join('\n'),
  '@openelement/content/sitemap': [
    'export function generateSitemap() { return []; }',
  ].join('\n'),
  '@openelement/i18n': [
    'export function loadI18nData() { return { locales: [], defaultLocale: "en" }; }',
  ].join('\n'),
};

/**
 * Create a Vite plugin that provides stub implementations for
 * optional adapter packages that may not be installed.
 *
 * The plugin intercepts resolveId for known optional packages.
 * If the real package isn't found (resolve returns null), it falls
 * back to a virtual module with stub exports.
 */
export function optionalPackageStubsPlugin(): Plugin {
  return {
    name: 'less:optional-package-stubs',
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
