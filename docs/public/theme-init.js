// LessJS Theme Initialization — L2 (browser API)
// Runs before page render to prevent FOUC (Flash of Unstyled Content).
// Reads saved theme from localStorage or prefers-color-scheme.
// Default: light theme (white background, black text).
// deno-lint-ignore no-var no-window
(function () {
  if (typeof document === 'undefined') return;
  var saved = localStorage.getItem('less-theme');
  var prefersDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  var theme = saved || (prefersDark ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
  // Remove anti-flash cloak — done before first paint
  var cloak = document.getElementById('less-anti-flash');
  if (cloak) cloak.remove();
})();
