/**
 * Prism initialization — deferred script, runs after Prism core loads.
 * Handles DSD code blocks and adds default language class.
 */
(function () {
  function init() {
    if (typeof Prism === 'undefined') {
      // Prism not loaded yet — retry
      setTimeout(init, 100);
      return;
    }
    // Add default language-* class to <code> elements inside <pre> that lack one
    document.querySelectorAll('pre code').forEach(function (el) {
      var hasLang = Array.from(el.classList).some(function (c) {
        return c.startsWith('language-');
      });
      if (!hasLang) {
        el.classList.add('language-typescript');
      }
    });
    // Highlight everything
    Prism.highlightAll();
    // Re-highlight after DSD polyfill completes (if applicable)
    setTimeout(function () {
      Prism.highlightAll();
    }, 500);
  }
  // Run on DOMContentLoaded; if already past, run immediately
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
