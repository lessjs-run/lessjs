/**
 * Compatibility wrapper for the SSG render pipeline.
 *
 * The Vite-free implementation lives in @openelement/ssg as of v0.36.2.
 * adapter-vite keeps this module so existing imports continue to work while
 * build orchestration delegates to the new SSG package.
 */

import {
  resolveDynamicRoutePath,
  type SsgPageOutput,
  ssgRender as ssgRenderCore,
  type SsgRenderEvidence,
  type SsgRenderOptions,
  type SsrBundle,
} from '@openelement/ssg';
import { printBuildManifest } from '../build-manifest.js';
import type { OpenElementBuildContext } from '../build-context.js';

export { resolveDynamicRoutePath };
export type { SsgPageOutput, SsgRenderEvidence, SsgRenderOptions, SsrBundle };

export async function ssgRender(
  module: SsrBundle,
  options: SsgRenderOptions,
  ctx?: OpenElementBuildContext,
): Promise<void> {
  return await ssgRenderCore(module, options, createSsgRenderEvidence(ctx));
}

export function createSsgRenderEvidence(
  ctx?: OpenElementBuildContext,
): SsgRenderEvidence {
  if (!ctx) return {};

  return {
    i18nOptions: ctx.plugins.i18nOptions,
    localIslandMeta: ctx.phase1.islandMeta,
    packageIslandDecls: ctx.phase1.packageIslandDecls,
    packageManifests: ctx.phase1.packageManifests,
    admissionDecisions: ctx.phase1.ssrAdmissionPlan?.decisions || [],
    cemClassifications: ctx.phase1.cemClassifications,
    onPrintBuildManifest: (input) => {
      printBuildManifest(input);
    },
    onGenerateSitemap: async (outputDir) => {
      if (!ctx.plugins.sitemapOptions) return;
      const { generateSitemap } = await import('@openelement/content/sitemap') as {
        generateSitemap: (dir: string, opts: unknown) => string[];
      };
      generateSitemap(outputDir, ctx.plugins.sitemapOptions);
    },
  };
}
