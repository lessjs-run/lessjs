function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableDivider(line: string): boolean {
  return /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
}

function parseInline(value: string): string {
  let output = escapeHtml(value);
  const codeSpans: string[] = [];

  output = output.replace(/`([^`]+)`/g, (_match, code) => {
    const index = codeSpans.push(`<code>${code}</code>`) - 1;
    return `@@CODE_SPAN_${index}@@`;
  });

  output = output.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  output = output.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
    const safeHref = String(href).startsWith('http') ? href : escapeHtml(href);
    return `<a href="${safeHref}">${label}</a>`;
  });

  return output.replace(/@@CODE_SPAN_(\d+)@@/g, (_match, index) => codeSpans[Number(index)] || '');
}

function collectParagraph(lines: string[], start: number): { html: string; next: number } {
  const parts: string[] = [];
  let i = start;
  while (i < lines.length && lines[i].trim()) {
    const line = lines[i];
    if (
      /^#{1,6}\s+/.test(line) ||
      /^[-*]\s+/.test(line) ||
      /^\d+\.\s+/.test(line) ||
      /^>\s?/.test(line) ||
      /^```/.test(line) ||
      (line.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1]))
    ) {
      break;
    }
    parts.push(line.trim());
    i++;
  }
  return { html: `<p>${parseInline(parts.join(' '))}</p>`, next: i };
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const fence = trimmed.match(/^```(\w+)?/);
    if (fence) {
      const language = fence[1] ? ` data-language="${escapeHtml(fence[1])}"` : '';
      const code: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      html.push(`<pre${language}><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = Math.min(heading[1].length, 4);
      html.push(`<h${level}>${parseInline(heading[2])}</h${level}>`);
      i++;
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      html.push('<hr>');
      i++;
      continue;
    }

    if (trimmed.includes('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const header = splitTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|')) {
        rows.push(splitTableRow(lines[i]));
        i++;
      }
      html.push(
        `<table><thead><tr>${
          header.map((cell) => `<th>${parseInline(cell)}</th>`).join('')
        }</tr></thead><tbody>${
          rows.map((row) =>
            `<tr>${row.map((cell) => `<td>${parseInline(cell)}</td>`).join('')}</tr>`
          ).join('')
        }</tbody></table>`,
      );
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(`<li>${parseInline(lines[i].trim().replace(/^[-*]\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(`<li>${parseInline(lines[i].trim().replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      html.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      const quote: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i].trim())) {
        quote.push(lines[i].trim().replace(/^>\s?/, ''));
        i++;
      }
      html.push(
        `<blockquote>${quote.map((part) => `<p>${parseInline(part)}</p>`).join('')}</blockquote>`,
      );
      continue;
    }

    const paragraph = collectParagraph(lines, i);
    html.push(paragraph.html);
    i = paragraph.next === i ? i + 1 : paragraph.next;
  }

  return html.join('\n');
}
