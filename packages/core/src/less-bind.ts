/**
 * @lessjs/core - less:bind
 *
 * v0.6: `less:bind` connects server-rendered `data-ssr-props` to
 * client-side LitElement properties on upgrade.
 *
 * Architecture:
 *   - SSR: renderDSD() outputs `data-ssr-props="{...}"` on host elements
 *   - Client: customElements.define() upgrades the element
 *   - less:bind: connectedCallback reads data-ssr-props, sets properties
 *
 * This ensures consistency between SSR-rendered state and client-side
 * component state, even when the component has reactive properties that
 * trigger side effects on update.
 *
 * Usage (in component's connectedCallback):
 * ```ts
 * import { lessBind } from '@lessjs/core';
 *
 * class MyCounter extends LitElement {
 *   connectedCallback() {
 *     super.connectedCallback();
 *     lessBind(this);
 *   }
 * }
 * ```
 *
 * Or use the island() wrapper which calls less:bind automatically:
 * ```ts
 * import { island } from '@lessjs/core';
 * export default island('my-counter', MyCounter);
 * ```
 *
 * @module @lessjs/core/less-bind
 */

// Re-export from island.ts
export { getSSRProps, lessBind } from './island.js';
