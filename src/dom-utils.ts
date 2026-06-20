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

export function compactText(value: string, maxLength = 120): string {
  const compacted = value.replace(/\s+/g, ' ').trim();
  return compacted.length > maxLength ? compacted.slice(0, maxLength - 3) + '...' : compacted;
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

export function getElementContextInfo(element: HTMLElement) {
  const location = window.location;
  const route = compactText([
    location.pathname,
    location.search,
    location.hash,
  ].join(''), 160);

  return {
    route,
    pageTitle: compactText(document.title, 160),
    text: compactText(element.innerText || element.textContent || ''),
    dataAttributes: getRelevantDataAttributes(element),
    nearestHeading: getNearestHeading(element),
    nearestLabelledRegion: getNearestLabelledRegion(element),
    nearestFormContext: getNearestFormContext(element),
    domPath: buildDomPath(element),
  };
}

function getRelevantDataAttributes(element: HTMLElement): string[] {
  return Array
    .from(element.attributes)
    .filter((attr) =>
      attr.name.startsWith('data-')
      && !attr.name.startsWith('data-astro-')
      && !attr.name.startsWith('data-vite-')
    )
    .map((attr) => `${attr.name}="${compactText(attr.value, 80)}"`)
    .slice(0, 8);
}

function getNearestHeading(element: HTMLElement): string {
  const headings = Array
    .from(document.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
    .filter((heading) =>
      !isDevToolbarElement(heading)
      && heading.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING
    );

  return compactText(headings.at(-1)?.innerText || headings.at(-1)?.textContent || '');
}

function getNearestLabelledRegion(element: HTMLElement): string {
  const selector = '[aria-label], [aria-labelledby], section, article, aside, nav, main, header, footer, [role]';
  let region = getTraversalParent(element);

  while (region && !region.matches(selector)) {
    region = getTraversalParent(region);
  }

  if (!region || isDevToolbarElement(region)) return '';

  return getAccessibleName(region) || getContainedHeading(region, element);
}

function getNearestFormContext(element: HTMLElement): string {
  const form = element.closest<HTMLElement>('form, fieldset, [role="form"]');
  if (!form || isDevToolbarElement(form)) return '';

  const labelledBy = getAccessibleName(form);
  if (labelledBy) return labelledBy;

  const legend = form.querySelector<HTMLElement>('legend');
  return compactText(legend?.innerText || legend?.textContent || '');
}

function getContainedHeading(container: HTMLElement, beforeElement: HTMLElement): string {
  const headings = Array
    .from(container.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
    .filter((heading) =>
      heading !== beforeElement
      && heading.compareDocumentPosition(beforeElement) & Node.DOCUMENT_POSITION_FOLLOWING
    );

  return compactText(headings.at(-1)?.innerText || headings.at(-1)?.textContent || '');
}

function getAccessibleName(element: HTMLElement): string {
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return compactText(ariaLabel);

  const labelledBy = element.getAttribute('aria-labelledby');
  if (!labelledBy) return '';

  const label = labelledBy
    .split(/\s+/)
    .map((id) => document.getElementById(id))
    .filter((labelElement): labelElement is HTMLElement => Boolean(labelElement))
    .map((labelElement) => labelElement.innerText || labelElement.textContent || '')
    .join(' ');

  return compactText(label);
}

export function getElementFingerprint(element: HTMLElement): string {
  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && parts.length < 8) {
    if (isDevToolbarElement(current)) break;

    const tagName = current.tagName.toLowerCase();
    const id = current.id ? `#${current.id}` : '';
    const demoTarget = current.dataset.demoTarget ? `[data-demo-target="${current.dataset.demoTarget}"]` : '';
    const classes = cleanClasses(typeof current.className === 'string' ? current.className : '')
      .split(', ')
      .filter(Boolean)
      .slice(0, 4)
      .map((className) => `.${className}`)
      .join('');
    const siblingIndex = getElementSiblingIndex(current);

    parts.push(`${tagName}${id}${demoTarget}${classes}:nth-of-type(${siblingIndex})`);
    if (tagName === 'body') break;
    current = getTraversalParent(current);
  }

  return parts.reverse().join(' > ');
}

function getElementSiblingIndex(element: HTMLElement): number {
  let index = 1;
  let sibling = element.previousElementSibling;

  while (sibling) {
    if (sibling.tagName === element.tagName) index++;
    sibling = sibling.previousElementSibling;
  }

  return index;
}
