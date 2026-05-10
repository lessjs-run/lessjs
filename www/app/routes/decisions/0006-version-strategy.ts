import { DecisionDocumentPage } from '../../components/decision-document-page.js';
import { DECISIONS } from '../../decision-data.js';

export class Decision0006Page extends DecisionDocumentPage {
  protected decision = DECISIONS[5];
}

customElements.define('page-decision-0006', Decision0006Page);
export default Decision0006Page;
export const tagName = 'page-decision-0006';
