/**
 * @openelement/core - DSD Render Metric Collector.
 *
 * Collects DSD render metrics during SSR for post-build reporting.
 * Pure runtime class — zero node:* / Vite / build-tool dependencies.
 */

import type { DsdRenderMetrics } from './render-schemas.js';
import type { DsdReport } from './render-schemas.js';

/** Collects DSD render metrics during SSR for post-build reporting. */
export class DsdRenderCollector {
  private _metrics: DsdRenderMetrics[] = [];

  add(metrics: DsdRenderMetrics): void {
    this._metrics.push(metrics);
  }

  get metrics(): readonly DsdRenderMetrics[] {
    return this._metrics;
  }

  getReport(): DsdReport {
    const dsdComponents = this._metrics.filter((m) => m.layer !== 'pure-island');
    const pureIslands = this._metrics.filter((m) => m.layer === 'pure-island');
    // v0.14.3: Only dsd-interactive components need hydration.
    // dsd-static components have no event bindings - they don't need hydration.
    const hydrated = this._metrics.filter(
      (m) => !m.hasError && m.layer === 'dsd-interactive',
    );

    return {
      totalComponents: this._metrics.length,
      dsdComponents: dsdComponents.length,
      hydratedComponents: hydrated.length,
      pureIslands: pureIslands.length,
      totalDsdSize: this._metrics.reduce((sum, m) => sum + m.templateSize, 0),
      maxNestingDepth: Math.max(...this._metrics.map((m) => m.nestingDepth), 0),
    };
  }
}
