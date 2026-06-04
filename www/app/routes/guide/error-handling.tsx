export const meta = { section: 'Production', label: 'Error Handling', order: 30 };
import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { openPropsTokenSheet } from '@openelement/ui/open-props-tokens';
import { pageStyles } from '../../components/page-styles.js';
import '@openelement/ui/open-code-block';

const routeSheet = new StyleSheet();
routeSheet.replaceSync(pageStyles + `
  .error-hierarchy { padding: var(--size-4); background: var(--gray-1); border-left: 2px solid var(--gray-4); border-radius: 0 var(--radius-1) var(--radius-1) 0; margin: var(--size-4) 0; font-family: var(--font-mono); font-size: var(--font-size-1); line-height: var(--font-lineheight-4); color: var(--gray-7); }
`);

export class ErrorHandlingPage extends DsdElement {
  static override styles = [openPropsTokenSheet, routeSheet];

  override render() {
    return (
      <div class="container">
        <h1>Error Handling</h1>
        <p class="subtitle">openElement separates framework errors, build-time render errors, API errors, and browser island failures so production output stays clear and safe.</p>
        <h2>Error Hierarchy</h2>
        <div class="error-hierarchy">OpenElementError |-- NotFoundError 404 |-- ValidationError 422 |-- RateLimitError 429 |-- SsrRenderError 500 |-- IslandUpgradeError 500</div>
        <h2>Operational vs Programming</h2>
        <p>Operational errors return structured status and diagnostics. Programming errors such as render failures, broken imports, or invalid route metadata fail the build or surface dev diagnostics.</p>
        <h2>Structured Logging</h2>
        <p>Use <span class="inline-code">createLogger(scope)</span> for scoped DEBUG, INFO, WARN, and ERROR messages. Logs identify the subsystem without leaking private runtime state.</p>
        <div class="nav-row">
          <a href="/guide/security-middleware" class="nav-link">Security and Middleware</a>
          <a href="/guide/testing" class="nav-link">Testing</a>
        </div>
      </div>
    );
  }
}

customElements.define('page-error-handling', ErrorHandlingPage);
export default ErrorHandlingPage;
export const tagName = 'page-error-handling';
