export const GLOBAL_STYLES = String.raw`
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

      .ai-note-commented {
        outline: 2px solid rgba(34, 197, 94, 0.85) !important;
        outline-offset: 3px !important;
        box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.14) !important;
      }

      .ai-note-commented-hover {
        outline: 4px solid rgba(34, 197, 94, 0.95) !important;
        outline-offset: 3px !important;
        box-shadow:
          0 0 0 6px rgba(34, 197, 94, 0.18),
          0 8px 22px rgba(15, 23, 42, 0.22) !important;
      }

      .ai-note-selected.ai-note-commented {
        outline: 2px solid rgba(139, 92, 246, 0.95) !important;
        outline-offset: 2px !important;
        box-shadow:
          0 0 0 4px rgba(139, 92, 246, 0.16),
          0 0 0 7px rgba(34, 197, 94, 0.16) !important;
      }

      .ai-note-selected.ai-note-commented-hover {
        outline: 4px solid rgba(139, 92, 246, 0.98) !important;
        outline-offset: 3px !important;
        box-shadow:
          0 0 0 6px rgba(139, 92, 246, 0.18),
          0 0 0 10px rgba(34, 197, 94, 0.18) !important;
      }

      .ai-note-comment-actions {
        position: fixed;
        z-index: 2147483647;
        display: none;
        align-items: center;
        gap: 4px;
        padding: 4px;
        background: rgba(22, 24, 32, 0.96);
        border: 1px solid rgba(123, 113, 154, 0.42);
        border-radius: 8px;
        box-shadow:
          0 8px 24px rgba(0, 0, 0, 0.28),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
        color: #e9e3f5;
        pointer-events: auto;
      }

      .ai-note-comment-actions[data-visible="true"] {
        display: flex;
      }

      .ai-note-comment-action {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: currentColor;
        cursor: pointer;
      }

      .ai-note-comment-action:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .ai-note-comment-action[data-action="delete-comment"]:hover {
        color: #fecaca;
        background: rgba(248, 113, 113, 0.12);
      }

      .ai-note-comment-action:focus-visible {
        outline: 2px solid rgba(196, 181, 253, 0.75);
        outline-offset: 2px;
      }

      .ai-note-review-popover {
        position: fixed;
        z-index: 2147483646;
        display: none;
        flex-direction: column;
        width: min(360px, calc(100vw - 24px));
        box-sizing: border-box;
        padding: 12px 28px 12px 12px;
        overflow: visible;
        background: rgba(22, 24, 32, 0.98);
        border: 1px solid rgba(123, 113, 154, 0.46);
        border-radius: 10px;
        box-shadow:
          0 18px 48px rgba(0, 0, 0, 0.34),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
        color: #e9e3f5;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        pointer-events: auto;
      }

      .ai-note-review-drag-handle {
        position: absolute;
        top: 42px;
        right: 6px;
        bottom: 42px;
        z-index: 2;
        width: 14px;
        min-height: 54px;
        border: 1px solid rgba(123, 113, 154, 0.5);
        border-radius: 999px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
          rgba(22, 24, 32, 0.96);
        box-shadow: 0 8px 18px rgba(0, 0, 0, 0.24);
        cursor: grab;
        touch-action: none;
      }

      .ai-note-review-drag-handle::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 2px;
        height: 28px;
        border-radius: 999px;
        background: repeating-linear-gradient(
          180deg,
          rgba(233, 227, 245, 0.72) 0 2px,
          transparent 2px 5px
        );
        transform: translate(-50%, -50%);
      }

      .ai-note-review-drag-handle:active {
        cursor: grabbing;
      }

      .ai-note-review-popover[data-visible="true"] {
        display: flex;
      }

      .ai-note-review-popover-header {
        display: flex;
        flex: 0 0 auto;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 8px;
      }

      .ai-note-review-popover-title {
        min-width: 0;
        margin: 0;
        color: #f2edf8;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.35;
        overflow-wrap: anywhere;
      }

      .ai-note-review-popover-close {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        padding: 0;
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: #a8aac0;
        cursor: pointer;
        font-size: 18px;
        line-height: 1;
      }

      .ai-note-review-popover-close:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #f2edf8;
      }

      .ai-note-review-textarea {
        width: 100%;
        flex: 1 1 auto;
        min-block-size: 96px;
        min-height: 96px;
        max-height: 220px;
        box-sizing: border-box;
        resize: vertical;
        overflow: auto;
        padding: 10px 11px;
        border: 1px solid rgba(88, 76, 116, 0.38);
        border-radius: 8px;
        background: rgba(12, 13, 18, 0.72);
        color: #f6f0ff;
        font: 13px/1.5 ui-sans-serif, system-ui, -apple-system, sans-serif;
      }

      .ai-note-review-textarea:focus {
        outline: none;
        border-color: rgba(139, 92, 246, 0.68);
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.14);
      }

      .ai-note-review-textarea::placeholder {
        color: #75788a;
      }

      .ai-note-review-popover-actions {
        display: flex;
        flex: 0 0 auto;
        flex-wrap: wrap;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 10px;
      }

      .ai-note-review-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 32px;
        padding: 7px 12px;
        border-radius: 8px;
        border: 1px solid rgba(88, 76, 116, 0.36);
        background: rgba(255, 255, 255, 0.04);
        color: #d7d4e2;
        cursor: pointer;
        font: 600 12px/1 ui-sans-serif, system-ui, -apple-system, sans-serif;
      }

      .ai-note-review-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        color: #f2edf8;
      }

      .ai-note-review-btn[data-primary="true"] {
        border-color: rgba(34, 197, 94, 0.52);
        background: rgba(34, 197, 94, 0.18);
        color: #dcfce7;
      }

      .ai-note-review-btn[data-danger="true"]:hover {
        border-color: rgba(248, 113, 113, 0.42);
        background: rgba(248, 113, 113, 0.12);
        color: #fecaca;
      }

      .ai-note-review-bar {
        position: fixed;
        right: 14px;
        bottom: max(14px, env(safe-area-inset-bottom));
        z-index: 2147483646;
        display: none;
        align-items: center;
        gap: 8px;
        padding: 8px 28px 8px 8px;
        border: 1px solid rgba(123, 113, 154, 0.42);
        border-radius: 14px;
        background: rgba(22, 24, 32, 0.98);
        box-shadow:
          0 14px 40px rgba(0, 0, 0, 0.32),
          inset 0 1px 0 rgba(255, 255, 255, 0.06);
        color: #e9e3f5;
        font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
        pointer-events: auto;
      }

      .ai-note-review-bar[data-visible="true"] {
        display: flex;
      }

      .ai-note-review-bar-drag {
        position: absolute;
        top: 7px;
        right: 7px;
        bottom: 7px;
        width: 12px;
        border: 1px solid rgba(123, 113, 154, 0.48);
        border-radius: 999px;
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
          rgba(22, 24, 32, 0.96);
        cursor: grab;
        touch-action: none;
      }

      .ai-note-review-bar-drag::before {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 2px;
        height: 18px;
        border-radius: 999px;
        background: repeating-linear-gradient(
          180deg,
          rgba(233, 227, 245, 0.72) 0 2px,
          transparent 2px 5px
        );
        transform: translate(-50%, -50%);
      }

      .ai-note-review-bar-drag:active {
        cursor: grabbing;
      }

      .ai-note-review-record-btn,
      .ai-note-review-context-btn,
      .ai-note-review-clear-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 34px;
        border: 0;
        border-radius: 10px;
        padding: 8px 12px;
        color: #f8fafc;
        cursor: pointer;
        font: 700 12px/1 ui-sans-serif, system-ui, -apple-system, sans-serif;
        white-space: nowrap;
      }

      .ai-note-review-record-btn {
        background: rgba(34, 197, 94, 0.9);
      }

      .ai-note-review-record-btn[data-state="recording"] {
        background: rgba(239, 68, 68, 0.92);
      }

      .ai-note-review-record-dot {
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: currentColor;
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.16);
      }

      .ai-note-review-context-btn {
        background: rgba(139, 92, 246, 0.92);
      }

      .ai-note-review-clear-btn {
        border: 1px solid rgba(248, 113, 113, 0.34);
        background: rgba(248, 113, 113, 0.12);
        color: #fecaca;
      }

      .ai-note-review-close-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        padding: 0;
        border: 0;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.05);
        color: #c9cad8;
        cursor: pointer;
      }

      .ai-note-review-close-btn:hover {
        background: rgba(255, 255, 255, 0.1);
        color: #f2edf8;
      }

      .ai-note-review-record-btn:hover,
      .ai-note-review-context-btn:hover,
      .ai-note-review-clear-btn:hover {
        filter: brightness(1.08);
      }

      .ai-note-review-record-btn:focus-visible,
      .ai-note-review-context-btn:focus-visible,
      .ai-note-review-clear-btn:focus-visible,
      .ai-note-review-close-btn:focus-visible,
      .ai-note-review-btn:focus-visible,
      .ai-note-review-popover-close:focus-visible {
        outline: 2px solid rgba(196, 181, 253, 0.78);
        outline-offset: 2px;
      }
    `;
