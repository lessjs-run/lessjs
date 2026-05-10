import { DecisionDocumentPage } from '../../components/decision-document-page.js';
import { DECISIONS } from '../../decision-data.js';

export class Decision0007Page extends DecisionDocumentPage {
  protected decision = DECISIONS[6];
}

customElements.define('page-decision-0007', Decision0007Page);
export default Decision0007Page;
export const tagName = 'page-decision-0007';
