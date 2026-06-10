/**
 * Hub landing page - v0.23 artifact-first.
 *
 * Package evidence surface: compatibility tiers, validation status, trust policy.
 */
export const meta = { section: 'Registry', label: 'Hub', order: 0 };
export const tagName = 'page-hub';

import { DsdElement } from '@openelement/core';
import { StyleSheet } from '@openelement/style-sheet';
import { daisyClassSheet, openPropsTokenSheet } from '@openelement/ui';
const sheet = new StyleSheet();
sheet.replaceSync(`
  :host { display: block; }
  .shell { max-width: 1120px; margin: 0 auto; padding: 44px var(--size-6) 72px; }
  h1 { margin: 0; color: var(--gray-10); font-size: clamp(2.5rem, 7vw, 5rem); line-height: 0.95; }
  .lede { max-width: 680px; margin: 18px 0 0; color: var(--gray-6); font-size: 16px; line-height: 1.75; }
  .grid { margin-top: 38px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  @media (max-width: 780px) { .grid { grid-template-columns: 1fr; } }
  @media (max-width: 560px) { .shell { padding: 32px 16px 56px; } }
`);

export class HubPage extends DsdElement {
  static override styles = [daisyClassSheet, openPropsTokenSheet, sheet];

  override render() {
    return (
      
        <div class='shell'>
          <h1>Hub</h1>
          <p class='lede'>
            The Hub is package evidence, not a marketplace. Every listed
            package shows compatibility tier, SSR/DSD status, manifest
            validation, and last verified date.
          </p>
          <div class='grid'>
            <a class='card card-bordered p-5 text-inherit no-underline' href='/registry'>
              <span class='badge badge-outline mb-3'>Browse</span>
              <h2 class='card-title'>Package Index</h2>
              <p>Browse registered Web Components with compatibility tiers and DSD conformance status.</p>
            </a>
            <a class='card card-bordered p-5 text-inherit no-underline' href='/architecture/package-compatibility'>
              <span class='badge badge-outline mb-3'>Validate</span>
              <h2 class='card-title'>Compatibility Check</h2>
              <p>Understand SSR, DSD, island, and client-only classifications for third-party components.</p>
            </a>
            <a class='card card-bordered p-5 text-inherit no-underline' href='/architecture/standards-registry'>
              <span class='badge badge-outline mb-3'>Policy</span>
              <h2 class='card-title'>Trust Policy</h2>
              <p>Manifest hash verification, artifact integrity, and submission trust gates.</p>
            </a>
          </div>
        </div>
      
    );
  }
}

customElements.define('page-hub', HubPage);
export default HubPage;
