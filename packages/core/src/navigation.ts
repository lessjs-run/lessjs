/**
 * @lessjs/core - Navigation API utility
 *
 * WHATWG Navigation API (section7.4) integration for LessJS.
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

// ─── Module-level shared state for History API monkey-patching ────
// v0.14.3 B-4 fix: Use a shared reference counter so multiple onNavigate
// subscribers don't corrupt each other's monkey-patches.
// Each call to onNavigate increments the counter; each unsubscribe decrements.
// Only the first subscriber installs the patch; only the last removes it.
let _historyPatchCount = 0;

// Capture originals lazily - not at module load time (SSR/tests may not
// have `history`). Use null as sentinel; patching is only needed when
// onNavigate() is actually called in a browser context.
// G12 fix: Use specific type instead of any
let _origPushState: ((data: unknown, unused: string, url?: string | URL | null) => void) | null =
  null;
let _origReplaceState: ((data: unknown, unused: string, url?: string | URL | null) => void) | null =
  null;
// H-08 fix: Use three-state navigation type instead of boolean
let _lastNavType: 'push' | 'replace' | 'back' = 'back';

// H-11 fix: Cache compiled regex patterns to avoid recompilation on each matchRoute call
const _routeRegexCache = new Map<string, RegExp>();

function _ensureHistoryOriginals(): void {
  // v0.14.5: Guard against SSR/SSG environments where history is unavailable
  if (typeof globalThis.history === 'undefined') return;
  if (_origPushState === null) {
    _origPushState = history.pushState.bind(history);
    _origReplaceState = history.replaceState.bind(history);
  }
}

function _installHistoryPatch(): void {
  _ensureHistoryOriginals();
  if (_historyPatchCount === 0) {
    // H-08 fix: Track navigation type correctly (push vs replace)
    history.pushState = ((data: unknown, unused: string, url?: string | URL | null) => {
      _lastNavType = 'push';
      _origPushState!(data, unused, url);
    }) as unknown as typeof history.pushState;
    history.replaceState = ((data: unknown, unused: string, url?: string | URL | null) => {
      _lastNavType = 'replace';
      _origReplaceState!(data, unused, url);
    }) as unknown as typeof history.replaceState;
  }
  _historyPatchCount++;
}

function _uninstallHistoryPatch(): void {
  _historyPatchCount--;
  if (_historyPatchCount === 0) {
    history.pushState = _origPushState!;
    history.replaceState = _origReplaceState!;
  }
}

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
  return (
    typeof (globalThis as Record<string, unknown>).navigation !== 'undefined'
  );
}

/**
 * Navigate to a new URL using Navigation API (preferred) or History API (fallback).
 *
 * Navigation API (WHATWG section7.4):
 *   - navigation.navigate() - push new entry
 *   - navigation.back() / forward() - traverse history
 *   - Fires navigatesuccess / navigateerror events
 *
 * History API (fallback):
 *   - history.pushState() + popstate event
 */
export function navigate(url: string, options?: { replace?: boolean }): void {
  if (hasNavigationApi()) {
    const nav = (globalThis as Record<string, unknown>)
      .navigation as Navigation;
    if (options?.replace) {
      nav.navigate(url, { history: 'replace' });
    } else {
      nav.navigate(url);
    }
  } else {
    // Fallback: History API
    // H-09 fix: Guard against SSR environments where history is undefined
    if (typeof globalThis.history !== 'undefined') {
      if (options?.replace) {
        history.replaceState(null, '', url);
      } else {
        history.pushState(null, '', url);
      }
      // Dispatch popstate for listeners (History API doesn't fire it on pushState)
      globalThis.dispatchEvent(new PopStateEvent('popstate'));
    }
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
    const nav = (globalThis as Record<string, unknown>)
      .navigation as Navigation;
    const handler = (e: Event) => {
      const navEvent = e as NavigationEvent;
      const dest = navEvent.destination;
      const url = new URL(dest.url);
      const navType = navEvent.navigationType === 'traverse'
        ? navEvent.destination.index < 0 ? 'back' : 'forward'
        : navEvent.navigationType;
      callback(url, navType);
    };
    nav.addEventListener('navigatesuccess', handler);
    return () => nav.removeEventListener('navigatesuccess', handler);
  } else {
    // Fallback: popstate
    // v0.14.3: Track whether the last navigation was a pushState/replaceState
    // so we can distinguish 'push' from 'back' in the popstate handler.
    // History API fires popstate for back/forward navigation but NOT for
    // pushState/replaceState - so we dispatch it manually in navigate()
    // and use a flag to tell them apart.
    //
    // B-4 fix: Monkey-patching uses a shared reference counter (_historyPatchCount)
    // declared at module scope. Multiple onNavigate() subscribers share the same
    // patched history methods. Each unsubscriber only decrements the counter;
    // the original methods are restored only when the last subscriber leaves.
    // H-08 fix: Use _lastNavType to distinguish push/replace/back navigation
    const handler = () => {
      const navType: 'push' | 'replace' | 'back' = _lastNavType;
      _lastNavType = 'back'; // Reset to back after reading
      callback(new URL(globalThis.location.href), navType);
    };

    _installHistoryPatch();
    globalThis.addEventListener('popstate', handler);
    return () => {
      globalThis.removeEventListener('popstate', handler);
      _uninstallHistoryPatch();
    };
  }
}

/**
 * Match a URL against route patterns using URLPattern API (WHATWG section7.2).
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
        // URLPattern might not support this pattern - fall through to regex
        log.debug(
          `URLPattern failed for "${pattern.path}": ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    }

    // Fallback: simple regex matching for :param patterns
    // v0.14.5: Escape special regex characters in param names
    // to prevent ReDoS and SyntaxError on old engines
    // H-11 fix: Use cached regex to avoid recompilation on each call
    let regex = _routeRegexCache.get(pattern.path);
    if (!regex) {
      const regexStr = pattern.path.replace(
        /:([^/]+)/g,
        (_match, paramName: string) => {
          const escaped = paramName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return `(?<${escaped}>[^/]+)`;
        },
      );
      regex = new RegExp(`^${regexStr}$`);
      _routeRegexCache.set(pattern.path, regex);
    }
    const match = pathname.match(regex);
    if (match?.groups) {
      return {
        name: pattern.name,
        params: match.groups as Record<string, string>,
      };
    }
  }

  return null;
}
