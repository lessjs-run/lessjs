/**
 * @lessjs/adapter-vite — SSR data stubs.
 *
 * Single source of truth for empty data patterns used when
 * blog/i18n content plugins are not configured. Previously
 * duplicated across 4 files.
 */
export const EMPTY_BLOG_DATA = [
  'export const posts = [];',
  'export function getPostBySlug() { return undefined; }',
  'export function getBlogOptions() { return {}; }',
].join('\n');

export const EMPTY_I18N_DATA = [
  'export const locales = [];',
  'export function getDefaultLocale() { return "en"; }',
  'export function getI18nOptions() { return null; }',
].join('\n');
