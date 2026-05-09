/**
 * Prism initialization — deferred script, runs after Prism core loads.
 *
 * Two key challenges solved:
 * 1. Shadow DOM isolation: Prism.highlightAll() uses document.querySelectorAll
 *    which can't reach into Shadow DOM. We recursively traverse all shadow roots.
 * 2. DSD timing: DSD polyfill runs on DOMContentLoaded, so we re-highlight after.
 *
 * Also adds default 'language-typescript' class to <code> blocks lacking one.
 */
(function () {
  /**
   * Recursively find all <pre><code> elements across the document AND
   * all shadow roots, then highlight each one.
   */
  function highlightAllDeep() {
    if (typeof Prism === 'undefined') {
      // Prism not loaded yet — retry
      setTimeout(highlightAllDeep, 100);
      return;
    }

    // Phase 1: Light DOM
    addDefaultLangClass(document);
    Prism.highlightAll();

    // Phase 2: Recursively traverse all shadow roots
    walkShadowRoots(document.body);

    // Phase 3: Re-run after DSD polyfill / Lit upgrade
    setTimeout(function () {
      if (typeof Prism !== 'undefined') {
        Prism.highlightAll();  // Light DOM again (DSD polyfill may have moved elements)
        walkShadowRoots(document.body);
      }
    }, 500);
  }

  /**
   * Walk all elements recursively, descending into shadow roots.
   * For each <pre><code> found, add a default language class and highlight.
   */
  function walkShadowRoots(root) {
    // Find all elements in this scope that have shadow roots
    var iter = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT, null);
    var node;
    while ((node = iter.nextNode())) {
      // Check this node's shadow root
      if (node.shadowRoot) {
        addDefaultLangClass(node.shadowRoot);
        highlightCodesInScope(node.shadowRoot);
        // Recursively check nested shadow roots
        walkShadowRoots(node.shadowRoot);
      }
    }
  }

  /**
   * Add default language-typescript to <code> elements inside <pre> that lack a language class.
   */
  function addDefaultLangClass(scope) {
    var codes = scope.querySelectorAll('pre code');
    codes.forEach(function (el) {
      var hasLang = Array.from(el.classList).some(function (c) {
        return c.startsWith('language-');
      });
      if (!hasLang) {
        el.classList.add('language-typescript');
      }
    });
  }

  /**
   * Find all <code[class*=language-]> in scope and highlight each one.
   */
  function highlightCodesInScope(scope) {
    var codes = scope.querySelectorAll('code[class*=language-]');
    codes.forEach(function (el) {
      Prism.highlightElement(el);
    });
  }

  // Run on DOMContentLoaded; if already past, run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', highlightAllDeep);
  } else {
    highlightAllDeep();
  }
})();
