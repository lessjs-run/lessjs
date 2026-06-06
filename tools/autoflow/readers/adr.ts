/**
 * ADR reader — indexes docs/adr/ directory.
 */

export interface AdrData {
  count: number;
  adrs: AdrInfo[];
  adrDirFound: boolean;
}

export interface AdrInfo {
  file: string;
  status: string;
  title: string;
}

const ADR_STATUS_RE = /^-\s*Status:\s*(\S+)/m;
const ADR_TITLE_RE = /^#\s+(ADR-\d+):?\s*(.*)/m;

export function readAdr(rootDir: string): AdrData {
  const adrDir = `${rootDir}/docs/adr`;
  let entries: Deno.DirEntry[];
  try {
    entries = [...Deno.readDirSync(adrDir)];
  } catch {
    return { count: 0, adrs: [], adrDirFound: false };
  }

  const adrs: AdrInfo[] = [];
  for (const entry of entries) {
    if (!entry.isFile || !entry.name.startsWith('ADR-') || !entry.name.endsWith('.md')) continue;

    let text: string;
    try {
      text = Deno.readTextFileSync(`${adrDir}/${entry.name}`);
    } catch {
      continue;
    }

    const statusMatch = ADR_STATUS_RE.exec(text);
    const titleMatch = ADR_TITLE_RE.exec(text);

    adrs.push({
      file: entry.name,
      status: statusMatch ? statusMatch[1] : 'unknown',
      title: titleMatch ? titleMatch[2].trim() : titleMatch ? titleMatch[1] : entry.name,
    });
  }

  return {
    count: adrs.length,
    adrs,
    adrDirFound: true,
  };
}
