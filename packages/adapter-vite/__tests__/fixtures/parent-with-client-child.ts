/**
 * Fixture: Parent component that outputs a client-only child tag
 *
 * This component renders HTML that includes a child tag which is
 * marked as client-only (ssr: false). The SSR renderer should
 * skip rendering the child tag and leave it as an empty custom element.
 */

export const less = { ssr: true, dsd: true, hydrate: 'eager' };

export default class ParentWithClientChild extends HTMLElement {
  render() {
    return `
      <div class="parent">
        <h2>Parent Component (SSR-able)</h2>
        <client-only-child></client-only-child>
        <p>Parent content continues here.</p>
      </div>
    `;
  }

  connectedCallback() {
    const renderOutput = this.render();
    if (this.shadowRoot) {
      this.shadowRoot.innerHTML = renderOutput;
    } else {
      const shadow = this.attachShadow({ mode: 'open' });
      shadow.innerHTML = renderOutput;
    }
  }
}

export const tagName = 'parent-with-client-child';
