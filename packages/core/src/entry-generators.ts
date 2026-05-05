/**
 * @lessjs/core - Entry Generators
 *
 * v0.5.0: requestIdleCallback-based lazy loading.
 * Eager islands (theme) load immediately, rest deferred to browser idle.
 * Zero DOM interaction — cannot interfere with DSD rendering.
 */

export interface ClientIslandEntry {
  tagName: string;
  modulePath: string;
  isPackage?: boolean;
  strategy?: 'eager' | 'lazy';
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

  return `// LessJS Client Entry (auto-generated — v0.5.0 idle-lazy)
// Eager islands load immediately, others deferred to browser idle.
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

// Defer remaining islands to browser idle
var __deferred = function() {
  __tags.forEach(__load);
  document.dispatchEvent(new CustomEvent('less:ready', {
    detail: { islands: __tags }
  }));
};

var __schedule = window.requestIdleCallback || function(fn) { setTimeout(fn, 200); };
__schedule(__deferred);
`;
}
