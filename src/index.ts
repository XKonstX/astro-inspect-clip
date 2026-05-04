import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

/**
 * Script content for the source-attribute cache.
 * DEV-ONLY: Injected via injectScript('page') so it runs as a module on every page.
 * This script MUST NOT run in production — it contains a MutationObserver that would
 * leak memory and serve no purpose outside of development.
 *
 * Captures data-astro-source-file / data-astro-source-loc into a global
 * Map BEFORE Astro's built-in Audit toolbar app can remove them.
 */
const CACHE_SCRIPT = `
  const cache = new Map();
  window.__ai_note_source_cache__ = cache;

  function capture(el) {
    const file = el.getAttribute('data-astro-source-file');
    if (file) {
      cache.set(el, { file, loc: el.getAttribute('data-astro-source-loc') || '' });
    }
  }

  function scanAll(root) {
    root.querySelectorAll('[data-astro-source-file]').forEach(capture);
  }

  // Initial scan — capture everything available right now
  if (document.body) scanAll(document.body);

  // MutationObserver: catch new elements AND attribute removals
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1) {
            capture(node);
            if (node.querySelectorAll) node.querySelectorAll('[data-astro-source-file]').forEach(capture);
          }
        }
        // Clean up cache entries for removed elements
        for (const node of m.removedNodes) {
          if (node.nodeType === 1) {
            cache.delete(node);
            // Also clean descendants
            if (node.querySelectorAll) {
              node.querySelectorAll('[data-astro-source-file]').forEach((el) => cache.delete(el));
            }
          }
        }
      } else if (m.type === 'attributes') {
        const el = m.target;
        const current = el.getAttribute('data-astro-source-file');
        if (current) {
          capture(el);
        }
        // If attribute was removed, our cache entry stays valid.
      }
    }
  });

  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['data-astro-source-file', 'data-astro-source-loc'],
  });

  // Re-scan after Astro View Transitions page swap
  document.addEventListener('astro:after-swap', () => scanAll(document.body));
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

        // 2) Inject the source-cache script on every page (dev-only)
        //    'page' scope = runs on every page as a <script type="module">
        //    Must not run in production — MutationObserver would leak memory
        if (command === 'dev') {
          injectScript('page', CACHE_SCRIPT);
        }
      },
    },
  };
}
