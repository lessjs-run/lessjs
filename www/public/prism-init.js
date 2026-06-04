/**
 * Prism initialization — deferred script.
 *
 * Primary highlighting is handled by <open-code-block> components via
 * connectedCallback. This script is a fallback that handles any bare
 * <pre><code> in the light DOM that isn't inside a <open-code-block>.
 */
(function () {
  const init = function () {
    if (typeof Prism === 'undefined') {
      setTimeout(init, 50);
      return;
    }
    // Add default language class + highlight bare <pre><code> in light DOM
    document.querySelectorAll('pre code').forEach(function (el) {
      let hasLang = false;
      for (let i = 0; i < el.classList.length; i++) {
        if (el.classList[i].indexOf('language-') === 0) {
          hasLang = true;
          break;
        }
      }
      if (!hasLang) el.classList.add('language-typescript');
    });
    Prism.highlightAll();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
