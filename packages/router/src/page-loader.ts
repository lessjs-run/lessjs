/**
 * Page Loader — MD Content File Loader
 * Reads .md files with frontmatter and renders through marked.
 */
import { marked } from 'marked';

export interface PageData {
  html: string;
  meta: {
    title: string;
    section: string;
    label: string;
    order?: number;
    excerpt?: string;
  };
}

/**
 * Parse YAML frontmatter manually (lightweight, no gray-matter dependency).
 */
function parseFrontmatter(raw: string): {
  meta: Record<string, unknown>;
  content: string;
} {
  const match = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!match) {
    return { meta: {}, content: raw };
  }

  const yamlBlock = match[1];
  const content = match[2];
  const meta: Record<string, unknown> = {};

  for (const line of yamlBlock.split('\n')) {
    const kv = line.match(/^(\w[\w\s]*?):\s*(.*)$/);
    if (kv) {
      const key = kv[1].trim();
      let value: unknown = kv[2].trim();
      // Parse YAML values
      if (/^\d+$/.test(value as string)) {
        value = parseInt(value as string);
      } else if ((value as string).startsWith('"') || (value as string).startsWith("'")) {
        value = (value as string).slice(1, -1);
      }
      meta[key] = value;
    }
  }

  return { meta, content };
}

/**
 * Load a page from MD file, parse frontmatter, render to HTML.
 */
export async function loadPage(
  contentDir: string,
  locale: string,
  page: string,
): Promise<PageData | null> {
  try {
    const raw = await Deno.readTextFile(
      `${contentDir}/${locale}/${page}.md`,
    );
    const { meta, content } = parseFrontmatter(raw);
    const html = await marked(content) as string;
    return { html, meta: meta as PageData['meta'] };
  } catch {
    return null;
  }
}
