/**
 * @lessjs/core - Entry Generators
 *
 * v0.5.0: requestIdleCallback-based lazy loading.
 * Eager islands (theme) load immediately, rest deferred to browser idle.
 * Zero DOM interaction — cannot interfere with DSD rendering.
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

export function generateClientEntry(
  islands: ClientIslandEntry[],
): string {
  if (islands.length === 0) {
    return '// LessJS Client Entry — No islands detected, zero client JS needed\n';
  }

  const islandMap = islands
    .map((i) => `  '${i.tagName}': () => import('${i.modulePath}')`)
    .join(',\n');

  const tags = islands.map((i) => `'${i.tagName}'`).join(', ');
  const eagerTags = islands
    .filter((i) => i.strategy === 'eager')
    .map((i) => `'${i.tagName}'`)
    .join(', ');
  const visibleTags = islands
    .filter((i) => i.strategy === 'visible')
    .map((i) => `'${i.tagName}'`)
    .join(', ');
  const lazyTags = islands
    .filter((i) => !i.strategy || i.strategy === 'lazy' || i.strategy === 'idle')
    .map((i) => `'${i.tagName}'`)
    .join(', ');

  return `// LessJS Client Entry (v0.6 — eager/lazy/visible)
// Eager islands load immediately.
// Visible islands load when their element enters the viewport (IntersectionObserver).
// Lazy islands deferred to browser idle.
// Zero DOM interaction — safe with DSD rendering.

var __map = {
${islandMap}
};
var __tags = [${tags}];

function __load(tag) {
  if (__map[tag]) {
    __map[tag]().catch(function(e) { console.warn('[LessJS]', tag, e); });
    __map[tag] = null;
  }
}

// Eager islands — load immediately (theme toggle, above-fold)
[${eagerTags || ''}].filter(Boolean).forEach(__load);

// Visible islands — load when their element enters viewport
${visibleTags ? `var __visibleTags = [${visibleTags || ''}];
var __observedTags = [];
function __observeVisible() {
  __visibleTags.forEach(function(tag) {
    var el = document.querySelector(tag);
    if (el && __observedTags.indexOf(tag) === -1) {
      __observedTags.push(tag);
      var obs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            __load(tag);
            obs.disconnect();
          }
        });
      }, { rootMargin: '200px' });
      obs.observe(el);
    }
  });
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __observeVisible);
} else {
  __observeVisible();
}` : '// No visible-strategy islands'}

// Defer remaining lazy islands to browser idle
${lazyTags ? `var __lazyTags = [${lazyTags || ''}];
var __deferred = function() {
  __lazyTags.forEach(__load);
  document.dispatchEvent(new CustomEvent('less:ready', {
    detail: { islands: __lazyTags }
  }));
};
var __schedule = window.requestIdleCallback || function(fn) { setTimeout(fn, 200); };
__schedule(__deferred);` : '// No lazy islands'}
`;
}
