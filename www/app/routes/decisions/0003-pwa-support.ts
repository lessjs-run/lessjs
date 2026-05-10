import { DecisionDocumentPage } from '../../components/decision-document-page.js';
import { DECISIONS } from '../../decision-data.js';

export class Decision0003Page extends DecisionDocumentPage {
  protected decision = DECISIONS[2];
}

customElements.define('page-decision-0003', Decision0003Page);
export default Decision0003Page;
export const tagName = 'page-decision-0003';
