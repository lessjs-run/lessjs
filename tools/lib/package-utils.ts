/**
 * Shared package utilities for tool scripts.
 * ADR-0079 / H1: Extracted from check-package-graph.ts and run-package-graph-task.ts.
 */
export interface PackageInfo {
  name: string;
  version: string;
  path: string;
  dependencies: Record<string, string>;
}

export function readPackage(dir: string): PackageInfo {
  const denoJson = JSON.parse(Deno.readTextFileSync(`${dir}/deno.json`));
  return {
    name: denoJson.name || '',
    version: denoJson.version || '0.0.0',
    path: dir,
    dependencies: denoJson.dependencies || {},
  };
}
