import type { CommentedContextEntry, NoSourceDiagnostic, SelectedEntry } from './types.js';
import { cleanClasses, cleanHtml } from './dom-utils.js';
import { toRelativePath } from './source-cache.js';

export function buildCopyText(entries: SelectedEntry[], note: string): string {
  const lines: string[] = [];

  if (entries.length === 1) {
    const { element, info, isInherited } = entries[0];
    lines.push(`File: ${info.relativePath}:${info.location}`);

    const tagName = element.tagName.toLowerCase();
    const classes = cleanClasses(typeof element.className === 'string' ? element.className : '');
    const rawHtml = cleanHtml(element.outerHTML);
    const htmlSnippet = rawHtml.length > 120 ? rawHtml.slice(0, 117) + '...' : rawHtml;

    lines.push(`Element: <${tagName}>`);
    if (classes) lines.push(`Classes: ${classes}`);
    lines.push(`HTML: ${htmlSnippet}`);
    if (isInherited) lines.push('(Source location resolved from parent)');

    const island = info.tagName === 'astro-island' ? element : element.closest('astro-island');
    if (island) {
      const componentUrl = island.getAttribute('component-url');
      if (componentUrl) lines.push(`Component: ${componentUrl}`);
      const props = island.getAttribute('props');
      if (props) {
        try {
          const parsed = JSON.parse(props);
          const cleanProps: Record<string, unknown> = {};
          for (const [key, value] of Object.entries(parsed)) {
            if (!key.startsWith('data-astro-cid-')) cleanProps[key] = value;
          }
          if (Object.keys(cleanProps).length > 0) {
            lines.push(`Props: ${JSON.stringify(cleanProps, undefined, 2)}`);
          }
        } catch {}
      }
    }
  } else {
    const byFile = new Map<string, SelectedEntry[]>();
    for (const entry of entries) {
      const key = entry.info.filePath;
      if (!byFile.has(key)) byFile.set(key, []);
      byFile.get(key)!.push(entry);
    }

    let num = 0;
    for (const [, fileEntries] of byFile) {
      const relPath = fileEntries[0].info.relativePath;
      if (byFile.size > 1 || fileEntries.length > 1) {
        lines.push(`File: ${relPath}`);
      }

      for (const entry of fileEntries) {
        num++;
        const el = entry.element;
        const info = entry.info;
        const tagName = el.tagName.toLowerCase();
        const classes = cleanClasses(typeof el.className === 'string' ? el.className : '');
        const rawHtml = cleanHtml(el.outerHTML);
        const htmlSnippet = rawHtml.length > 120 ? rawHtml.slice(0, 117) + '...' : rawHtml;

        if (byFile.size === 1) {
          lines.push(`File: ${info.relativePath}:${info.location}`);
          lines.push(`Element ${num}: <${tagName}>`);
        } else {
          lines.push(`  Element ${num}: <${tagName}> (${info.location})`);
        }

        if (classes) lines.push(`Classes: ${classes}`);
        lines.push(`HTML: ${htmlSnippet}`);
        if (entry.isInherited) lines.push('(Source location resolved from parent)');
        lines.push('');
      }
    }
  }

  if (note.trim()) {
    lines.push('Instruction:');
    lines.push(note.trim());
  }

  return lines.join('\n');
}

export function buildCompleteContextText(entries: CommentedContextEntry[]): string {
  const lines: string[] = [];

  entries.forEach((entry, index) => {
    if (index > 0) lines.push('');
    lines.push(`Element ${index + 1}`);
    lines.push(`File: ${entry.relativePath}:${entry.location}`);
    lines.push(`Element: <${entry.tagName}>`);
    if (entry.classes) lines.push(`Classes: ${entry.classes}`);
    lines.push(`HTML: ${entry.htmlSnippet}`);
    if (entry.isInherited) lines.push('(Source location resolved from parent)');
    lines.push('');
    lines.push('Instruction:');
    lines.push(entry.instruction.trim());
  });

  return lines.join('\n');
}

export function buildNoSourceCopyText(element: HTMLElement, diagnostic: NoSourceDiagnostic): string {
  const lines = [
    'No Astro source location found.',
    `Reason: ${diagnostic.title}`,
    `Detail: ${diagnostic.message}`,
    `Element: <${element.tagName.toLowerCase()}>`,
  ];

  const classes = cleanClasses(typeof element.className === 'string' ? element.className : '');
  if (classes) lines.push(`Classes: ${classes}`);
  if (diagnostic.domPath) lines.push(`DOM path: ${diagnostic.domPath}`);

  if (diagnostic.nearest) {
    const file = diagnostic.nearest.file ? toRelativePath(diagnostic.nearest.file) : '(missing file)';
    const loc = diagnostic.nearest.loc || '(missing loc)';
    lines.push(`Nearest metadata: ${file}:${loc}`);
    lines.push(`Nearest element: <${diagnostic.nearest.element.tagName.toLowerCase()}>`);
  }

  const rawHtml = cleanHtml(element.outerHTML);
  const htmlSnippet = rawHtml.length > 240 ? rawHtml.slice(0, 237) + '...' : rawHtml;
  lines.push(`HTML: ${htmlSnippet}`);

  return lines.join('\n');
}
