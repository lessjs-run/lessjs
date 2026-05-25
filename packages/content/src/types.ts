/**
 * @lessjs/content - Type definitions
 *
 * Unified content plugin for LessJS.
 * Blog + Nav + Sitemap - build-time only, zero runtime.
 */

import type { BlogPost, BlogPostFrontmatter, LessBlogOptions } from './blog/types.ts';

// ─── Blog Module Types ──────────────────────────────────────────

export type { BlogPost, BlogPostFrontmatter, LessBlogOptions };

// ─── Nav Module Types ──────────────────────────────────────────

/** A single navigation item (sidebar link) */
export interface NavItem {
  /** URL path (e.g. '/guide/getting-started') */
  path: string;
  /** Display label */
  label: string;
  /** Sort order within section (lower = higher, default 100) */
  order?: number;
}

/** A navigation section (sidebar group) */
export interface NavSection {
  /** Section heading */
  section: string;
  /** Navigation items within this section */
  items: NavItem[];
}

/** Header navigation link */
export interface HeaderNavLink {
  /** URL (internal path or external href) */
  href: string;
  /** Display label */
  label: string;
}

/** Route meta exported from route files */
export interface RouteMeta {
  /** Section heading to group under (required) */
  section: string;
  /** Display label in navigation (required) */
  label: string;
  /** Sort order within section (optional, default 100) */
  order?: number;
}

/** Nav module configuration */
export interface NavOptions {
  /** Directory containing route files to scan. Defaults to app/routes. */
  routesDir?: string;
  /** Header navigation links (manually configured - changes rarely) */
  headerNav?: HeaderNavLink[];
  /** File patterns to exclude from nav scanning */
  exclude?: string[];
}

// ─── Sitemap Module Types ───────────────────────────────────────

/** Sitemap URL entry */
export interface SitemapUrl {
  /** Full URL (e.g. 'https://lessjs.org/guide/getting-started') */
  loc: string;
  /** Last modification date (ISO 8601) */
  lastmod?: string;
  /** Change frequency hint */
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** Priority (0.0-1.0) */
  priority?: number;
}

/** Sitemap module configuration */
export interface SitemapOptions {
  /** Site hostname (required) e.g. 'https://lessjs.org' */
  hostname: string;
  /** URL paths to exclude */
  exclude?: string[];
  /** Default changefreq (default: 'weekly') */
  changefreq?: SitemapUrl['changefreq'];
  /** Default priority (default: 0.7) */
  priority?: number;
  /** Whether to generate robots.txt alongside sitemap.xml */
  robotsTxt?: boolean;
}

// ─── Unified Content Plugin Options ────────────────────────────

/** Options for the lessContent() plugin */
export interface LessContentOptions {
  /** Blog module config. Pass options to enable, false to disable */
  blog?: LessBlogOptions | false;
  /** Nav module config. Pass options to enable, falsy to disable */
  nav?: NavOptions;
  /** Sitemap module config. Pass options to enable, falsy to disable */
  sitemap?: SitemapOptions;
}
