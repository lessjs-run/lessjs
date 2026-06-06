/**
 * ROADMAP.md reader — extracts version sequence and current line.
 */

export interface RoadmapData {
  versions: RoadmapVersion[];
  currentVersion: string;
  roadmapFileFound: boolean;
}

export interface RoadmapVersion {
  version: string;
  theme: string;
  status: string;
}

const VERSION_ROW_RE = /^\|\s*(v[\d.]+)\s*\|\s*(.+?)\s*\|\s*(\S+)\s*\|/gm;
const HEADER_KEYS = new Set(['Version', '-------', '------']);

export function readRoadmap(rootDir: string): RoadmapData {
  const path = `${rootDir}/docs/roadmap/ROADMAP.md`;
  let text: string;
  try {
    text = Deno.readTextFileSync(path);
  } catch {
    return { versions: [], currentVersion: '', roadmapFileFound: false };
  }

  const versions: RoadmapVersion[] = [];
  for (const match of text.matchAll(VERSION_ROW_RE)) {
    const v = match[1];
    // Skip header / separator rows
    if (HEADER_KEYS.has(v)) continue;
    versions.push({
      version: v,
      theme: match[2].trim(),
      status: match[3],
    });
  }

  // Find the first version with status "Current"
  const current = versions.find((v) => v.status === 'Current');

  return {
    versions,
    currentVersion: current?.version ?? '',
    roadmapFileFound: true,
  };
}

/**
 * Check if the given version is in the roadmap sequence.
 */
export function versionInSequence(versions: RoadmapVersion[], version: string): boolean {
  return versions.some((v) => v.version === version);
}
