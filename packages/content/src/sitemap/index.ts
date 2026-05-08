/**
 * @lessjs/content/sitemap - Sitemap module
 *
 * Generates sitemap.xml and robots.txt from SSG output.
 */

export { generateSitemap, renderRobotsTxt, renderSitemapXml, scanHtmlFiles } from './generator.ts';
export type { SitemapOptions, SitemapUrl } from '../types.ts';
