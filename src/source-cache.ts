import type { ElementInfo, SourceAnnotation } from './types.js';
import { cleanClasses } from './dom-utils.js';

const SOURCE_SELECTOR = '[data-astro-source-file], [data-astro-source-loc]';

/**
 * Read Astro source annotations from the cache first, then from DOM attributes.
 */
export function readSourceAnnotation(element: HTMLElement): SourceAnnotation {
  const cached = window.__ai_note_source_cache__?.get(element);
  return {
    file: cached?.file ?? element.getAttribute('data-astro-source-file') ?? '',
    loc: cached?.loc ?? element.getAttribute('data-astro-source-loc') ?? '',
  };
}

export function hasSourceCache(): boolean {
  return Boolean(window.__ai_note_source_cache__);
}

export function ensureSourceCache(): void {
  if (hasSourceCache()) return;

  const cache = new Map<HTMLElement, SourceAnnotation>();
  window.__ai_note_source_cache__ = cache;
  window.__ai_note_source_cache_late__ = true;

  const capture = (element: Element) => {
    if (!(element instanceof HTMLElement)) return;
    const file = element.getAttribute('data-astro-source-file') ?? '';
    const loc = element.getAttribute('data-astro-source-loc') ?? '';
    if (file || loc) {
      const existing = cache.get(element) ?? { file: '', loc: '' };
      cache.set(element, {
        file: file || existing.file || '',
        loc: loc || existing.loc || '',
      });
    }
  };

  if (document.documentElement) {
    capture(document.documentElement);
    document.documentElement
      .querySelectorAll(SOURCE_SELECTOR)
      .forEach(capture);
  }
}

export function toRelativePath(filePath: string): string {
  const root = window.__astro_dev_toolbar__?.root;
  return root && filePath.startsWith(root) ? filePath.slice(root.length) : filePath;
}

export function getElementInfo(element: HTMLElement, filePath: string, location: string): ElementInfo {
  const relativePath = toRelativePath(filePath);

  const tagName = element.tagName.toLowerCase();
  const classes = cleanClasses(element.className
    ? (typeof element.className === 'string' ? element.className : '')
    : '');

  const rawHtml = element.outerHTML;
  const htmlSnippet =
    rawHtml.length > 120 ? rawHtml.slice(0, 117) + '...' : rawHtml;

  return { filePath, relativePath, location, tagName, classes, htmlSnippet };
}
