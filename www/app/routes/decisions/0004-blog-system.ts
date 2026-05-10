import { DecisionDocumentPage } from '../../components/decision-document-page.js';
import { DECISIONS } from '../../decision-data.js';

export class Decision0004Page extends DecisionDocumentPage {
  protected decision = DECISIONS[3];
}

customElements.define('page-decision-0004', Decision0004Page);
export default Decision0004Page;
export const tagName = 'page-decision-0004';
