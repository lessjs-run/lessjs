/**
 * CDN URL policy for Hub browser previews.
 *
 * Default is jsDelivr for npm packages because it has a clearer static-file SLA
 * and less transform-time tracking than esm.sh. JSR package browser imports
 * still use esm.sh/jsr until jsDelivr or unpkg provide a compatible JSR module
 * endpoint.
 */

export type CdnProvider = 'jsdelivr' | 'unpkg' | 'esm.sh' | 'self-hosted';

export interface CdnUrlOptions {
  source?: 'npm' | 'jsr';
  tag?: string;
}

function configuredProvider(): CdnProvider {
  try {
    const value = Deno.env.get('LESS_CDN_BASE')?.trim();
    if (
      value === 'unpkg' || value === 'jsdelivr' || value === 'esm.sh' || value === 'self-hosted'
    ) {
      return value;
    }
    if (value?.startsWith('http://') || value?.startsWith('https://')) {
      return 'self-hosted';
    }
  } catch {
    // Deno env access may be unavailable under restricted permissions.
  }
  return 'jsdelivr';
}

function configuredSelfHostedBase(): string {
  try {
    const value = Deno.env.get('LESS_CDN_BASE')?.trim();
    if (value?.startsWith('http://') || value?.startsWith('https://')) {
      return value.replace(/\/+$/, '');
    }
  } catch {
    // Ignore missing env permission and use a relative vendor path.
  }
  return '/vendor';
}

export function toCdnUrl(importSpec: string, options: CdnUrlOptions = {}): string {
  const source = options.source ?? 'npm';
  const provider = configuredProvider();

  if (source === 'jsr') {
    const suffix = options.tag ? `/${options.tag}` : '';
    if (provider === 'self-hosted') {
      return `${configuredSelfHostedBase()}/jsr/${importSpec}${suffix}`;
    }
    return `https://esm.sh/jsr/${importSpec}${suffix}`;
  }

  switch (provider) {
    case 'unpkg':
      return `https://unpkg.com/${importSpec}`;
    case 'esm.sh':
      return `https://esm.sh/${importSpec}`;
    case 'self-hosted':
      return `${configuredSelfHostedBase()}/npm/${importSpec}`;
    case 'jsdelivr':
    default:
      return `https://cdn.jsdelivr.net/npm/${importSpec}`;
  }
}
