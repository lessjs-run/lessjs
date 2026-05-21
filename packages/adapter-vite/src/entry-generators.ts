/**
 * @lessjs/core - Entry Generators
 *
 * v0.5.0: requestIdleCallback-based lazy loading.
 * Eager islands (theme) load immediately, rest deferred to browser idle.
 * Zero DOM interaction - cannot interfere with DSD rendering.
 *
 * v0.6: Added 'visible' strategy (IntersectionObserver-based).
 * Visible islands are loaded when their DOM element enters the viewport.
 */

export interface ClientIslandEntry {
  tagName: string;
  modulePath: string;
  isPackage?: boolean;
  strategy?: 'eager' | 'lazy' | 'visible' | 'idle';
}

const CUSTOM_ELEMENT_NAME_RE = /^[a-z][.0-9_a-z]*-[\-.0-9_a-z]*$/;
const UNSAFE_IMPORT_PROTOCOL_RE = /^(?:javascript|data|vbscript|node):/i;

function hasControlCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function validateClientIslandEntry(entry: ClientIslandEntry): void {
  if (!CUSTOM_ELEMENT_NAME_RE.test(entry.tagName)) {
    throw new Error(`Invalid island tagName: ${entry.tagName}`);
  }
  if (
    !entry.modulePath ||
    hasControlCharacter(entry.modulePath) ||
    /[\r\n]/.test(entry.modulePath) ||
    UNSAFE_IMPORT_PROTOCOL_RE.test(entry.modulePath)
  ) {
    throw new Error(`Invalid island modulePath for ${entry.tagName}: ${entry.modulePath}`);
  }
}

export function generateClientEntry(
  islands: ClientIslandEntry[],
): string {
  islands.forEach(validateClientIslandEntry);

  if (islands.length === 0) {
    return '// LessJS Client Entry - No islands detected, zero client JS needed\n';
  }

  const islandMap = islands
    .map((i) => `  ${JSON.stringify(i.tagName)}: () => import(${JSON.stringify(i.modulePath)})`)
    .join(',\n');

  const tags = islands.map((i) => JSON.stringify(i.tagName)).join(', ');
  const eagerTags = islands
    .filter((i) => i.strategy === 'eager')
    .map((i) => JSON.stringify(i.tagName))
    .join(', ');
  const visibleTags = islands
    .filter((i) => i.strategy === 'visible')
    .map((i) => JSON.stringify(i.tagName))
    .join(', ');
  const lazyTags = islands
    .filter((i) => !i.strategy || i.strategy === 'lazy' || i.strategy === 'idle')
    .map((i) => JSON.stringify(i.tagName))
    .join(', ');

  return `// LessJS Client Entry (v0.6 - eager/lazy/visible)
// Eager islands load immediately.
// Visible islands load when their element enters the viewport (IntersectionObserver).
// Lazy islands deferred to browser idle.
// Zero DOM interaction - safe with DSD rendering.

var log = {
  warn: function() { var a = ['[LessJS]']; a.push.apply(a, arguments); console.warn.apply(console, a); },
  error: function() { var a = ['[LessJS]']; a.push.apply(a, arguments); console.error.apply(console, a); },
};

var __map = {
${islandMap}
};
var __tags = [${tags}];

function __load(tag) {
  if (__map[tag]) {
    __map[tag]().catch(function(e) { log.warn(tag, e); });
    __map[tag] = null;
  }
}

// Eager islands - load immediately (theme toggle, above-fold)
[${eagerTags || ''}].filter(Boolean).forEach(__load);

// Visible islands - load when their element enters viewport
${
    visibleTags
      ? `var __visibleTags = [${visibleTags || ''}];
var __observedTags = [];
function __observeVisible() {
  __visibleTags.forEach(function(tag) {
    var els = document.querySelectorAll(tag);
    if (els.length > 0 && __observedTags.indexOf(tag) === -1) {
      __observedTags.push(tag);
      els.forEach(function(el) {
        var obs = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              __load(tag);
              obs.disconnect();
            }
          });
        }, { rootMargin: '200px' });
        obs.observe(el);
      });
    }
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __observeVisible);
} else {
  __observeVisible();
}`
      : '// No visible-strategy islands'
  }

// Defer remaining lazy islands to browser idle
${
    lazyTags
      ? `var __lazyTags = [${lazyTags || ''}];
var __deferred = function() {
  __lazyTags.forEach(__load);
  document.dispatchEvent(new CustomEvent('less:ready', {
    detail: { islands: __lazyTags }
  }));
};
var __schedule = window.requestIdleCallback || window.requestAnimationFrame || function(fn) { setTimeout(fn, 50); };
__schedule(__deferred);`
      : '// No lazy islands'
  }
`;
}
