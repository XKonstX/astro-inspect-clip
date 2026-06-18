export const PANEL_STYLES = String.raw`
      .ai-note-canvas {
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        color: #c0c4d0;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }

      .ai-note-panel {
        display: none;
        flex-direction: column;
        gap: 12px;
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
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
        flex-wrap: wrap;
        gap: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid rgba(88, 76, 116, 0.25);
        position: sticky;
        top: 0;
        z-index: 2;
        min-width: 0;
        background: #161820;
      }

      .ai-note-header h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #fff;
        letter-spacing: 0.04em;
        flex: 0 0 auto;
      }

      .ai-note-header-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 6px;
        min-width: 0;
      }

      .ai-note-element-info {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
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

      .ai-note-header > .ai-note-element-info {
        flex: 1 0 100%;
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

      .ai-note-file-meta {
        min-width: 0;
      }

      .ai-note-file-path code {
        display: inline-block;
        max-width: 100%;
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
        overflow-wrap: anywhere;
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

      .ai-note-open-editor:focus-visible,
      .ai-note-toggle-btn:focus-visible,
      .ai-note-reinspect-btn:focus-visible,
      .ai-note-copy-btn:focus-visible,
      .ai-note-done-btn:focus-visible,
      .ai-note-secondary-btn:focus-visible,
      .ai-note-danger-btn:focus-visible,
      .ai-note-selected-item .remove-btn:focus-visible {
        outline: 2px solid rgba(196, 181, 253, 0.75);
        outline-offset: 2px;
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

      .ai-note-placeholder-actions {
        margin-top: 12px;
      }

      /* Note section - sticky at bottom so copy button stays visible */
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
        flex-wrap: wrap;
        gap: 8px;
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

      .ai-note-copy-btn:disabled {
        cursor: default;
        opacity: 0.78;
        transform: none;
      }

      .ai-note-copy-btn:disabled:hover {
        filter: none;
        transform: none;
      }

      .ai-note-copy-btn svg {
        flex-shrink: 0;
      }

      .ai-note-secondary-btn,
      .ai-note-danger-btn {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(88, 76, 116, 0.3);
        color: #c7cad8;
        padding: 8px 14px;
        border-radius: 9px;
        font-size: 12px;
        font-weight: 600;
        cursor: pointer;
        letter-spacing: 0.01em;
        transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      }

      .ai-note-secondary-btn:hover {
        background: rgba(34, 197, 94, 0.08);
        border-color: rgba(34, 197, 94, 0.35);
        color: #bbf7d0;
      }

      .ai-note-danger-btn:hover {
        background: rgba(248, 113, 113, 0.08);
        border-color: rgba(248, 113, 113, 0.35);
        color: #fecaca;
      }

      .ai-note-context-summary {
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 10px 12px;
        background: rgba(14, 12, 24, 0.42);
        border: 1px solid rgba(88, 76, 116, 0.24);
        border-radius: 8px;
      }

      .ai-note-context-summary p {
        margin: 0;
        color: #9a9cb2;
        font-size: 12px;
        line-height: 1.45;
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
        transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.2s ease;
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

      .ai-note-diagnostic-title {
        color: #d8ccf8;
        font-size: 12px;
        font-weight: 650;
        line-height: 1.45;
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
        transition: background 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        letter-spacing: 0.01em;
        white-space: nowrap;
        line-height: 1;
      }

      .ai-note-toggle-btn[aria-pressed="true"] {
        background: rgba(139, 92, 246, 0.18);
        color: #d4c0ff;
        box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.25);
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
        flex-wrap: wrap;
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
        flex: 1 1 180px;
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
        min-width: 0;
        overflow-wrap: anywhere;
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
