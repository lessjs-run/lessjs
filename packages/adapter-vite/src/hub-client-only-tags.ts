import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { OpenElementError } from '@openelement/core/errors';

export interface HubClientOnlyTag {
  tagName?: string;
  compatibility?: string;
}

export interface HubClientOnlyRecord {
  tags?: HubClientOnlyTag[];
}

export interface HubClientOnlyTagsResult {
  status: 'missing' | 'loaded' | 'error';
  path: string;
  tags: string[];
  error?: unknown;
}

export interface HubClientOnlyTagsOptions {
  onError?: 'warn' | 'throw';
  logger?: {
    debug?: (message: string) => void;
    info?: (message: string) => void;
    warn?: (message: string) => void;
  };
}

/**
 * Load generated Hub data through the module boundary and extract client-only
 * tag names. Missing data is optional; a present but broken generated module is
 * a real build error unless the caller explicitly asks for a warning.
 */
export async function loadHubClientOnlyTags(
  root: string,
  options: HubClientOnlyTagsOptions = {},
): Promise<HubClientOnlyTagsResult> {
  const hubDataPath = join(root, 'app', 'data', 'registry', 'hub-data.ts');
  if (!existsSync(hubDataPath)) {
    options.logger?.debug?.(`Hub data not found at ${hubDataPath}`);
    return { status: 'missing', path: hubDataPath, tags: [] };
  }

  try {
    const hubData = await import(pathToFileURL(hubDataPath).href) as {
      default?: Record<string, HubClientOnlyRecord>;
    };
    const tags = extractHubClientOnlyTags(hubData.default ?? {});
    if (tags.length > 0) {
      options.logger?.info?.(
        `Hub client-only tags: ${tags.length} tag(s) discovered from ${hubDataPath}`,
      );
    }
    return { status: 'loaded', path: hubDataPath, tags };
  } catch (error) {
    const message = `Generated Hub data exists but failed to import: ${hubDataPath}. ` +
      `${error instanceof Error ? error.message : String(error)}`;

    if (options.onError === 'throw') {
      throw new OpenElementError(message, 'HUB_DATA_IMPORT_ERROR', 500, false);
    }

    options.logger?.warn?.(message);
    return { status: 'error', path: hubDataPath, tags: [], error };
  }
}

export function extractHubClientOnlyTags(
  records: Record<string, HubClientOnlyRecord>,
): string[] {
  const tags = new Set<string>();
  for (const record of Object.values(records)) {
    for (const tag of record.tags ?? []) {
      if (tag.compatibility === 'client-only' && tag.tagName) {
        tags.add(tag.tagName);
      }
    }
  }
  return [...tags];
}
