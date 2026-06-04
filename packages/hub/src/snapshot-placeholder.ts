import { escapeHtml } from '@openelement/core';

export function renderSnapshotPlaceholderHtml(tagName: string): string {
  return `<div class="snapshot-preview"><span style="display:inline-block;padding:0.75rem 1.25rem;border:1px dashed #d0d0d0;border-radius:6px;font-family:monospace;font-size:0.8125rem;color:#999;background:#fafafa;">${
    escapeHtml(tagName)
  }</span></div>`;
}
