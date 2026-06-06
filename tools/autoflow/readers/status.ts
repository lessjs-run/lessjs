/**
 * STATUS.md reader — extracts current version line, NextVersion path, and gate list.
 */

export interface StatusData {
  currentVersion: string;
  nextVersionPath: string;
  gateOrder: string[];
  packageVersion: string;
  statusFileFound: boolean;
}

const CURRENT_VERSION_RE = /^## Current Version Line:\s*(.+?)\s*\(/m;
const NEXT_VERSION_RE = /package:\s*`(docs\/next\/[^`]+)`/;
const GATE_LINE_RE = /^deno task (\S+)/gm;

export function readStatus(rootDir: string): StatusData {
  const path = `${rootDir}/docs/status/STATUS.md`;
  let text: string;
  try {
    text = Deno.readTextFileSync(path);
  } catch {
    return {
      currentVersion: '',
      nextVersionPath: '',
      gateOrder: [],
      packageVersion: '',
      statusFileFound: false,
    };
  }

  const currentVersionMatch = CURRENT_VERSION_RE.exec(text);
  const currentVersion = currentVersionMatch ? currentVersionMatch[1].trim() : '';

  const nextVersionMatch = NEXT_VERSION_RE.exec(text);
  const nextVersionPath = nextVersionMatch ? nextVersionMatch[1] : '';

  // Extract gate order from the code block
  const gateBlockMatch = /```bash\n([\s\S]*?)```/.exec(text);
  const gateBlock = gateBlockMatch ? gateBlockMatch[1] : '';
  const gates: string[] = [];
  for (const match of gateBlock.matchAll(GATE_LINE_RE)) {
    gates.push(match[1]);
  }

  // Extract package version line
  const pkgMatch = /\*\*v([\d.]+)\*\*/.exec(text);
  const packageVersion = pkgMatch ? `v${pkgMatch[1]}` : '';

  return {
    currentVersion,
    nextVersionPath,
    gateOrder: gates,
    packageVersion,
    statusFileFound: true,
  };
}
