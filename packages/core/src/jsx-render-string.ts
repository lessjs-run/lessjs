/**
 * @lessjs/core - JSX to HTML string renderer.
 *
 * v0.29.0: Thin compatibility entrypoints over the internal structured render
 * IR. Traversal, trusted HTML, event markers, and serialization live in
 * render-ir.ts.
 */

export {
  renderDsdTree,
  type RenderNode,
  renderToDsdNode,
  renderToStaticNode,
  renderToString,
  serializeRenderNode,
  trustedHtmlNode,
} from './render-ir.ts';
