/**
 * Type declarations for LessJS virtual data modules.
 *
 * These allow TypeScript to understand imports from virtual:less-blog-data
 * and virtual:less-i18n-data in route components.
 *
 * ADR 0018: Virtual data modules replace module-level state in
 * @lessjs/content and @lessjs/i18n with Vite virtual module exports.
 */

declare module 'virtual:less-blog-data' {
  import type { BlogPost, LessBlogOptions } from '@lessjs/content';
  export const posts: BlogPost[];
  export function getPostBySlug(slug: string): BlogPost | undefined;
  export function getBlogOptions(): LessBlogOptions;
}

declare module 'virtual:less-i18n-data' {
  import type { LessI18nOptions } from '@lessjs/i18n';
  export const locales: string[];
  export function getDefaultLocale(): string;
  export function getI18nOptions(): LessI18nOptions | null;
}
