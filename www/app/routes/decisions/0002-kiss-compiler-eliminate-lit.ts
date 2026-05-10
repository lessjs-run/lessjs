import { DecisionDocumentPage } from '../../components/decision-document-page.js';
import { DECISIONS } from '../../decision-data.js';

export class Decision0002Page extends DecisionDocumentPage {
  protected decision = DECISIONS[1];
}

customElements.define('page-decision-0002', Decision0002Page);
export default Decision0002Page;
export const tagName = 'page-decision-0002';
