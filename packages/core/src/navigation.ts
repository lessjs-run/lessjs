/**
 * @lessjs/core - Navigation API utility
 *
 * WHATWG Navigation API (§7.4) integration for LessJS.
 * Provides modern client-side navigation replacing the History API.
 *
 * When Navigation API is available (Chrome 102+), uses native navigation.
 * Falls back to History API for unsupported browsers.
 */

// ─── Navigation API Type Declarations ────────────────────────────
// Minimal type declarations for the Navigation API.
// When Deno/browsers ship native types, these will be superseded.

import { createLogger } from './logger.js';

const log = createLogger('core');

interface NavigationDestination {
  url: string;
  index: number;
  sameDocument: boolean;
}

interface NavigationEvent extends Event {
  destination: NavigationDestination;
  navigationType: 'push' | 'replace' | 'reload' | 'traverse';
}

interface NavigateOptions {
  history?: 'auto' | 'push' | 'replace';
}

interface Navigation {
  navigate(url: string, options?: NavigateOptions): void;
  back(): void;
  forward(): void;
  addEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject,
    options?: AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: string,
    callback: EventListenerOrEventListenerObject,
    options?: EventListenerOptions,
  ): void;
}

// deno-lint-ignore no-var
declare var navigation: Navigation | undefined;

/** Check if Navigation API is available */
export function hasNavigationApi(): boolean {
  return typeof (globalThis as Record<string, unknown>).navigation !== 'undefined';
}

/**
 * Navigate to a new URL using Navigation API (preferred) or History API (fallback).
 *
 * Navigation API (WHATWG §7.4):
 *   - navigation.navigate() — push new entry
 *   - navigation.back() / forward() — traverse history
 *   - Fires navigatesuccess / navigateerror events
 *
 * History API (fallback):
 *   - history.pushState() + popstate event
 */
export function navigate(url: string, options?: { replace?: boolean }): void {
  if (hasNavigationApi()) {
    const nav = (globalThis as Record<string, unknown>).navigation as Navigation;
    if (options?.replace) {
      nav.navigate(url, { history: 'replace' });
    } else {
      nav.navigate(url);
    }
  } else {
    // Fallback: History API
    if (options?.replace) {
      history.replaceState(null, '', url);
    } else {
      history.pushState(null, '', url);
    }
    // Dispatch popstate for listeners (History API doesn't fire it on pushState)
    globalThis.dispatchEvent(new PopStateEvent('popstate'));
  }
}

/** Navigation event callback type */
export type NavigationCallback = (
  url: URL,
  navigationType: 'push' | 'replace' | 'back' | 'forward' | 'reload',
) => void;

/**
 * Subscribe to navigation events.
 * Uses Navigation API's navigatesuccess when available,
 * falls back to popstate event.
 *
 * @returns Cleanup function to unsubscribe
 */
export function onNavigate(callback: NavigationCallback): () => void {
  if (hasNavigationApi()) {
    const nav = (globalThis as Record<string, unknown>).navigation as Navigation;
    const handler = (e: Event) => {
      const navEvent = e as NavigationEvent;
      const dest = navEvent.destination;
      const url = new URL(dest.url);
      const navType = navEvent.navigationType === 'traverse'
        ? (navEvent.destination.index < 0 ? 'back' : 'forward')
        : navEvent.navigationType;
      callback(url, navType);
    };
    nav.addEventListener('navigatesuccess', handler);
    return () => nav.removeEventListener('navigatesuccess', handler);
  } else {
    // Fallback: popstate
    const handler = () => {
      callback(new URL(globalThis.location.href), 'push');
    };
    globalThis.addEventListener('popstate', handler);
    return () => globalThis.removeEventListener('popstate', handler);
  }
}

/**
 * Match a URL against route patterns using URLPattern API (WHATWG §7.2).
 * Falls back to simple string matching if URLPattern is not available.
 *
 * @returns Match result with extracted params, or null if no match
 */
export function matchRoute(
  url: string | URL,
  patterns: Array<{ path: string; name: string }>,
): { name: string; params: Record<string, string> } | null {
  const urlObj = typeof url === 'string' ? new URL(url, 'http://localhost') : url;
  const pathname = urlObj.pathname;

  for (const pattern of patterns) {
    if (typeof URLPattern !== 'undefined') {
      try {
        const p = new URLPattern({ pathname: pattern.path });
        const result = p.exec({ pathname });
        if (result) {
          return {
            name: pattern.name,
            params: (result.pathname?.groups ?? {}) as Record<string, string>,
          };
        }
      } catch (e) {
        // URLPattern might not support this pattern — fall through to regex
        log.debug(
          `URLPattern failed for "${pattern.path}": ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    // Fallback: simple regex matching for :param patterns
    const regexStr = pattern.path.replace(/:([^/]+)/g, '(?<$1>[^/]+)');
    const regex = new RegExp(`^${regexStr}$`);
    const match = pathname.match(regex);
    if (match?.groups) {
      return { name: pattern.name, params: match.groups as Record<string, string> };
    }
  }

  return null;
}
