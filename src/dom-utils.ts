/** Classes added by this plugin and stripped from copied output. */
export const PLUGIN_CLASSES = [
  'ai-note-selected',
  'ai-note-hover-outline',
  'ai-note-commented',
  'ai-note-commented-hover',
];

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function cleanClasses(className: string): string {
  return className
    .split(/\s+/)
    .filter(c => c && !PLUGIN_CLASSES.includes(c))
    .join(', ');
}

export function cleanHtml(html: string): string {
  return PLUGIN_CLASSES.reduce(
    (h, cls) => h.replace(new RegExp(`\\b${cls}\\b`, 'g'), ''),
    html,
  ).replace(/\s{2,}/g, ' ').trim();
}

export function getTraversalParent(element: HTMLElement): HTMLElement | null {
  if (element.parentElement) return element.parentElement;

  const root = element.getRootNode();
  if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
    return root.host;
  }

  return null;
}

export function isDevToolbarElement(element: HTMLElement): boolean {
  if (element.closest('astro-dev-toolbar')) return true;

  const root = element.getRootNode();
  return root instanceof ShadowRoot
    && root.host instanceof HTMLElement
    && Boolean(root.host.closest('astro-dev-toolbar'));
}

export function describeElement(element: HTMLElement): string {
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = cleanClasses(typeof element.className === 'string' ? element.className : '')
    .split(', ')
    .filter(Boolean)
    .slice(0, 3)
    .map((className) => `.${className}`)
    .join('');

  return `${tagName}${id}${classes}`;
}

export function buildDomPath(element: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && parts.length < 6) {
    if (isDevToolbarElement(current)) break;
    parts.push(describeElement(current));
    if (current.tagName.toLowerCase() === 'body') break;
    current = getTraversalParent(current);
  }

  return parts.reverse().join(' > ');
}
