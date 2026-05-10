import { DecisionDocumentPage } from '../../components/decision-document-page.js';
import { DECISIONS } from '../../decision-data.js';

export class Decision0001Page extends DecisionDocumentPage {
  protected decision = DECISIONS[0];
}

customElements.define('page-decision-0001', Decision0001Page);
export default Decision0001Page;
export const tagName = 'page-decision-0001';
