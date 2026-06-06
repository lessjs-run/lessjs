/**
 * NextVersion reader — checks docs/next/<version>/ for required files.
 */

export interface NextVersionData {
  versionPath: string;
  filesPresent: number;
  filesRequired: number;
  missingFiles: string[];
  complete: boolean;
}

const REQUIRED_FILES = [
  'README.md',
  'DESIGN.md',
  'TASKS.md',
  'ACCEPTANCE.md',
  'TEST_MATRIX.md',
  'DOCS_PLAN.md',
  'RISK_REGISTER.md',
  'RELEASE_CHECKLIST.md',
];

export function readNextVersion(rootDir: string, nextVersionPath: string): NextVersionData {
  const dir = `${rootDir}/${nextVersionPath}`;
  const versionPath = nextVersionPath;

  const missingFiles: string[] = [];
  let filesPresent = 0;

  for (const file of REQUIRED_FILES) {
    try {
      const content = Deno.readTextFileSync(`${dir}/${file}`);
      if (content.trim().length > 0) {
        filesPresent++;
      } else {
        missingFiles.push(`${file} (empty)`);
      }
    } catch {
      missingFiles.push(file);
    }
  }

  return {
    versionPath,
    filesPresent,
    filesRequired: REQUIRED_FILES.length,
    missingFiles,
    complete: filesPresent === REQUIRED_FILES.length && missingFiles.length === 0,
  };
}
