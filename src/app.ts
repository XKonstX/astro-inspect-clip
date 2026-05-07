// plugins/astro-inspect-clip/app.ts
import type { ElementInfo, AppState, SelectedEntry } from './types.js';

const icon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14zm-7-2h4v-1h-4v1zm0-3h4v-1h-4v1zm0-3h4v-1h-4v1zm-2 6H7v1h3v-1zm0-3H7v1h3v-1zm0-3H7v1h3v-1z"/></svg>';

/**
 * Read Astro source annotations from the cache first, then from DOM attributes.
 */
function readSourceAnnotation(element: HTMLElement): { file: string; loc: string } {
  const cache = (window as any).__ai_note_source_cache__ as Map<HTMLElement, { file: string; loc: string }> | undefined;
  const cached = cache?.get(element);
  return {
    file: cached?.file ?? element.getAttribute('data-astro-source-file') ?? '',
    loc: cached?.loc ?? element.getAttribute('data-astro-source-loc') ?? '',
  };
}

function getElementInfo(element: HTMLElement, filePath: string, location: string): ElementInfo {
  // Calculate relative path from project root
  const root = (window as any).__astro_dev_toolbar__?.root as string | undefined;
  const relativePath = root
    ? (filePath.startsWith(root) ? filePath.slice(root.length) : filePath)
    : filePath;

  const tagName = element.tagName.toLowerCase();
  const classes = cleanClasses(element.className
    ? (typeof element.className === 'string' ? element.className : '')
    : '');

  // Truncate outerHTML for display (max ~120 chars)
  const rawHtml = element.outerHTML;
  const htmlSnippet =
    rawHtml.length > 120 ? rawHtml.slice(0, 117) + '...' : rawHtml;

  return { filePath, relativePath, location, tagName, classes, htmlSnippet };
}

/** Classes added by this plugin — must be stripped from copy output */
const PLUGIN_CLASSES = ['ai-note-selected', 'ai-note-hover-outline'];

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Strip plugin-owned classes from a className string */
function cleanClasses(className: string): string {
  return className
    .split(/\s+/)
    .filter(c => c && !PLUGIN_CLASSES.includes(c))
    .join(', ');
}

/** Strip plugin classes from an HTML string (quick regex, good enough for snippets) */
function cleanHtml(html: string): string {
  return PLUGIN_CLASSES.reduce(
    (h, cls) => h.replace(new RegExp(`\\b${cls}\\b`, 'g'), ''),
    html,
  ).replace(/\s{2,}/g, ' ').trim();
}

const COPY_ICON = '<svg width="14" height="14" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9.125.8125h-6c-.14918 0-.29226.059263-.39775.164752-.10549.105488-.16475.248568-.16475.397748v1.6875H.875c-.149184 0-.292258.05926-.397748.16475C.371763 3.33274.3125 3.47582.3125 3.625v6c0 .14918.059263.29226.164752.3977.10549.1055.248564.1648.397748.1648h6c.14918 0 .29226-.0593.39775-.1648.10549-.10544.16475-.24852.16475-.3977V7.9375H9.125c.14918 0 .29226-.05926.39775-.16475.10549-.10549.16475-.24857.16475-.39775v-6c0-.14918-.05926-.29226-.16475-.397748C9.41726.871763 9.27418.8125 9.125.8125Zm-2.8125 8.25h-4.875v-4.875h4.875v4.875Zm2.25-2.25h-1.125V3.625c0-.14918-.05926-.29226-.16475-.39775-.10549-.10549-.24857-.16475-.39775-.16475H3.6875v-1.125h4.875v4.875Z"/></svg>';

const COPIED_ICON = '<svg width="14" height="14" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M9.47334.806574C9.41136.744088 9.33763.694492 9.25639.660646S9.08802.609375 9.00001.609375 8.82486.6268 8.74362.660646s-.15497.083442-.21695.145928L3.56001 5.77991 1.47334 3.68657c-.06435-.06216-.14031-.11103-.22354-.14383-.08324-.03281-.17212-.04889-.261578-.04735-.089454.00155-.177727.0207-.259779.05637-.082052.03566-.156277.08713-.218436.15148-.062159.06435-.111035.14031-.143837.22355-.032803.08323-.04889.17212-.047342.26157.001547.08945.020699.17773.056361.25978.035663.08205.087137.15627.151485.21843l2.559996 2.56c.06198.06249.13571.11209.21695.14593.08124.03385.16838.05127.25639.05127s.17514-.01742.25638-.05127c.08124-.03384.15498-.08344.21695-.14593l5.44-5.44c.06767-.06242.12168-.13819.15861-.22253.03694-.08433.05601-.1754.05601-.26747 0-.09206-.01907-.18313-.05601-.26747-.03693-.08433-.09094-.160098-.15861-.222526Z"/></svg>';

function handleCopy(btn: HTMLButtonElement, text: string) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = `${COPIED_ICON} Copied!`;
    setTimeout(() => {
      btn.innerHTML = `${COPY_ICON} Copy`;
    }, 2000);
  }).catch(() => {
    btn.textContent = 'Copy failed';
    setTimeout(() => {
      btn.innerHTML = `${COPY_ICON} Copy`;
    }, 2000);
  });
}

