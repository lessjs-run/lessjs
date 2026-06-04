/**
 * Build-time MDX compiler for LessJS content.
 *
 * MDX is compiled to JSX that uses @openelement/core as jsxImportSource, so the
 * rendered component continues through the existing VNode -> renderDsd path.
 */

import { compile } from '@mdx-js/mdx';
import matter from 'gray-matter';
import type { MdxCompileOptions, MdxModule } from './types.ts';

export async function compileMdx(
  source: string,
  options: MdxCompileOptions = {},
): Promise<MdxModule> {
  const { data, content } = matter(source);
  const compiled = await compile(content, {
    development: options.development ?? false,
    jsx: true,
    jsxImportSource: options.jsxImportSource ?? '@openelement/core',
    outputFormat: 'program',
    providerImportSource: undefined,
    format: 'mdx',
  });

  return {
    code: String(compiled.value),
    frontmatter: data as Record<string, unknown>,
    content,
  };
}

export type { MdxCompileOptions, MdxModule } from './types.ts';
