/**
 * SOP reader — parses docs/sop/<version>/README.md for task status.
 */

export interface SopData {
  status: string;
  totalTasks: number;
  completedTasks: number;
  sopFileFound: boolean;
  sopPath: string;
}

const STATUS_LINE_RE = /^>\s*Status:\s*(\S+)/m;
const CHECKBOX_RE = /^-\s*\[(x| )\]/gm;

export function readSop(rootDir: string, version: string): SopData {
  // Determine the version for SOP lookup — use dotted form
  const sopPath = `docs/sop/${version}/README.md`;
  const fullPath = `${rootDir}/${sopPath}`;

  let text: string;
  try {
    text = Deno.readTextFileSync(fullPath);
  } catch {
    return { status: '', totalTasks: 0, completedTasks: 0, sopFileFound: false, sopPath };
  }

  const statusMatch = STATUS_LINE_RE.exec(text);
  const status = statusMatch ? statusMatch[1] : '';

  const checkboxes = [...text.matchAll(CHECKBOX_RE)];
  const totalTasks = checkboxes.length;
  const completedTasks = checkboxes.filter((m) => m[1] === 'x').length;

  return { status, totalTasks, completedTasks, sopFileFound: true, sopPath };
}
