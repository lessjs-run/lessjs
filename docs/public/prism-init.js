/**
 * Prism initialization — deferred script, runs after Prism core loads.
 *
 * Primary highlighting is handled by <code-block> components via
 * connectedCallback. This script is a safety net that:
 * 1. Highlights bare <pre><code> in light DOM (if any)
 * 2. Retries after DSD polyfill settles for non-<code-block> code
 *
 * Also adds default 'language-typescript' class to <code> blocks lacking one.
 */
(function () {
  function init() {
    if (typeof Prism === 'undefined') {
      setTimeout(init, 100);
      return;
    }
    // Light DOM: add default lang class + highlight
    document.querySelectorAll('pre code').forEach(function (el) {
      var hasLang = Array.from(el.classList).some(function (c) {
        return c.startsWith('language-');
      });
      if (!hasLang) {
        el.classList.add('language-typescript');
      }
    });
    Prism.highlightAll();
    // Retry after DSD polyfill / Lit upgrade settles
    setTimeout(function () {
      if (typeof Prism !== 'undefined') Prism.highlightAll();
    }, 500);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
