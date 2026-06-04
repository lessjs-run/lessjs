import type { HubPackageRecord } from '../schema.ts';

export function loadHubPackageRecords(baseDir: string): HubPackageRecord[] {
  const records: HubPackageRecord[] = [];
  const packagesDir = `${baseDir}/packages`;

  try {
    const entries = Deno.readDirSync(packagesDir);
    for (const entry of entries) {
      const fullPath = `${packagesDir}/${entry.name}`;
      if (entry.isDirectory) {
        readPackageRecordFiles(fullPath, records);
      } else if (entry.name.endsWith('.json')) {
        records.push(JSON.parse(Deno.readTextFileSync(fullPath)));
      }
    }
  } catch {
    // Directory does not exist.
  }

  return records;
}

function readPackageRecordFiles(dir: string, records: HubPackageRecord[]): void {
  try {
    const entries = Deno.readDirSync(dir);
    for (const entry of entries) {
      if (!entry.name.endsWith('.json')) continue;
      records.push(JSON.parse(Deno.readTextFileSync(`${dir}/${entry.name}`)));
    }
  } catch {
    // Skip unreadable package record directories.
  }
}