export default {
  id: 'inspect-clip',
  name: 'Inspect & Clip',
  icon: icon,
  init(canvas: HTMLElement, eventTarget: EventTarget) {
    const state: AppState = {
      isInspecting: false,
      isMultiSelect: false,
      selectEnabled: true,
      selectedElements: [],
      hoverOutlineElement: null,
    };

    // ─── Toggle icons ───────────────────────────────────────────
    const selectIcon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M6.646 10.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L7 11.207l-1.646 1.647a.5.5 0 1 1-.708-.708l2-2ZM2 2.5A.5.5 0 0 1 2.5 2h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 2 14v-11Zm1 1v10h10v-10H3Z"/></svg>';
    const multiIcon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M8 1.5l-5.5 3 5.5 3 5.5-3-5.5-3ZM1.5 9.5l5.5 3 5.5-3M1.5 7l5.5 3 5.5-3" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" fill="none"/></svg>';

    // ─── Global styles (injected into document head for page-level classes) ──
    const globalStyle = document.createElement('style');
    globalStyle.id = 'ai-note-global-styles';
    globalStyle.textContent = `
      /* Inspector mode cursor */
      body.ai-note-inspecting {
        cursor: crosshair !important;
      }
      body.ai-note-inspecting * {
        cursor: crosshair !important;
      }

      /* Hover outline */
      .ai-note-hover-outline {
        outline: 2px dashed rgba(139, 92, 246, 0.6) !important;
        outline-offset: 2px !important;
        transition: outline-color 0.15s ease;
      }

      /* Selected highlight */
      .ai-note-selected {
        outline: 2px solid rgba(139, 92, 246, 0.9) !important;
        outline-offset: 2px !important;
        box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.15) !important;
      }
    `;
    document.head.appendChild(globalStyle);

    // ─── Panel styles (scoped to toolbar canvas) ────────────────────────────
    const style = document.createElement('style');
    style.textContent = `
      .ai-note-canvas {
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        color: #c0c4d0;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .ai-note-panel {
        display: none;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        max-height: 420px;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(113, 24, 226, 0.3) transparent;
      }

      .ai-note-panel[data-visible="true"] {
        display: flex;
      }

      .ai-note-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(88, 76, 116, 0.25);
        position: sticky;
        top: 0;
        z-index: 2;
        background: #161820;
      }

      .ai-note-header h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.04em;
      }

      .ai-note-element-info {
        background:
          linear-gradient(180deg, rgba(26, 24, 42, 0.55) 0%, rgba(18, 16, 30, 0.55) 100%),
      linear-gradient(180deg, rgba(29, 31, 40, 0.98), rgba(22, 24, 32, 0.98));
        border: 1px solid rgba(88, 76, 116, 0.35);
        border-radius: 12px;
        padding: 14px;
        font-size: 13px;
        line-height: 1.6;
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.03),
          0 2px 8px rgba(0, 0, 0, 0.2),
          0 0 0 1px rgba(113, 24, 226, 0.06);
      }

      .ai-note-info-section {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .ai-note-element-info code {
        background: rgba(126, 58, 226, 0.15);
        border: 1px solid rgba(126, 58, 226, 0.12);
        padding: 1px 7px;
        border-radius: 5px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11.5px;
        font-weight: 500;
        color: #dbb8ff;
        word-break: break-all;
        letter-spacing: 0.01em;
      }

      .ai-note-element-info .label {
        color: #8b8da2;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin-bottom: 5px;
      }

      .ai-note-element-info .row {
        margin-bottom: 0;
      }

      .ai-note-element-info .row:last-child {
        margin-bottom: 0;
      }

      .ai-note-info-divider {
        height: 1px;
        background: linear-gradient(90deg, rgba(88, 76, 116, 0.45), rgba(88, 76, 116, 0.15));
        margin: 10px 0;
      }

      .ai-note-file-row {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .ai-note-file-icon {
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
        margin-top: 2px;
        color: #a855f7;
        filter: drop-shadow(0 0 4px rgba(168, 85, 247, 0.3));
      }

      .ai-note-file-path code {
        display: inline-block;
        font-size: 12px;
        font-weight: 600;
        color: #f0e7fd;
        letter-spacing: 0.015em;
      }

      .ai-note-element-line {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
      }

      .ai-note-element-line code {
        font-size: 11.5px;
        color: #eedcff;
      }

      .ai-note-classes {
        color: #9a9cb2;
        font-size: 11px;
        line-height: 1.45;
        letter-spacing: 0.01em;
      }

      .ai-note-element-info pre {
        background: rgba(10, 10, 18, 0.8);
        border: 1px solid rgba(88, 76, 116, 0.22);
        border-radius: 8px;
        padding: 10px 12px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11.5px;
        overflow-x: auto;
        max-height: 64px;
        overflow-y: auto;
        margin: 0;
        line-height: 1.5;
        color: #b8b0cc;
        letter-spacing: 0.02em;
        scrollbar-width: thin;
        scrollbar-color: rgba(113, 24, 226, 0.3) transparent;
      }

      .ai-note-element-info pre code {
        background: none;
        border: none;
        padding: 0;
        font-size: inherit;
        color: inherit;
        letter-spacing: inherit;
      }

      .ai-note-inherited-hint {
        display: flex;
        align-items: center;
        gap: 5px;
        margin-top: 8px;
        padding: 5px 8px;
        background: rgba(139, 92, 246, 0.1);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 6px;
        font-size: 11px;
        color: rgba(168, 140, 220, 1);
        line-height: 1.35;
      }

      .ai-note-inherited-hint svg {
        flex-shrink: 0;
        opacity: 0.8;
      }

      .ai-note-open-editor {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        background: transparent;
        border: none;
        color: #b89af5;
        padding: 4px 0 0;
        border-radius: 0;
        font-size: 12px;
        font-weight: 500;
        line-height: 1.4;
        cursor: pointer;
        text-decoration: none;
        align-self: flex-start;
        transition: color 0.2s ease;
      }

      .ai-note-open-editor:hover {
        color: #ddd0ff;
        text-decoration: underline;
        text-underline-offset: 3px;
        text-decoration-color: rgba(184, 154, 245, 0.5);
      }

      .ai-note-placeholder {
        text-align: center;
        padding: 32px 16px 36px;
        color: #7a7c90;
      }

      .ai-note-placeholder p {
        margin: 0;
        font-size: 13px;
        letter-spacing: 0.02em;
        line-height: 1.5;
        opacity: 0.75;
      }

      /* Note section — sticky at bottom so copy button stays visible */
      .ai-note-note-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding-top: 12px;
        border-top: 1px solid rgba(88, 76, 116, 0.2);
        position: sticky;
        bottom: 0;
        z-index: 2;
        background: #161820;
      }

      .ai-note-label {
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #8b8da2;
      }

      .ai-note-textarea {
        background: rgba(14, 12, 24, 0.6);
        border: 1px solid rgba(88, 76, 116, 0.3);
        border-radius: 10px;
        padding: 10px 12px;
        color: #fff;
        font-family: ui-sans-serif, system-ui, sans-serif;
        font-size: 13px;
        line-height: 1.55;
        resize: vertical;
        min-height: 60px;
        max-height: 200px;
        width: 100%;
        box-sizing: border-box;
        transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        letter-spacing: 0.01em;
      }

      .ai-note-textarea:focus {
        outline: none;
        border-color: rgba(139, 92, 246, 0.6);
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1), inset 0 0 0 1px rgba(139, 92, 246, 0.15);
        background: rgba(16, 14, 28, 0.7);
      }

      .ai-note-textarea::placeholder {
        color: #5e6078;
      }

      .ai-note-actions {
        display: flex;
        justify-content: flex-end;
        padding: 8px 0 0;
        position: sticky;
        bottom: 0;
        z-index: 2;
        background: #161820;
      }

      .ai-note-copy-btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: linear-gradient(180deg, #9333ea 0%, #7c3aed 100%);
        border: none;
        color: #fff;
        padding: 8px 18px;
        border-radius: 9px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        letter-spacing: 0.02em;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, filter 0.2s ease;
        box-shadow:
          0 4px 14px rgba(124, 58, 237, 0.35),
          0 1px 3px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.12);
      }

      .ai-note-copy-btn:hover {
        background: linear-gradient(180deg, #a855f7 0%, #8b5cf6 100%);
        transform: translateY(-1px);
        box-shadow:
          0 6px 20px rgba(139, 92, 246, 0.4),
          0 2px 6px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }

      .ai-note-copy-btn:active {
        transform: translateY(0px) scale(0.98);
        box-shadow:
          0 2px 8px rgba(124, 58, 237, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.08);
      }

      .ai-note-copy-btn svg {
        flex-shrink: 0;
      }

      /* Re-inspect button */
      .ai-note-reinspect-btn {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(88, 76, 116, 0.3);
        color: #a8aac0;
        padding: 5px 10px;
        border-radius: 7px;
        font-size: 11.5px;
        font-weight: 500;
        cursor: pointer;
        flex-shrink: 0;
        transition: all 0.2s ease;
        letter-spacing: 0.01em;
      }

      .ai-note-reinspect-btn:hover {
        background: rgba(139, 92, 246, 0.08);
        border-color: rgba(139, 92, 246, 0.4);
        color: #d4c0ff;
      }

      .ai-note-reinspect-btn:active {
        background: rgba(139, 92, 246, 0.14);
        transform: scale(0.97);
      }

      .ai-note-empty-state {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .ai-note-empty-state p {
        margin: 0;
      }

      .ai-note-empty-state .ai-note-element-line {
        align-items: flex-start;
      }

      .ai-note-help {
        color: #8a8c9e;
        font-size: 12px;
        line-height: 1.55;
        margin: 0;
        letter-spacing: 0.01em;
      }

      /* Toggle button group (segmented control) */
      .ai-note-toggles {
        display: inline-flex;
        align-items: center;
        background: rgba(14, 12, 24, 0.6);
        border: 1px solid rgba(88, 76, 116, 0.3);
        border-radius: 10px;
        padding: 3px;
        gap: 2px;
      }

      .ai-note-toggle-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: transparent;
        border: none;
        color: #6b6d82;
        padding: 7px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        letter-spacing: 0.01em;
        white-space: nowrap;
        line-height: 1;
      }

      .ai-note-toggle-btn:hover {
        color: #a8aac0;
        background: rgba(255, 255, 255, 0.03);
      }

      .ai-note-toggle-btn.active {
        background: rgba(139, 92, 246, 0.18);
        color: #d4c0ff;
        box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.25);
      }

      .ai-note-toggle-btn.active:hover {
        background: rgba(139, 92, 246, 0.25);
        color: #ddd0ff;
      }

      .ai-note-toggle-btn svg {
        flex-shrink: 0;
        opacity: 0.7;
      }

      .ai-note-toggle-btn.active svg {
        opacity: 1;
      }

      /* Multi-select counter badge */
      .ai-note-counter {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 22px;
        height: 22px;
        background: rgba(139, 92, 246, 0.25);
        border-radius: 11px;
        font-size: 11px;
        font-weight: 700;
        color: #d4c0ff;
        padding: 0 6px;
      }

      /* Done button */
      .ai-note-done-btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: linear-gradient(180deg, #9333ea 0%, #7c3aed 100%);
        border: none;
        color: #fff;
        padding: 8px 18px;
        border-radius: 9px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        letter-spacing: 0.02em;
        transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease;
        box-shadow:
          0 4px 14px rgba(124, 58, 237, 0.35),
          0 1px 3px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.12);
      }

      .ai-note-done-btn:hover {
        background: linear-gradient(180deg, #a855f7 0%, #8b5cf6 100%);
        transform: translateY(-1px);
        box-shadow:
          0 6px 20px rgba(139, 92, 246, 0.4),
          0 2px 6px rgba(0, 0, 0, 0.2),
          inset 0 1px 0 rgba(255, 255, 255, 0.15);
      }

      .ai-note-done-btn:active {
        transform: translateY(0px) scale(0.98);
      }

      /* Selected elements list */
      .ai-note-selected-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .ai-note-selected-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: rgba(14, 12, 24, 0.4);
        border: 1px solid rgba(88, 76, 116, 0.2);
        border-radius: 8px;
        font-size: 12px;
      }

      .ai-note-selected-item .number {
        color: #8b8da2;
        font-size: 10px;
        font-weight: 700;
        min-width: 16px;
      }

      .ai-note-selected-item .item-content {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 6px;
        min-width: 0;
      }

      .ai-note-selected-item code {
        background: rgba(126, 58, 226, 0.15);
        border: 1px solid rgba(126, 58, 226, 0.12);
        padding: 1px 7px;
        border-radius: 5px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 11px;
        font-weight: 500;
        color: #dbb8ff;
      }

      .ai-note-selected-item .item-loc {
        color: #6b6d82;
        font-size: 11px;
        white-space: nowrap;
      }

      .ai-note-selected-item .remove-btn {
        margin-left: auto;
        background: none;
        border: none;
        color: #8b8da2;
        cursor: pointer;
        padding: 2px 4px;
        font-size: 14px;
        line-height: 1;
        border-radius: 4px;
        flex-shrink: 0;
        transition: color 0.15s ease, background 0.15s ease;
      }

      .ai-note-selected-item .remove-btn:hover {
        color: #f87171;
        background: rgba(248, 113, 113, 0.1);
      }
    `;
    canvas.append(style);

    // ─── Panel DOM ────────────────────────────────────────────
    const panel = document.createElement('div');
    panel.className = 'ai-note-panel';
    canvas.append(panel);

    const windowEl = document.createElement('astro-dev-toolbar-window');
    windowEl.innerHTML = '<div class="ai-note-canvas"></div>';
    canvas.append(windowEl);
    const canvasInner = windowEl.querySelector('.ai-note-canvas')!;
    canvasInner.append(panel);

    // ─── Render functions ─────────────────────────────────────

    function renderPlaceholder() {
      panel.innerHTML = '';
      panel.dataset.visible = 'false';

      const hint = state.selectEnabled
        ? (state.isMultiSelect ? 'Click elements to select them.' : 'Click any element to inspect it.')
        : 'Enable select to inspect elements.';

      panel.innerHTML = `
        <div class="ai-note-placeholder">
          <p>${hint}</p>
          <div style="margin-top:12px;">
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn ${state.selectEnabled ? 'active' : ''}" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
              ${state.selectEnabled ? `
                <button class="ai-note-toggle-btn ${state.isMultiSelect ? 'active' : ''}" data-action="toggle-multi">
                  ${multiIcon}
                  Multi
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      `;

      const toggleSelectBtn = panel.querySelector('[data-action="toggle-select"]') as HTMLButtonElement;
      toggleSelectBtn.addEventListener('click', () => {
        state.selectEnabled = !state.selectEnabled;
        if (state.selectEnabled) {
          startInspecting();
        } else {
          stopInspecting();
          clearSelection();
        }
        renderPlaceholder();
      });

      const toggleMultiBtn = panel.querySelector('[data-action="toggle-multi"]') as HTMLButtonElement;
      if (toggleMultiBtn) {
        toggleMultiBtn.addEventListener('click', () => {
          state.isMultiSelect = !state.isMultiSelect;
          if (!state.isMultiSelect && state.selectedElements.length > 0) {
            clearSelection();
          }
          renderPlaceholder();
        });
      }

      panel.dataset.visible = 'true';
    }

    function buildCopyText(entries: SelectedEntry[], note: string): string {
      const lines: string[] = [];

      if (entries.length === 1) {
        // Single element — compact format (same as before)
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

        // Island props
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
        // Multiple elements — grouped by file
        const byFile = new Map<string, SelectedEntry[]>();
        for (const entry of entries) {
          const key = entry.info.filePath;
          if (!byFile.has(key)) byFile.set(key, []);
          byFile.get(key)!.push(entry);
        }

        let num = 0;
        for (const [_file, fileEntries] of byFile) {
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
              // Same file, multiple elements
              lines.push(`File: ${info.relativePath}:${info.location}`);
              lines.push(`Element ${num}: <${tagName}>`);
            } else {
              // Multiple files
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

    function renderElementInfo(entry: SelectedEntry) {
      const { element, info, isInherited } = entry;
      panel.innerHTML = '';
      panel.dataset.visible = 'false';

      // Show the actual clicked element's info when inherited
      const displayTagName = isInherited
        ? element.tagName.toLowerCase()
        : info.tagName;
      const displayClasses = isInherited
        ? cleanClasses(typeof element.className === 'string' ? element.className : '')
        : info.classes;
      const displayHtml = isInherited
        ? (() => {
            const raw = cleanHtml(element.outerHTML);
            return raw.length > 120 ? raw.slice(0, 117) + '...' : raw;
          })()
        : info.htmlSnippet;

      const inheritedHint = isInherited
        ? `<div class="ai-note-inherited-hint">
             <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM8.75 4.25a.75.75 0 0 0-1.5 0V8a.75.75 0 0 0 .375.65l2.5 1.5a.75.75 0 0 0 .75-1.3L8.75 7.55V4.25Z"/></svg>
             Source resolved to parent element
           </div>`
        : '';

      panel.innerHTML = `
        <div class="ai-note-header">
          <h2>Inspect & Clip</h2>
          <div style="display:flex;gap:6px;align-items:center;">
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn ${state.selectEnabled ? 'active' : ''}" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
              <button class="ai-note-toggle-btn" data-action="toggle-multi">
                ${multiIcon}
                Multi
              </button>
            </div>
            <button class="ai-note-reinspect-btn" title="Select another element">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path fill="currentColor" d="M7.9 1.5v-.4a1.1 1.1 0 0 1 2.2 0v.4a1.1 1.1 0 1 1-2.2 0Zm-6.4 8.6a1.1 1.1 0 1 0 0-2.2h-.4a1.1 1.1 0 0 0 0 2.2h.4ZM12 3.7a1.1 1.1 0 0 0 1.4-.7l.4-1.1a1.1 1.1 0 0 0-2.1-.8l-.4 1.2a1.1 1.1 0 0 0 .7 1.4Zm-9.7 7.6-1.2.4a1.1 1.1 0 1 0 .8 2.1l1-.4a1.1 1.1 0 1 0-.6-2ZM20.8 17a1.9 1.9 0 0 1 0 2.6l-1.2 1.2a1.9 1.9 0 0 1-2.6 0l-4.3-4.2-1.6 3.6a1.9 1.9 0 0 1-1.7 1.2A1.9 1.9 0 0 1 7.5 20L2.7 5a1.9 1.9 0 0 1 2.4-2.4l15 5a1.9 1.9 0 0 1 .2 3.4l-3.7 1.6 4.2 4.3ZM19 18.3 14.6 14a1.9 1.9 0 0 1 .6-3l3.2-1.5L5.1 5.1l4.3 13.3 1.5-3.2a1.9 1.9 0 0 1 3-.6l4.4 4.4.7-.7Z"/></svg>
              Re-select
            </button>
            </div>
          </div>
        </div>
        <div class="ai-note-element-info">
          <div class="ai-note-info-section">
            <div class="row ai-note-file-row">
              <svg class="ai-note-file-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path fill="currentColor" d="M3 1.5A1.5 1.5 0 0 0 1.5 3v10A1.5 1.5 0 0 0 3 14.5h10A1.5 1.5 0 0 0 14.5 13V5.8a1.5 1.5 0 0 0-.44-1.06L11.26 1.94A1.5 1.5 0 0 0 10.2 1.5H3Zm0 1.25h6.5V5h3.25v8H3v-10Z"/>
              </svg>
              <div class="ai-note-file-meta">
                <div class="label">File</div>
                <div class="ai-note-file-path"><code>${escapeHtml(info.relativePath)}:${escapeHtml(info.location)}</code></div>
              </div>
            </div>
            <div class="row">
              <div class="label">Element</div>
              <div class="ai-note-element-line">
                <code>&lt;${escapeHtml(displayTagName)}&gt;</code>
                ${displayClasses ? `<span class="ai-note-classes">${escapeHtml(displayClasses)}</span>` : ''}
              </div>
            </div>
          </div>
          <div class="ai-note-info-divider"></div>
          <div class="row">
            <div class="label">HTML</div>
            <pre><code>${escapeHtml(displayHtml)}</code></pre>
          </div>
          ${inheritedHint}
          <button class="ai-note-open-editor" type="button">Open in Editor</button>
        </div>
        <div class="ai-note-note-section">
          <label class="ai-note-label" for="ai-note-textarea">Instruction</label>
          <textarea
            id="ai-note-textarea"
            class="ai-note-textarea"
            placeholder="Describe the change you want..."
            rows="2"
          ></textarea>
          <div class="ai-note-actions">
            <button class="ai-note-copy-btn" data-action="copy">
              <svg width="14" height="14" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9.125.8125h-6c-.14918 0-.29226.059263-.39775.164752-.10549.105488-.16475.248568-.16475.397748v1.6875H.875c-.149184 0-.292258.05926-.397748.16475C.371763 3.33274.3125 3.47582.3125 3.625v6c0 .14918.059263.29226.164752.3977.10549.1055.248564.1648.397748.1648h6c.14918 0 .29226-.0593.39775-.1648.10549-.10544.16475-.24852.16475-.3977V7.9375H9.125c.14918 0 .29226-.05926.39775-.16475.10549-.10549.16475-.24857.16475-.39775v-6c0-.14918-.05926-.29226-.16475-.397748C9.41726.871763 9.27418.8125 9.125.8125Zm-2.8125 8.25h-4.875v-4.875h4.875v4.875Zm2.25-2.25h-1.125V3.625c0-.14918-.05926-.29226-.16475-.39775-.10549-.10549-.24857-.16475-.39775-.16475H3.6875v-1.125h4.875v4.875Z"/></svg>
              Copy
            </button>
          </div>
        </div>
      `;

      // Open in Editor button
      const openBtn = panel.querySelector('.ai-note-open-editor') as HTMLButtonElement;
      openBtn.addEventListener('click', () => {
        fetch('/__open-in-editor?file=' + encodeURIComponent(info.filePath + ':' + info.location));
      });

      // Select toggle
      const toggleSelectBtn = panel.querySelector('[data-action="toggle-select"]') as HTMLButtonElement;
      toggleSelectBtn.addEventListener('click', () => {
        state.selectEnabled = !state.selectEnabled;
        if (state.selectEnabled) {
          startInspecting();
        } else {
          stopInspecting();
        }
        renderElementInfo(entry);
      });

      // Multi-select toggle
      const toggleBtn = panel.querySelector('[data-action="toggle-multi"]') as HTMLButtonElement;
      toggleBtn.addEventListener('click', () => {
        state.isMultiSelect = !state.isMultiSelect;
        if (state.isMultiSelect) {
          // Switch to multi-select: keep current selection, resume inspecting
          startInspecting();
        }
      });

      // Re-inspect button
      const reinspectBtn = panel.querySelector('.ai-note-reinspect-btn') as HTMLButtonElement;
      reinspectBtn.addEventListener('click', () => {
        clearSelection();
        startInspecting();
      });

      // Copy button
      const copyBtn = panel.querySelector('.ai-note-copy-btn') as HTMLButtonElement;
      const textarea = panel.querySelector('#ai-note-textarea') as HTMLTextAreaElement;

      copyBtn.addEventListener('click', () => {
        const text = buildCopyText(state.selectedElements, textarea.value);
        handleCopy(copyBtn, text);
      });

      panel.dataset.visible = 'true';
    }

    // ─── Multi-select inspecting view (while selecting) ──────────

    function renderMultiSelectInspecting() {
      panel.innerHTML = '';
      panel.dataset.visible = 'false';

      const count = state.selectedElements.length;
      panel.innerHTML = `
        <div class="ai-note-header">
          <h2>Inspect & Clip</h2>
          <div style="display:flex;gap:6px;align-items:center;">
            ${count > 0 ? `<span class="ai-note-counter">${count}</span>` : ''}
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn active" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
              <button class="ai-note-toggle-btn active" data-action="toggle-multi">
                ${multiIcon}
                Multi
              </button>
            </div>
          </div>
        </div>
        <div class="ai-note-placeholder">
          <p>${count > 0
            ? `${count} element${count > 1 ? 's' : ''} selected. Click more or press Done.`
            : 'Click any element to select it.'}</p>
        </div>
        ${count > 0 ? `
          <div class="ai-note-selected-list">
            ${state.selectedElements.map((entry, i) => `
              <div class="ai-note-selected-item">
                <span class="number">${i + 1}</span>
                <div class="item-content">
                  <code>&lt;${escapeHtml(entry.element.tagName.toLowerCase())}&gt;</code>
                  <span class="item-loc">${escapeHtml(entry.info.relativePath)}:${escapeHtml(entry.info.location)}</span>
                </div>
                <button class="remove-btn" data-remove="${i}" title="Remove">&times;</button>
              </div>
            `).join('')}
          </div>
          <div class="ai-note-actions">
            <button class="ai-note-done-btn" data-action="done">
              <svg width="14" height="14" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="#fff" d="M9.47334.806574C9.41136.744088 9.33763.694492 9.25639.660646S9.08802.609375 9.00001.609375 8.82486.6268 8.74362.660646s-.15497.083442-.21695.145928L3.56001 5.77991 1.47334 3.68657c-.06435-.06216-.14031-.11103-.22354-.14383-.08324-.03281-.17212-.04889-.261578-.04735-.089454.00155-.177727.0207-.259779.05637-.082052.03566-.156277.08713-.218436.15148-.062159.06435-.111035.14031-.143837.22355-.032803.08323-.04889.17212-.047342.26157.001547.08945.020699.17773.056361.25978.035663.08205.087137.15627.151485.21843l2.559996 2.56c.06198.06249.13571.11209.21695.14593.08124.03385.16838.05127.25639.05127s.17514-.01742.25638-.05127c.08124-.03384.15498-.08344.21695-.14593l5.44-5.44c.06767-.06242.12168-.13819.15861-.22253.03694-.08433.05601-.1754.05601-.26747 0-.09206-.01907-.18313-.05601-.26747-.03693-.08433-.09094-.160098-.15861-.222526Z"/></svg>
              Done
            </button>
          </div>
        ` : ''}
      `;

      // Toggle off select
      const toggleSelectBtn = panel.querySelector('[data-action="toggle-select"]') as HTMLButtonElement;
      if (toggleSelectBtn) {
        toggleSelectBtn.addEventListener('click', () => {
          state.selectEnabled = false;
          stopInspecting();
          renderPlaceholder();
        });
      }

      // Toggle off multi-select
      const toggleBtn = panel.querySelector('[data-action="toggle-multi"]') as HTMLButtonElement;
      toggleBtn.addEventListener('click', () => {
        state.isMultiSelect = false;
        clearSelection();
        renderPlaceholder();
      });

      // Remove individual elements
      panel.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const idx = parseInt((btn as HTMLElement).dataset.remove!, 10);
          const removed = state.selectedElements.splice(idx, 1)[0];
          removed.element.classList.remove('ai-note-selected');
          if (state.selectedElements.length === 0) {
            renderPlaceholder();
          } else {
            renderMultiSelectInspecting();
          }
        });
      });

      // Done button → show final multi-element panel
      const doneBtn = panel.querySelector('[data-action="done"]') as HTMLButtonElement;
      if (doneBtn) {
        doneBtn.addEventListener('click', () => {
          stopInspecting();
          renderMultiSelectPanel();
        });
      }

      panel.dataset.visible = 'true';
    }

    // ─── Multi-select result panel (after clicking Done) ─────────

    function renderMultiSelectPanel() {
      panel.innerHTML = '';
      panel.dataset.visible = 'false';

      panel.innerHTML = `
        <div class="ai-note-header">
          <h2>Inspect & Clip</h2>
          <div style="display:flex;gap:6px;align-items:center;">
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
            </div>
            <button class="ai-note-reinspect-btn" title="Select elements again">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path fill="currentColor" d="M7.9 1.5v-.4a1.1 1.1 0 0 1 2.2 0v.4a1.1 1.1 0 1 1-2.2 0Zm-6.4 8.6a1.1 1.1 0 1 0 0-2.2h-.4a1.1 1.1 0 0 0 0 2.2h.4ZM12 3.7a1.1 1.1 0 0 0 1.4-.7l.4-1.1a1.1 1.1 0 0 0-2.1-.8l-.4 1.2a1.1 1.1 0 0 0 .7 1.4Zm-9.7 7.6-1.2.4a1.1 1.1 0 1 0 .8 2.1l1-.4a1.1 1.1 0 1 0-.6-2ZM20.8 17a1.9 1.9 0 0 1 0 2.6l-1.2 1.2a1.9 1.9 0 0 1-2.6 0l-4.3-4.2-1.6 3.6a1.9 1.9 0 0 1-1.7 1.2A1.9 1.9 0 0 1 7.5 20L2.7 5a1.9 1.9 0 0 1 2.4-2.4l15 5a1.9 1.9 0 0 1 .2 3.4l-3.7 1.6 4.2 4.3ZM19 18.3 14.6 14a1.9 1.9 0 0 1 .6-3l3.2-1.5L5.1 5.1l4.3 13.3 1.5-3.2a1.9 1.9 0 0 1 3-.6l4.4 4.4.7-.7Z"/></svg>
            Re-select
          </button>
          </div>
        </div>
        <div class="ai-note-element-info">
          <div class="ai-note-info-section">
            <div class="row">
              <div class="label">${state.selectedElements.length} elements selected</div>
            </div>
          </div>
          <div class="ai-note-info-divider"></div>
          <div class="ai-note-selected-list">
            ${state.selectedElements.map((entry, i) => `
              <div class="ai-note-selected-item">
                <span class="number">${i + 1}</span>
                <div class="item-content">
                  <code>&lt;${escapeHtml(entry.element.tagName.toLowerCase())}&gt;</code>
                  ${entry.element.className && typeof entry.element.className === 'string'
                    ? `<span class="ai-note-classes">${escapeHtml(cleanClasses(entry.element.className))}</span>`
                    : ''}
                </div>
                <span class="item-loc">${escapeHtml(entry.info.relativePath)}:${escapeHtml(entry.info.location)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="ai-note-note-section">
          <label class="ai-note-label" for="ai-note-textarea">Instruction</label>
          <textarea
            id="ai-note-textarea"
            class="ai-note-textarea"
            placeholder="Describe the change you want..."
            rows="2"
          ></textarea>
          <div class="ai-note-actions">
            <button class="ai-note-copy-btn" data-action="copy">
              <svg width="14" height="14" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9.125.8125h-6c-.14918 0-.29226.059263-.39775.164752-.10549.105488-.16475.248568-.16475.397748v1.6875H.875c-.149184 0-.292258.05926-.397748.16475C.371763 3.33274.3125 3.47582.3125 3.625v6c0 .14918.059263.29226.164752.3977.10549.1055.248564.1648.397748.1648h6c.14918 0 .29226-.0593.39775-.1648.10549-.10544.16475-.24852.16475-.3977V7.9375H9.125c.14918 0 .29226-.05926.39775-.16475.10549-.10549.16475-.24857.16475-.39775v-6c0-.14918-.05926-.29226-.16475-.397748C9.41726.871763 9.27418.8125 9.125.8125Zm-2.8125 8.25h-4.875v-4.875h4.875v4.875Zm2.25-2.25h-1.125V3.625c0-.14918-.05926-.29226-.16475-.39775-.10549-.10549-.24857-.16475-.39775-.16475H3.6875v-1.125h4.875v4.875Z"/></svg>
              Copy
            </button>
          </div>
        </div>
      `;

      // Select toggle
      const toggleSelectBtn = panel.querySelector('[data-action="toggle-select"]') as HTMLButtonElement;
      toggleSelectBtn.addEventListener('click', () => {
        state.selectEnabled = !state.selectEnabled;
        if (state.selectEnabled) {
          clearSelection();
          startInspecting();
        } else {
          renderMultiSelectPanel();
        }
      });

      // Re-inspect button
      const reinspectBtn = panel.querySelector('.ai-note-reinspect-btn') as HTMLButtonElement;
      reinspectBtn.addEventListener('click', () => {
        clearSelection();
        startInspecting();
      });

      // Copy button
      const copyBtn = panel.querySelector('.ai-note-copy-btn') as HTMLButtonElement;
      const textarea = panel.querySelector('#ai-note-textarea') as HTMLTextAreaElement;

      copyBtn.addEventListener('click', () => {
        const text = buildCopyText(state.selectedElements, textarea.value);
        handleCopy(copyBtn, text);
      });

      panel.dataset.visible = 'true';
    }

    // ─── Inspector logic ──────────────────────────────────────

    function startInspecting() {
      if (!state.selectEnabled) return;
      state.isInspecting = true;
      document.body.classList.add('ai-note-inspecting');
      renderPlaceholder();
    }

    function stopInspecting() {
      state.isInspecting = false;
      document.body.classList.remove('ai-note-inspecting');
      clearHover();
    }

    function clearHover() {
      if (state.hoverOutlineElement) {
        state.hoverOutlineElement.classList.remove('ai-note-hover-outline');
        state.hoverOutlineElement = null;
      }
    }

    function clearSelection() {
      for (const entry of state.selectedElements) {
        entry.element.classList.remove('ai-note-selected');
      }
      state.selectedElements = [];
    }

    /**
     * Resolve an element to the nearest source location, while allowing the
     * file path to be inherited from an ancestor. Astro and the Audit toolbar
     * can leave those two pieces on different elements depending on timing.
     */
    function resolveSourceElement(element: HTMLElement) {
      let resolved: HTMLElement | null = null;
      let filePath = '';
      let location = '';
      let current: HTMLElement | null = element;

      while (current) {
        if (current.closest('astro-dev-toolbar')) break;

        const source = readSourceAnnotation(current);
        if (!location) {
          if (source.loc) {
            location = source.loc;
            resolved = current;
            filePath = source.file;
          }
        } else if (!filePath && source.file) {
          filePath = source.file;
        }

        if (location && filePath && resolved) {
          break;
        }

        current = current.parentElement;
      }

      if (!resolved || !filePath || !location) {
        return { element, info: null };
      }

      return { element: resolved, info: getElementInfo(resolved, filePath, location) };
    }

    function selectElement(element: HTMLElement) {
      clearHover();

      const { element: resolved, info } = resolveSourceElement(element);

      if (!info) {
        renderNoSourceInfo(element);
        return;
      }

      const isInherited = resolved !== element;
      element.classList.add('ai-note-selected');

      if (state.isMultiSelect) {
        // Multi-select: add to array, keep inspecting
        state.selectedElements.push({ element, info, isInherited });
        renderMultiSelectInspecting();
      } else {
        // Single-select: replace, stop inspecting
        clearSelection();
        element.classList.add('ai-note-selected');
        state.selectedElements = [{ element, info, isInherited }];
        renderElementInfo({ element, info, isInherited });
        stopInspecting();
      }
    }

    function renderNoSourceInfo(element: HTMLElement) {
      panel.innerHTML = '';
      panel.dataset.visible = 'false';

      const tagName = element.tagName.toLowerCase();
      panel.innerHTML = `
        <div class="ai-note-header">
          <h2>Inspect & Clip</h2>
          <div style="display:flex;gap:6px;align-items:center;">
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn active" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
            </div>
            <button class="ai-note-reinspect-btn" title="Select another element">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path fill="currentColor" d="M7.9 1.5v-.4a1.1 1.1 0 0 1 2.2 0v.4a1.1 1.1 0 1 1-2.2 0Zm-6.4 8.6a1.1 1.1 0 1 0 0-2.2h-.4a1.1 1.1 0 0 0 0 2.2h.4ZM12 3.7a1.1 1.1 0 0 0 1.4-.7l.4-1.1a1.1 1.1 0 0 0-2.1-.8l-.4 1.2a1.1 1.1 0 0 0 .7 1.4Zm-9.7 7.6-1.2.4a1.1 1.1 0 1 0 .8 2.1l1-.4a1.1 1.1 0 1 0-.6-2ZM20.8 17a1.9 1.9 0 0 1 0 2.6l-1.2 1.2a1.9 1.9 0 0 1-2.6 0l-4.3-4.2-1.6 3.6a1.9 1.9 0 0 1-1.7 1.2A1.9 1.9 0 0 1 7.5 20L2.7 5a1.9 1.9 0 0 1 2.4-2.4l15 5a1.9 1.9 0 0 1 .2 3.4l-3.7 1.6 4.2 4.3ZM19 18.3 14.6 14a1.9 1.9 0 0 1 .6-3l3.2-1.5L5.1 5.1l4.3 13.3 1.5-3.2a1.9 1.9 0 0 1 3-.6l4.4 4.4.7-.7Z"/></svg>
            Re-select
          </button>
          </div>
        </div>
        <div class="ai-note-element-info">
          <div class="ai-note-empty-state">
            <div class="row">
              <div class="label">Element</div>
              <div class="ai-note-element-line">
                <code>&lt;${escapeHtml(tagName)}&gt;</code>
                <span class="ai-note-classes">No source info found for this element or its parents.</span>
              </div>
            </div>
            <p class="ai-note-help">Try clicking a component wrapper or a larger structural element instead.</p>
          </div>
        </div>
      `;

      const toggleSelectBtn = panel.querySelector('[data-action="toggle-select"]') as HTMLButtonElement;
      toggleSelectBtn.addEventListener('click', () => {
        state.selectEnabled = false;
        stopInspecting();
        renderPlaceholder();
      });

      const reinspectBtn = panel.querySelector('.ai-note-reinspect-btn') as HTMLButtonElement;
      reinspectBtn.addEventListener('click', () => {
        startInspecting();
      });

      panel.dataset.visible = 'true';
    }

    // ─── Event handlers ───────────────────────────────────────

    function onMouseMove(e: MouseEvent) {
      if (!state.isInspecting) return;
      const target = e.target as HTMLElement;
      if (!target || target.closest('astro-dev-toolbar')) return;

      if (target === state.hoverOutlineElement) return;
      clearHover();
      state.hoverOutlineElement = target;
      target.classList.add('ai-note-hover-outline');
    }

    function onClick(e: MouseEvent) {
      if (!state.isInspecting) return;
      const target = e.target as HTMLElement;
      if (!target || target.closest('astro-dev-toolbar')) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      selectElement(target);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (state.isInspecting) {
          stopInspecting();
          renderPlaceholder();
        } else if (state.selectedElements.length > 0) {
          clearSelection();
          renderPlaceholder();
        }
      }
    }

    // ─── Global listener management ───────────────────────────

    function addGlobalListeners() {
      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('click', onClick, true);
      document.addEventListener('keydown', onKeyDown);
    }

    function removeGlobalListeners() {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown);
    }

    addGlobalListeners();

    // ─── Toggle via toolbar ───────────────────────────────────

    eventTarget.addEventListener('app-toggled', (event: any) => {
      if (event.detail.state === true) {
        // App activated — reset state and start inspecting if enabled
        state.selectEnabled = true;
        startInspecting();
      } else {
        // App deactivated — clean up
        stopInspecting();
        clearSelection();
        renderPlaceholder();
      }
    });

    // ─── Page navigation cleanup ──────────────────────────────

    document.addEventListener('astro:after-swap', () => {
      // Re-inject global styles after page swap (head is replaced)
      if (!document.getElementById('ai-note-global-styles')) {
        document.head.appendChild(globalStyle);
      }
      // Only re-add listeners if the plugin is currently active
      if (state.isInspecting || state.selectedElements.length > 0) {
        removeGlobalListeners();
        stopInspecting();
        clearSelection();
        renderPlaceholder();
        addGlobalListeners();
        startInspecting();
      }
    });

    // Do NOT start inspecting here — wait for app-toggled event.
    // Listeners are passive (guard with state.isInspecting) until then.
  },
};
