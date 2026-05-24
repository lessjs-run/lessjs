/**
 * Fixture: Parent component that outputs a client-only child tag
 *
 * This component renders HTML that includes a child tag which is
 * marked as client-only (ssr: false). The SSR renderer should
 * skip rendering the child tag and leave it as an empty custom element.
 *
 * Note: We don't extend HTMLElement here because Deno doesn't have
 * DOM globals. The class is just a placeholder for metadata export.
 */

export const less = { ssr: true, dsd: true, hydrate: 'load' };

export default class ParentWithClientChild {
  // Placeholder - in browser this would extend HTMLElement
  textContent: string | null = null;

  render() {
    return `
      <div class="parent">
        <h2>Parent Component (SSR-able)</h2>
        <client-only-child></client-only-child>
        <p>Parent content continues here.</p>
      </div>
    `;
  }
}

export const tagName = 'parent-with-client-child';
