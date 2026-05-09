/**
 * Prism initialization — deferred script, runs after Prism core loads.
 *
 * Strategy: simple recursive DOM walk, no createNodeIterator.
 * Handles both light DOM and shadow roots reliably.
 * MutationObserver catches dynamically added content (SPA nav).
 */
(function () {
  var HIGHLIGHTED = 'data-prism-highlighted';

  function init() {
    if (typeof Prism === 'undefined') {
      setTimeout(init, 50);
      return;
    }
    highlightAll();
    // Retry after DSD polyfill / Lit upgrade settles
    setTimeout(highlightAll, 500);
    // Watch for new content (SPA navigation, dynamic islands)
    var obs = new MutationObserver(function () {
      highlightAll();
    });
    if (document.body) {
      obs.observe(document.body, { childList: true, subtree: true });
    }
  }

  /** Walk the entire DOM tree, descend into shadow roots, highlight any <pre><code>. */
  function highlightAll() {
    walkAndHighlight(document.body);
  }

  /**
   * Recursively walk a subtree.
   * For each element: if it has a shadow root, query the shadow root directly.
   * Then recurse into both shadow root children AND regular DOM children.
   */
  function walkAndHighlight(node) {
    if (!node || node.nodeType !== 1) return;
    var el = node;

    // Check this element's shadow root
    if (el.shadowRoot) {
      highlightScope(el.shadowRoot);
      // Recurse into shadow roots
      var shadowKids = el.shadowRoot.children;
      for (var i = 0; i < shadowKids.length; i++) {
        walkAndHighlight(shadowKids[i]);
      }
    }

    // Check direct <pre><code> children in light DOM
    highlightScope(el);

    // Recurse into regular DOM children
    var kids = el.children;
    for (var i = 0; i < kids.length; i++) {
      walkAndHighlight(kids[i]);
    }
  }

  /**
   * Find all <pre><code> in the given scope (Document, ShadowRoot, or Element),
   * add default language class, and call Prism.highlightElement().
   */
  function highlightScope(scope) {
    var codes = scope.querySelectorAll('pre code');
    codes.forEach(function (el) {
      if (el.hasAttribute(HIGHLIGHTED)) return;
      var hasLang = false;
      var classes = el.classList;
      for (var j = 0; j < classes.length; j++) {
        if (classes[j].indexOf('language-') === 0) { hasLang = true; break; }
      }
      if (!hasLang) {
        el.classList.add('language-typescript');
      }
      try {
        Prism.highlightElement(el);
        el.setAttribute(HIGHLIGHTED, '');
      } catch (e) {
        // Prism may fail on some elements; skip
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
