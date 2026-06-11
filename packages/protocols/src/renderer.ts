/**
 * Renderer protocol contracts.
 *
 * These types describe openElement render semantics without importing the core
 * renderer, DOM implementations, Vite, Nitro, or server frameworks.
 */

export type ComponentLayer = 'static' | 'interactive' | 'pure-island';
export type HydrationStrategy = 'load' | 'idle' | 'visible' | 'only';
export type StrategySource = 'default' | 'manifest' | 'component' | 'route';

export type RenderPhase = 'instantiate' | 'render' | 'nested' | 'style' | 'serialize';
export type RenderErrorSeverity = 'error' | 'warning';

export interface RenderError {
  code: string;
  severity: RenderErrorSeverity;
  phase: string;
  tagName: string;
  message: string;
  recoverable: boolean;
}

export interface RendererProtocol {
  name: string;
  isTemplate?: (value: unknown) => boolean;
  render?: (value: unknown, tagName: string) => Promise<string>;
  extractStyles?: (componentClass: CustomElementConstructor) => string | undefined;
}

export interface RenderInput {
  tagName: string;
  componentClass: CustomElementConstructor;
  props: Record<string, unknown>;
  dsdOptions?: DsdOptions;
  nestingDepth: number;
}

export interface HydrationHint {
  tagName: string;
  layer: ComponentLayer;
  strategy?: HydrationStrategy;
}

export interface RenderOutput {
  html: string;
  errors: RenderError[];
  metrics: DsdRenderMetrics;
  hydrationHints: HydrationHint[];
}

export interface RenderHooks {
  beforeRender?: (input: RenderInput) => void;
  afterRender?: (output: RenderOutput) => void;
  onError?: (error: RenderError) => void;
}

export interface DsdOptions {
  delegatesFocus?: boolean;
  clonable?: boolean;
  serializable?: boolean;
  slotAssignment?: 'named' | 'manual';
  customElementRegistry?: boolean;
  layer?: ComponentLayer;
}

export interface DsdRenderMetrics {
  tagName: string;
  renderTimeMs: number;
  templateSize: number;
  layer: ComponentLayer;
  hasError: boolean;
  nestingDepth: number;
}

export interface RendererConformanceFixture {
  tagName: string;
  template: unknown;
  expectedHtml?: string;
}
