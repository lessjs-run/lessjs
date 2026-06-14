/**
 * @openelement/element — Public types.
 */

import type { VNode } from '@openelement/core';
import type { StyleSheetLike } from '@openelement/core/style-sheet';

export interface ElementDefinition<
  Props extends Record<string, unknown> = Record<string, unknown>,
> {
  styles?: StyleSheetLike | StyleSheetLike[];
  render: (props: Props) => VNode | null;
}
