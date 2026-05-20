/**
 * @lessjs/hub — Snapshot Management
 *
 * v0.19.0: Encode, decode, and verify SSR snapshot artifacts for the Hub.
 *
 * Snapshots are small HTML fragments from SSR/SSG rendering. They are
 * stored as text in the hub-index and served as inline previews in the
 * package detail pages.
 *
 * @see ADR-0030
 */

// ─── Types ───────────────────────────────────────────────────────────────

export interface SnapshotMeta {
  tagName: string;
  html: string;
  byteSize: number;
  renderedAt: string;
  durationMs: number;
}

// ─── Snapshot Encoding ───────────────────────────────────────────────────

/**
 * Encode a snapshot into a storable text representation.
 * Uses base64 encoding to avoid issues with embedded HTML in JSON.
 */
export function encodeSnapshot(html: string): string {
  // Use base64 encoding for safe JSON embedding
  return btoa(unescape(encodeURIComponent(html)));
}

/**
 * Decode a stored snapshot back into HTML.
 */
export function decodeSnapshot(encoded: string): string {
  return decodeURIComponent(escape(atob(encoded)));
}

/**
 * Build a SnapshotMeta from a rendered HTML fragment.
 */
export function buildSnapshotMeta(
  tagName: string,
  html: string,
  durationMs: number,
): SnapshotMeta {
  return {
    tagName,
    html,
    byteSize: new TextEncoder().encode(html).length,
    renderedAt: new Date().toISOString(),
    durationMs,
  };
}

/**
 * Maximum snapshot size (10KB). Snapshots larger than this should be
 * truncated or excluded from the index to prevent repo bloat.
 */
export const MAX_SNAPSHOT_BYTES = 10_240;

/**
 * Validate a snapshot meets size constraints.
 */
export function validateSnapshotSize(html: string): {
  valid: boolean;
  byteSize: number;
  message?: string;
} {
  const byteSize = new TextEncoder().encode(html).length;
  if (byteSize > MAX_SNAPSHOT_BYTES) {
    return {
      valid: false,
      byteSize,
      message:
        `Snapshot exceeds ${MAX_SNAPSHOT_BYTES} bytes (${byteSize} bytes). Consider truncating.`,
    };
  }
  return { valid: true, byteSize };
}
