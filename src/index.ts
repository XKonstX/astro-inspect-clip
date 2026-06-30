import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import { GLOBAL_STYLES } from './global-styles.js';

/**
 * Script content for the source-attribute cache.
 * DEV-ONLY: Injected via injectScript('head-inline') so it runs before the
 * dev toolbar can strip Astro source annotations from the document.
 * This script MUST NOT run in production — it contains a MutationObserver that would
 * leak memory and serve no purpose outside of development.
 *
 * Captures data-astro-source-file / data-astro-source-loc into a global Map
 * BEFORE Astro's built-in Audit toolbar app can remove them. The observer is
 * installed from <head>, and removeAttribute is wrapped so Audit-triggered
 * removals synchronously preserve the attributes first.
 */
const CACHE_SCRIPT = `
  const GLOBAL_STYLES = ${JSON.stringify(GLOBAL_STYLES)};
  const cache = window.__ai_note_source_cache__ instanceof Map
    ? window.__ai_note_source_cache__
    : new Map();
  window.__ai_note_source_cache__ = cache;
  window.__ai_note_source_cache_late__ = false;

  const SOURCE_SELECTOR = '[data-astro-source-file], [data-astro-source-loc]';
  const SOURCE_ATTR_NAMES = new Set(['data-astro-source-file', 'data-astro-source-loc']);
  const COMMENT_CONTEXT_PREFIX = 'astro-inspect-clip:comment-context:v1';
  const REVIEW_STATE_PREFIX = 'astro-inspect-clip:review-state:v1';
  const DEBUG_STORAGE_KEY = 'astro-inspect-clip:debug:v1';
  const PLUGIN_CLASSES = [
    'ai-note-selected',
    'ai-note-hover-outline',
    'ai-note-commented',
    'ai-note-commented-hover',
  ];
  let rehydrateFrame = 0;

  function isDebugEnabled() {
    if (typeof window.__astro_inspect_clip_debug__ === 'boolean') {
      return window.__astro_inspect_clip_debug__;
    }

    try {
      const stored = window.sessionStorage.getItem(DEBUG_STORAGE_KEY)
        || window.localStorage.getItem(DEBUG_STORAGE_KEY);
      return stored === '1' || stored === 'true';
    } catch {
      return false;
    }
  }

  function debugLog(event, detail) {
    if (!isDebugEnabled()) return;
    if (detail) {
      console.debug('[astro-inspect-clip]', event, detail);
    } else {
      console.debug('[astro-inspect-clip]', event);
    }
  }

  function setDebugEnabled(enabled) {
    window.__astro_inspect_clip_debug__ = enabled;

    try {
      if (enabled) {
        window.sessionStorage.setItem(DEBUG_STORAGE_KEY, '1');
      } else {
        window.sessionStorage.removeItem(DEBUG_STORAGE_KEY);
        window.localStorage.removeItem(DEBUG_STORAGE_KEY);
      }
    } catch {}

    debugLog('debug-mode', { enabled });
    return enabled;
  }

  window.__astroInspectClipDebug = {
    enable: () => setDebugEnabled(true),
    disable: () => setDebugEnabled(false),
    toggle: (force) => setDebugEnabled(force ?? !isDebugEnabled()),
    status: () => isDebugEnabled(),
  };

  function capture(el) {
    const file = el.getAttribute('data-astro-source-file');
    const loc = el.getAttribute('data-astro-source-loc');
    if (file || loc) {
      const existing = cache.get(el) || { file: '', loc: '' };
      const next = {
        file: file || existing.file || '',
        loc: loc || existing.loc || '',
      };
      cache.set(el, next);
      debugLog('source-cache-capture', {
        tag: el.tagName && el.tagName.toLowerCase(),
        file: next.file,
        loc: next.loc,
      });
    }
  }

  function scanAll(root) {
    capture(root);
    root.querySelectorAll(SOURCE_SELECTOR).forEach(capture);
  }

  function captureBeforeSourceAttributeRemoval(element) {
    if (!(element instanceof HTMLElement)) return;
    capture(element);
  }

  function installSourceRemovalCacheHook() {
    if (window.__ai_note_source_remove_attribute_hook__) return;
    window.__ai_note_source_remove_attribute_hook__ = true;

    const originalRemoveAttribute = Element.prototype.removeAttribute;
    Element.prototype.removeAttribute = function removeAttributeWithSourceCache(name) {
      if (SOURCE_ATTR_NAMES.has(String(name).toLowerCase())) {
        captureBeforeSourceAttributeRemoval(this);
      }

      return originalRemoveAttribute.call(this, name);
    };

    const originalRemoveAttributeNode = Element.prototype.removeAttributeNode;
    Element.prototype.removeAttributeNode = function removeAttributeNodeWithSourceCache(attribute) {
      if (attribute && SOURCE_ATTR_NAMES.has(String(attribute.name).toLowerCase())) {
        captureBeforeSourceAttributeRemoval(this);
      }

      return originalRemoveAttributeNode.call(this, attribute);
    };

    debugLog('source-cache-remove-attribute-hook-installed');
  }

  function ensureGlobalStyles() {
    if (document.getElementById('ai-note-global-styles')) return;

    const style = document.createElement('style');
    style.id = 'ai-note-global-styles';
    style.textContent = GLOBAL_STYLES;
    document.head.appendChild(style);
  }

  function cleanClasses(className) {
    return className
      .split(/\\s+/)
      .filter((className) => className && !PLUGIN_CLASSES.includes(className))
      .join(', ');
  }

  function getTraversalParent(element) {
    if (element.parentElement) return element.parentElement;

    const root = element.getRootNode();
    if (root instanceof ShadowRoot && root.host instanceof HTMLElement) {
      return root.host;
    }

    return null;
  }

  function isDevToolbarElement(element) {
    if (element.closest('astro-dev-toolbar')) return true;

    const root = element.getRootNode();
    return root instanceof ShadowRoot
      && root.host instanceof HTMLElement
      && Boolean(root.host.closest('astro-dev-toolbar'));
  }

  function getElementSiblingIndex(element) {
    let index = 1;
    let sibling = element.previousElementSibling;

    while (sibling) {
      if (sibling.tagName === element.tagName) index++;
      sibling = sibling.previousElementSibling;
    }

    return index;
  }

  function getElementFingerprint(element) {
    const parts = [];
    let current = element;

    while (current && parts.length < 8) {
      if (isDevToolbarElement(current)) break;

      const tagName = current.tagName.toLowerCase();
      const id = current.id ? '#' + current.id : '';
      const demoTarget = current.dataset.demoTarget
        ? '[data-demo-target="' + current.dataset.demoTarget + '"]'
        : '';
      const classes = cleanClasses(typeof current.className === 'string' ? current.className : '')
        .split(', ')
        .filter(Boolean)
        .slice(0, 4)
        .map((className) => '.' + className)
        .join('');
      const siblingIndex = getElementSiblingIndex(current);

      parts.push(tagName + id + demoTarget + classes + ':nth-of-type(' + siblingIndex + ')');
      if (tagName === 'body') break;
      current = getTraversalParent(current);
    }

    return parts.reverse().join(' > ');
  }

  function getPageElements() {
    const elements = [];
    if (document.documentElement instanceof HTMLElement) elements.push(document.documentElement);
    if (document.body instanceof HTMLElement && document.body !== document.documentElement) {
      elements.push(document.body);
      document.body.querySelectorAll('*').forEach((element) => {
        if (element instanceof HTMLElement) elements.push(element);
      });
    }
    return elements;
  }

  function readSourceAnnotation(element) {
    const cached = cache.get(element);
    return {
      file: (cached && cached.file) || element.getAttribute('data-astro-source-file') || '',
      loc: (cached && cached.loc) || element.getAttribute('data-astro-source-loc') || '',
    };
  }

  function resolveCommentSource(element) {
    let current = element;
    let file = '';
    let loc = '';
    let distance = 0;

    while (current) {
      if (isDevToolbarElement(current)) break;

      const source = readSourceAnnotation(current);
      const tagName = current.tagName.toLowerCase();
      const isDocumentShell = distance > 0 && (tagName === 'body' || tagName === 'html');

      if (!loc && source.loc && !isDocumentShell) {
        loc = source.loc;
        file = source.file;
      } else if (loc && !file && source.file) {
        file = source.file;
      }

      if (file && loc) break;

      current = getTraversalParent(current);
      distance++;
    }

    return { file, loc };
  }

  function isCommentedContextEntry(entry) {
    return entry
      && typeof entry === 'object'
      && typeof entry.id === 'string'
      && (entry.instanceKey === undefined || typeof entry.instanceKey === 'string')
      && typeof entry.filePath === 'string'
      && typeof entry.location === 'string'
      && typeof entry.tagName === 'string'
      && typeof entry.instruction === 'string'
      && Boolean(entry.instruction.trim());
  }

  function readCommentContexts() {
    try {
      const contexts = [];
      const storagePrefix = COMMENT_CONTEXT_PREFIX + ':';
      const pathnameSuffix = ':' + window.location.pathname;

      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (!key || !key.startsWith(storagePrefix) || !key.endsWith(pathnameSuffix)) continue;

        const raw = window.sessionStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) continue;

        parsed.filter(isCommentedContextEntry).forEach((entry) => contexts.push(entry));
      }

      return Array.from(new Map(contexts.map((context) => [context.id, context])).values());
    } catch {
      return [];
    }
  }

  function readReviewState() {
    try {
      const scopes = Array.from(new Set([
        window.__astro_dev_toolbar__ && window.__astro_dev_toolbar__.root,
        window.location.origin,
      ])).filter(Boolean);

      for (const scope of scopes) {
        const key = REVIEW_STATE_PREFIX + ':' + scope;
        const value = window.sessionStorage.getItem(key);
        if (value === 'paused' || value === 'recording') return value;
      }
    } catch {}

    return 'closed';
  }

  function findElementsForComment(context) {
    const matches = [];
    const canMatchElement = (element) => element.isConnected
      && !isDevToolbarElement(element)
      && element.tagName.toLowerCase() === context.tagName;
    const addMatch = (element) => {
      if (canMatchElement(element) && !matches.includes(element)) matches.push(element);
    };

    if (context.instanceKey) {
      getPageElements().forEach((element) => {
        if (getElementFingerprint(element) === context.instanceKey) {
          addMatch(element);
        }
      });
    }

    getPageElements().forEach((element) => {
      if (!canMatchElement(element)) return;
      const source = resolveCommentSource(element);
      if (source.file === context.filePath && source.loc === context.location) {
        addMatch(element);
      }
    });

    for (const [element, source] of cache.entries()) {
      if (
        canMatchElement(element)
        && source.file === context.filePath
        && source.loc === context.location
      ) {
        addMatch(element);
      }
    }

    document
      .querySelectorAll(SOURCE_SELECTOR)
      .forEach((element) => {
        if (!(element instanceof HTMLElement)) return;
        const source = readSourceAnnotation(element);
        if (
          source.file === context.filePath
          && source.loc === context.location
        ) {
          addMatch(element);
        }
      });

    if (!context.instanceKey) return matches;

    const exactMatches = matches.filter((element) => getElementFingerprint(element) === context.instanceKey);
    return exactMatches.length > 0 ? exactMatches : matches;
  }

  function rehydrateCommentMarks() {
    rehydrateFrame = 0;
    if (!window.__ai_note_show_comment_marks__) {
      debugLog('comment-marks-skip', { reason: 'marks-disabled' });
      return;
    }

    const contexts = readCommentContexts();

    if (contexts.length === 0) {
      debugLog('comment-marks-skip', { reason: 'no-contexts' });
      return;
    }

    ensureGlobalStyles();

    for (const context of contexts) {
      const [element] = findElementsForComment(context);
      if (element) element.classList.add('ai-note-commented');
      debugLog('comment-mark-rehydrate', {
        id: context.id,
        found: Boolean(element),
        file: context.filePath,
        loc: context.location,
        tag: context.tagName,
      });
    }
  }

  function scheduleRehydrateCommentMarks() {
    if (rehydrateFrame) return;
    rehydrateFrame = requestAnimationFrame(rehydrateCommentMarks);
  }

  // Initial scan — capture everything available right now. When this runs from
  // <head>, document.body is usually not available yet; the observer below then
  // captures body markup as the HTML parser inserts it.
  installSourceRemovalCacheHook();
  window.__ai_note_show_comment_marks__ = readReviewState() !== 'closed';
  if (document.body) scanAll(document.body);
  debugLog('source-cache-init', {
    cachedElements: cache.size,
    showCommentMarks: window.__ai_note_show_comment_marks__,
    readyState: document.readyState,
  });
  scheduleRehydrateCommentMarks();
  setTimeout(scheduleRehydrateCommentMarks, 50);
  setTimeout(scheduleRehydrateCommentMarks, 250);
  document.addEventListener('DOMContentLoaded', () => {
    if (document.body) scanAll(document.body);
    debugLog('source-cache-domcontentloaded', {
      cachedElements: cache.size,
    });
    scheduleRehydrateCommentMarks();
  }, { once: true });

  // MutationObserver: catch new elements AND attribute removals
  const observer = new MutationObserver((mutations) => {
    let shouldRehydrate = false;

    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            capture(node);
            if (node.querySelectorAll) node.querySelectorAll(SOURCE_SELECTOR).forEach(capture);
            shouldRehydrate = true;
          }
        }
        // Clean up cache entries for removed elements
        for (const node of m.removedNodes) {
          if (node.nodeType === 1) {
            cache.delete(node);
            // Also clean descendants
            if (node.querySelectorAll) {
              node.querySelectorAll(SOURCE_SELECTOR).forEach((el) => cache.delete(el));
            }
          }
        }
      } else if (m.type === 'attributes') {
        const el = m.target;
        const file = el.getAttribute('data-astro-source-file');
        const loc = el.getAttribute('data-astro-source-loc');
        if (file || loc) {
          capture(el);
          shouldRehydrate = true;
        }
        // If attribute was removed, our cache entry stays valid.
      }
    }

    if (shouldRehydrate) scheduleRehydrateCommentMarks();
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-astro-source-file', 'data-astro-source-loc'],
  });

  // Re-scan after Astro View Transitions page swap
  document.addEventListener('astro:after-swap', () => {
    scanAll(document.body);
    scheduleRehydrateCommentMarks();
  });
`;

export default function astroInspectClip(): AstroIntegration {
  return {
    name: 'astro-inspect-clip',
    hooks: {
      'astro:config:setup': ({ addDevToolbarApp, injectScript, command }) => {
        // 1) Register the toolbar app
        addDevToolbarApp({
          id: 'inspect-clip',
          name: 'Inspect & Clip',
          icon: '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14zm-7-2h4v-1h-4v1zm0-3h4v-1h-4v1zm0-3h4v-1h-4v1zm-2 6H7v1h3v-1zm0-3H7v1h3v-1zm0-3H7v1h3v-1z"/></svg>',
          entrypoint: fileURLToPath(new URL('./app.js', import.meta.url)),
        });

        // 2) Inject the source-cache script on every page (dev-only).
        //    It must run from <head> so it can cache source annotations before
        //    the dev toolbar removes them.
        if (command === 'dev') {
          injectScript('head-inline', CACHE_SCRIPT);
        }
      },
    },
  };
}
