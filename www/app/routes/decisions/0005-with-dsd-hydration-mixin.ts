import { DecisionDocumentPage } from '../../components/decision-document-page.js';
import { DECISIONS } from '../../decision-data.js';

export class Decision0005Page extends DecisionDocumentPage {
  protected decision = DECISIONS[4];
}

customElements.define('page-decision-0005', Decision0005Page);
export default Decision0005Page;
export const tagName = 'page-decision-0005';
