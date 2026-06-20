// plugins/astro-inspect-clip/app.ts
import type { AppState, CommentedContextEntry, NoSourceDiagnostic, SelectedEntry, SourceCandidate } from './types.js';
import { handleCopy } from './clipboard.js';
import { findCommentForEntry, getCommentId as getStoredCommentId, isSameCommentSource } from './comment-context.js';
import { buildCompleteContextText, buildCopyText, buildNoSourceCopyText } from './copy-text.js';
import { buildDomPath, cleanClasses, cleanHtml, escapeHtml, getElementContextInfo, getElementFingerprint, getTraversalParent, isDevToolbarElement } from './dom-utils.js';
import { bindInstructionDraft, readCommentContexts, readInstructionDraft, readReviewState, writeCommentContexts, writeReviewState } from './storage.js';
import { ensureSourceCache, getElementInfo, readSourceAnnotation, toRelativePath } from './source-cache.js';
import { injectGlobalStyles, injectPanelStyles } from './styles.js';

const icon = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true"><path fill="#fff" d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12V1zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11v14zm-7-2h4v-1h-4v1zm0-3h4v-1h-4v1zm0-3h4v-1h-4v1zm-2 6H7v1h3v-1zm0-3H7v1h3v-1zm0-3H7v1h3v-1z"/></svg>';

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
      commentedContexts: readCommentContexts(),
      hoverOutlineElement: null,
    };
    let isAppActive = false;
    let commentActionTarget: HTMLElement | null = null;
    let isReviewMode = false;
    let isFoldingToolbar = false;
    let activeReviewEntry: SelectedEntry | null = null;
    let reviewPopoverManualPosition: { left: number; top: number } | null = null;
    let reviewPopoverDragOffset: { x: number; y: number } | null = null;
    let reviewBarManualPosition: { left: number; top: number } | null = null;
    let reviewBarDragOffset: { x: number; y: number } | null = null;
    const commentedElementsById = new Map<string, HTMLElement>();

    ensureSourceCache();

    // ─── Toggle icons ───────────────────────────────────────────
    const selectIcon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M6.646 10.646a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L7 11.207l-1.646 1.647a.5.5 0 1 1-.708-.708l2-2ZM2 2.5A.5.5 0 0 1 2.5 2h11a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 2 14v-11Zm1 1v10h10v-10H3Z"/></svg>';
    const multiIcon = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M8 1.5l-5.5 3 5.5 3 5.5-3-5.5-3ZM1.5 9.5l5.5 3 5.5-3M1.5 7l5.5 3 5.5-3" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" fill="none"/></svg>';

    // ─── Global styles (injected into document head for page-level classes) ──
    const globalStyle = injectGlobalStyles();

    // ─── Panel styles (scoped to toolbar canvas) ────────────────────────────
    injectPanelStyles(canvas);

    document.getElementById('ai-note-comment-actions')?.remove();
    document.getElementById('ai-note-review-popover')?.remove();
    document.getElementById('ai-note-review-bar')?.remove();

    const commentActions = document.createElement('div');
    commentActions.id = 'ai-note-comment-actions';
    commentActions.className = 'ai-note-comment-actions';
    commentActions.setAttribute('aria-hidden', 'true');
    commentActions.innerHTML = `
      <button class="ai-note-comment-action" type="button" data-action="edit-comment" aria-label="Edit comment" title="Edit comment">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path fill="currentColor" d="M11.2 1.7a1.8 1.8 0 0 1 2.6 2.6l-8.7 8.7-3.1.8.8-3.1 8.4-9Zm-.8 2.1-6.6 6.6-.3 1.1 1.1-.3 6.6-6.6-.8-.8Zm1.6-1.2-.8.8.8.8.8-.8a.55.55 0 0 0-.8-.8Z"/>
        </svg>
      </button>
      <button class="ai-note-comment-action" type="button" data-action="delete-comment" aria-label="Delete marking" title="Delete marking">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path fill="currentColor" d="M6.25 1.75h3.5l.5 1H13v1.25H3V2.75h2.75l.5-1Zm-1.75 3h7l-.45 8.05a1.55 1.55 0 0 1-1.55 1.45h-3a1.55 1.55 0 0 1-1.55-1.45L4.5 4.75Zm1.3 1.25.37 6.72c.02.16.16.28.33.28h3c.17 0 .31-.12.33-.28L10.2 6H5.8Z"/>
        </svg>
      </button>
    `;
    document.body.append(commentActions);

    const reviewPopover = document.createElement('div');
    reviewPopover.id = 'ai-note-review-popover';
    reviewPopover.className = 'ai-note-review-popover';
    reviewPopover.setAttribute('aria-hidden', 'true');
    document.body.append(reviewPopover);

    const reviewBar = document.createElement('div');
    reviewBar.id = 'ai-note-review-bar';
    reviewBar.className = 'ai-note-review-bar';
    reviewBar.setAttribute('aria-hidden', 'true');
    document.body.append(reviewBar);

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
      const hasDraft = Boolean(readInstructionDraft());
      const contextCount = state.commentedContexts.length;

      panel.innerHTML = `
        <div class="ai-note-placeholder">
          <p>${hint}</p>
          <div class="ai-note-placeholder-actions">
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn ${state.selectEnabled ? 'active' : ''}" type="button" aria-pressed="${state.selectEnabled}" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
              ${state.selectEnabled ? `
                <button class="ai-note-toggle-btn ${state.isMultiSelect ? 'active' : ''}" type="button" aria-pressed="${state.isMultiSelect}" data-action="toggle-multi">
                  ${multiIcon}
                  Multi
                </button>
              ` : ''}
            </div>
          </div>
        </div>
        ${hasDraft ? `
          <div class="ai-note-note-section">
            <label class="ai-note-label" for="ai-note-textarea">Instruction</label>
            <textarea
              id="ai-note-textarea"
              class="ai-note-textarea"
              placeholder="Describe the change you want..."
              rows="2"
            ></textarea>
          </div>
        ` : ''}
        ${contextCount > 0 ? `
          <div class="ai-note-context-summary">
            <p>${contextCount} commented element${contextCount > 1 ? 's' : ''} in context.</p>
            <div class="ai-note-actions">
              <button class="ai-note-secondary-btn" type="button" data-action="copy-complete">Copy complete context (${contextCount})</button>
              <button class="ai-note-danger-btn" type="button" data-action="clear-context">Clear all</button>
            </div>
          </div>
        ` : ''}
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

      const textarea = panel.querySelector('#ai-note-textarea') as HTMLTextAreaElement | null;
      if (textarea) bindInstructionDraft(textarea);
      bindCompleteContextActions();

      panel.dataset.visible = 'true';
    }

    function getCommentId(entry: SelectedEntry): string {
      return getStoredCommentId(entry, getElementFingerprint(entry.element));
    }

    function toCommentedContextEntry(entry: SelectedEntry, instruction: string): CommentedContextEntry {
      const rawHtml = cleanHtml(entry.element.outerHTML);
      return {
        id: getCommentId(entry),
        instanceKey: getElementFingerprint(entry.element),
        filePath: entry.info.filePath,
        relativePath: entry.info.relativePath,
        location: entry.info.location,
        tagName: entry.element.tagName.toLowerCase(),
        classes: cleanClasses(typeof entry.element.className === 'string' ? entry.element.className : ''),
        htmlSnippet: rawHtml.length > 120 ? rawHtml.slice(0, 117) + '...' : rawHtml,
        context: entry.context,
        instruction,
        isInherited: entry.isInherited,
      };
    }

    function getCommentForEntry(entry: SelectedEntry): CommentedContextEntry | undefined {
      return findCommentForEntry(
        state.commentedContexts,
        entry,
        getElementFingerprint(entry.element),
      );
    }

    function upsertCommentContext(entry: SelectedEntry, instruction: string) {
      const id = getCommentId(entry);
      const trimmedInstruction = instruction.trim();
      const existingComment = getCommentForEntry(entry);
      const existingIndex = existingComment
        ? state.commentedContexts.findIndex((context) => context.id === existingComment.id)
        : -1;

      if (trimmedInstruction) {
        const nextContext = toCommentedContextEntry(entry, trimmedInstruction);
        if (existingIndex >= 0) {
          state.commentedContexts[existingIndex] = nextContext;
        } else {
          state.commentedContexts = state.commentedContexts.filter(
            (context) => context.instanceKey || !isSameCommentSource(context, entry),
          );
          state.commentedContexts.push(nextContext);
        }
        commentedElementsById.set(id, entry.element);
        entry.element.classList.add('ai-note-commented');
      } else {
        state.commentedContexts = state.commentedContexts.filter(
          (context) => context.id !== id && (context.instanceKey || !isSameCommentSource(context, entry)),
        );
        commentedElementsById.delete(id);
        entry.element.classList.remove('ai-note-commented');
      }

      writeCommentContexts(state.commentedContexts);
      markCommentedElements();
      if (trimmedInstruction) entry.element.classList.add('ai-note-commented');
      updateContextControls();
      renderReviewBar();
    }

    function removeCommentContext(entry: SelectedEntry) {
      const id = getCommentId(entry);
      const existingComment = getCommentForEntry(entry);
      state.commentedContexts = state.commentedContexts.filter(
        (context) =>
          context.id !== id
          && context.id !== existingComment?.id
          && (context.instanceKey || !isSameCommentSource(context, entry)),
      );
      commentedElementsById.delete(id);
      if (existingComment) commentedElementsById.delete(existingComment.id);
      entry.element.classList.remove('ai-note-commented');

      writeCommentContexts(state.commentedContexts);
      markCommentedElements();
      updateContextControls();
      renderReviewBar();
    }

    function clearCommentContexts() {
      state.commentedContexts = [];
      writeCommentContexts(state.commentedContexts);
      markCommentedElements();
      updateContextControls();
      renderReviewBar();
    }

    function findElementsForComment(context: CommentedContextEntry): HTMLElement[] {
      const matches: HTMLElement[] = [];
      const sourceCache = window.__ai_note_source_cache__;
      const hasMatch = (element: HTMLElement) => matches.includes(element);
      const canMatchElement = (element: HTMLElement) => {
        return element.isConnected
          && !isDevToolbarElement(element)
          && element.tagName.toLowerCase() === context.tagName;
      };
      const addMatch = (element: HTMLElement) => {
        if (canMatchElement(element) && !hasMatch(element)) matches.push(element);
      };

      const liveElement = commentedElementsById.get(context.id);
      if (liveElement) addMatch(liveElement);

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

      if (sourceCache) {
        for (const [element, source] of sourceCache.entries()) {
          if (
            canMatchElement(element)
            && source.file === context.filePath
            && source.loc === context.location
          ) {
            addMatch(element);
          }
        }
      }

      document
        .querySelectorAll('[data-astro-source-file], [data-astro-source-loc]')
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

    function resolveCommentSource(element: HTMLElement) {
      let current: HTMLElement | null = element;
      let file = '';
      let loc = '';
      let distance = 0;

      while (current) {
        if (isDevToolbarElement(current)) break;

        const source = readSourceAnnotation(current);
        const tagName = current.tagName.toLowerCase();
        const isDocumentShell = distance > 0 && ['body', 'html'].includes(tagName);

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

    function getPageElements(): HTMLElement[] {
      const elements: HTMLElement[] = [];
      if (document.documentElement instanceof HTMLElement) elements.push(document.documentElement);
      if (document.body instanceof HTMLElement && document.body !== document.documentElement) {
        elements.push(document.body);
        document.body.querySelectorAll('*').forEach((element) => {
          if (element instanceof HTMLElement) elements.push(element);
        });
      }
      return elements;
    }

    function markCommentedElements() {
      clearCommentedElementMarks();
      addCommentedElementMarks();
    }

    function addCommentedElementMarks() {
      for (const context of state.commentedContexts) {
        const [element] = findElementsForComment(context);
        element?.classList.add('ai-note-commented');
      }
    }

    function clearCommentedElementMarks() {
      document
        .querySelectorAll('.ai-note-commented, .ai-note-commented-hover')
        .forEach((element) => {
          element.classList.remove('ai-note-commented');
          element.classList.remove('ai-note-commented-hover');
        });
    }

    function showCommentedElementMarks(options: { reset?: boolean } = {}) {
      window.__ai_note_show_comment_marks__ = true;
      if (options.reset === false) {
        addCommentedElementMarks();
      } else {
        markCommentedElements();
      }
    }

    function hideCommentedElementMarks() {
      window.__ai_note_show_comment_marks__ = false;
      clearCommentedElementMarks();
    }

    function refreshPageContext() {
      state.commentedContexts = readCommentContexts();
      commentedElementsById.clear();
      hideReviewPopover();
      hideCommentActions();
      clearSelection();
      clearCommentedElementMarks();

      if (isAppActive || readReviewState() !== 'closed') {
        window.__ai_note_show_comment_marks__ = true;
        showCommentedElementMarks();
      }

      renderReviewBar();
    }

    function showCommentActions(element: HTMLElement) {
      if (commentActionTarget && commentActionTarget !== element) {
        commentActionTarget.classList.remove('ai-note-commented-hover');
      }

      commentActionTarget = element;
      element.classList.add('ai-note-commented-hover');
      commentActions.dataset.visible = 'true';
      commentActions.setAttribute('aria-hidden', 'false');
      updateCommentActionsPosition();
    }

    function hideCommentActions() {
      commentActionTarget?.classList.remove('ai-note-commented-hover');
      commentActionTarget = null;
      commentActions.dataset.visible = 'false';
      commentActions.setAttribute('aria-hidden', 'true');
    }

    function updateCommentActionsPosition() {
      if (!commentActionTarget) return;

      const rect = commentActionTarget.getBoundingClientRect();
      const actionsWidth = commentActions.offsetWidth || 60;
      const actionsHeight = commentActions.offsetHeight || 32;
      const left = Math.min(
        window.innerWidth - actionsWidth - 8,
        Math.max(8, rect.right - actionsWidth + 6),
      );
      const top = Math.min(
        window.innerHeight - actionsHeight - 8,
        Math.max(8, rect.top - 14),
      );

      commentActions.style.left = `${left}px`;
      commentActions.style.top = `${top}px`;
    }

    function updateFloatingReviewUi() {
      updateCommentActionsPosition();
      positionReviewBar();
      positionReviewPopover();
    }

    function deleteCommentForElement(element: HTMLElement): boolean {
      const { element: resolved, info } = resolveSourceElement(element);
      if (!info) return false;

      const entry = {
        element,
        info,
        isInherited: resolved !== element,
        context: getElementContextInfo(element),
      };
      const removedId = getCommentId(entry);

      removeCommentContext(entry);
      hideCommentActions();

      const selectedEntry = state.selectedElements[0];
      if (selectedEntry && getCommentId(selectedEntry) === removedId) {
        clearSelection();
        renderPlaceholder();
      }

      return true;
    }

    function getEntryForElement(element: HTMLElement): SelectedEntry | null {
      const { element: resolved, info } = resolveSourceElement(element);
      if (!info) return null;

      return {
        element,
        info,
        isInherited: resolved !== element,
        context: getElementContextInfo(element),
      };
    }

    function positionReviewPopover() {
      if (!activeReviewEntry || reviewPopover.dataset.visible !== 'true') return;

      const popoverWidth = reviewPopover.offsetWidth || 360;
      const popoverHeight = reviewPopover.offsetHeight || 210;
      const gap = 12;
      const padding = 12;
      const barRect = reviewBar.dataset.visible === 'true'
        ? reviewBar.getBoundingClientRect()
        : null;
      const bottomLimit = barRect
        ? Math.max(padding, barRect.top - gap)
        : window.innerHeight - padding;
      const availableHeight = Math.max(120, bottomLimit - padding);
      const effectivePopoverHeight = Math.min(popoverHeight, availableHeight);
      const anchorRect = activeReviewEntry.element.getBoundingClientRect();

      if (reviewPopoverManualPosition) {
        const clamped = clampReviewPopoverPosition(
          reviewPopoverManualPosition.left,
          reviewPopoverManualPosition.top,
        );
        reviewPopoverManualPosition = clamped;
        reviewPopover.style.left = `${clamped.left}px`;
        reviewPopover.style.top = `${clamped.top}px`;
        reviewPopover.style.maxHeight = `${availableHeight}px`;
        return;
      }

      let left = anchorRect.right + gap;
      if (left + popoverWidth > window.innerWidth - padding) {
        left = anchorRect.left - popoverWidth - gap;
      }
      if (left < padding) {
        left = Math.min(window.innerWidth - popoverWidth - padding, Math.max(padding, anchorRect.left));
      }

      let top = anchorRect.top;
      if (top + effectivePopoverHeight > bottomLimit) {
        top = anchorRect.bottom + gap;
      }
      if (top + effectivePopoverHeight > bottomLimit) {
        top = anchorRect.top - effectivePopoverHeight - gap;
      }
      if (top < padding) {
        top = Math.max(padding, Math.min(anchorRect.top, bottomLimit - effectivePopoverHeight));
      }

      reviewPopover.style.left = `${left}px`;
      reviewPopover.style.top = `${top}px`;
      reviewPopover.style.maxHeight = `${availableHeight}px`;
    }

    function getReviewPopoverBounds() {
      const gap = 12;
      const padding = 12;
      const popoverWidth = reviewPopover.offsetWidth || 360;
      const popoverHeight = reviewPopover.offsetHeight || 210;
      const barRect = reviewBar.dataset.visible === 'true'
        ? reviewBar.getBoundingClientRect()
        : null;
      const bottomLimit = barRect
        ? Math.max(padding, barRect.top - gap)
        : window.innerHeight - padding;
      const availableHeight = Math.max(120, bottomLimit - padding);

      return {
        maxLeft: Math.max(padding, window.innerWidth - popoverWidth - padding),
        maxTop: Math.max(padding, bottomLimit - Math.min(popoverHeight, availableHeight)),
        padding,
        availableHeight,
      };
    }

    function clampReviewPopoverPosition(left: number, top: number) {
      const bounds = getReviewPopoverBounds();
      return {
        left: Math.min(bounds.maxLeft, Math.max(bounds.padding, left)),
        top: Math.min(bounds.maxTop, Math.max(bounds.padding, top)),
      };
    }

    function onReviewPopoverDragMove(event: PointerEvent) {
      if (!reviewPopoverDragOffset) return;

      event.preventDefault();
      const nextPosition = clampReviewPopoverPosition(
        event.clientX - reviewPopoverDragOffset.x,
        event.clientY - reviewPopoverDragOffset.y,
      );
      reviewPopoverManualPosition = nextPosition;
      reviewPopover.style.left = `${nextPosition.left}px`;
      reviewPopover.style.top = `${nextPosition.top}px`;
      reviewPopover.style.maxHeight = `${getReviewPopoverBounds().availableHeight}px`;
    }

    function endReviewPopoverDrag() {
      reviewPopoverDragOffset = null;
      document.removeEventListener('pointermove', onReviewPopoverDragMove);
      document.removeEventListener('pointerup', endReviewPopoverDrag);
      document.removeEventListener('pointercancel', endReviewPopoverDrag);
    }

    function getReviewBarBounds() {
      const padding = 12;
      const barWidth = reviewBar.offsetWidth || 240;
      const barHeight = reviewBar.offsetHeight || 52;

      return {
        maxLeft: Math.max(padding, window.innerWidth - barWidth - padding),
        maxTop: Math.max(padding, window.innerHeight - barHeight - padding),
        padding,
      };
    }

    function clampReviewBarPosition(left: number, top: number) {
      const bounds = getReviewBarBounds();
      return {
        left: Math.min(bounds.maxLeft, Math.max(bounds.padding, left)),
        top: Math.min(bounds.maxTop, Math.max(bounds.padding, top)),
      };
    }

    function positionReviewBar() {
      if (reviewBar.dataset.visible !== 'true') return;

      if (!reviewBarManualPosition) {
        reviewBar.style.left = '';
        reviewBar.style.top = '';
        reviewBar.style.right = '14px';
        reviewBar.style.bottom = 'max(14px, env(safe-area-inset-bottom))';
        return;
      }

      const clamped = clampReviewBarPosition(
        reviewBarManualPosition.left,
        reviewBarManualPosition.top,
      );
      reviewBarManualPosition = clamped;
      reviewBar.style.left = `${clamped.left}px`;
      reviewBar.style.top = `${clamped.top}px`;
      reviewBar.style.right = 'auto';
      reviewBar.style.bottom = 'auto';
    }

    function onReviewBarDragMove(event: PointerEvent) {
      if (!reviewBarDragOffset) return;

      event.preventDefault();
      reviewBarManualPosition = clampReviewBarPosition(
        event.clientX - reviewBarDragOffset.x,
        event.clientY - reviewBarDragOffset.y,
      );
      positionReviewBar();
      positionReviewPopover();
    }

    function endReviewBarDrag() {
      reviewBarDragOffset = null;
      document.removeEventListener('pointermove', onReviewBarDragMove);
      document.removeEventListener('pointerup', endReviewBarDrag);
      document.removeEventListener('pointercancel', endReviewBarDrag);
    }

    function hideReviewPopover() {
      activeReviewEntry = null;
      endReviewPopoverDrag();
      reviewPopover.dataset.visible = 'false';
      reviewPopover.setAttribute('aria-hidden', 'true');
      reviewPopover.innerHTML = '';
      clearSelection();
    }

    function renderReviewPopover(entry: SelectedEntry) {
      activeReviewEntry = entry;
      const existingComment = getCommentForEntry(entry);
      const title = `${entry.info.relativePath}:${entry.info.location}`;

      clearSelection();
      entry.element.classList.add('ai-note-selected');
      if (existingComment) entry.element.classList.add('ai-note-commented');
      state.selectedElements = [entry];

      reviewPopover.innerHTML = `
        <div class="ai-note-review-drag-handle" role="separator" aria-label="Move comment panel" title="Drag panel"></div>
        <div class="ai-note-review-popover-header">
          <p class="ai-note-review-popover-title">${escapeHtml(title)}</p>
          <button class="ai-note-review-popover-close" type="button" aria-label="Close review note">&times;</button>
        </div>
        <textarea class="ai-note-review-textarea" placeholder="Describe the change..." rows="4">${escapeHtml(existingComment?.instruction ?? '')}</textarea>
        <div class="ai-note-review-popover-actions">
          <button class="ai-note-review-btn" type="button" data-action="delete-review" data-danger="true">Delete</button>
          <button class="ai-note-review-btn" type="button" data-action="save-copy-review">Save & Copy</button>
          <button class="ai-note-review-btn" type="button" data-action="save-review" data-primary="true">Save</button>
        </div>
      `;

      reviewPopover.dataset.visible = 'true';
      reviewPopover.setAttribute('aria-hidden', 'false');
      positionReviewPopover();

      const textarea = reviewPopover.querySelector('.ai-note-review-textarea') as HTMLTextAreaElement;
      const saveBtn = reviewPopover.querySelector('[data-action="save-review"]') as HTMLButtonElement;
      const saveCopyBtn = reviewPopover.querySelector('[data-action="save-copy-review"]') as HTMLButtonElement;
      const deleteBtn = reviewPopover.querySelector('[data-action="delete-review"]') as HTMLButtonElement;
      const closeBtn = reviewPopover.querySelector('.ai-note-review-popover-close') as HTMLButtonElement;
      const dragHandle = reviewPopover.querySelector('.ai-note-review-drag-handle') as HTMLElement;

      const save = () => {
        upsertCommentContext(entry, textarea.value);
        hideReviewPopover();
        renderReviewBar();
      };

      textarea.addEventListener('input', () => {
        upsertCommentContext(entry, textarea.value);
      });

      saveBtn.addEventListener('click', save);
      saveCopyBtn.addEventListener('click', () => {
        upsertCommentContext(entry, textarea.value);
        handleCopy(saveCopyBtn, buildCopyText([entry], textarea.value));
        hideReviewPopover();
        renderReviewBar();
      });
      deleteBtn.addEventListener('click', () => {
        removeCommentContext(entry);
        hideReviewPopover();
        renderReviewBar();
      });
      closeBtn.addEventListener('click', () => {
        hideReviewPopover();
        renderReviewBar();
      });
      dragHandle.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = reviewPopover.getBoundingClientRect();
        reviewPopoverDragOffset = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        document.addEventListener('pointermove', onReviewPopoverDragMove);
        document.addEventListener('pointerup', endReviewPopoverDrag);
        document.addEventListener('pointercancel', endReviewPopoverDrag);
      });

      requestAnimationFrame(() => {
        positionReviewPopover();
        textarea.focus();
      });
    }

    function renderReviewBar() {
      const count = state.commentedContexts.length;
      const hasOpenPopover = reviewPopover.dataset.visible === 'true';

      if (!isAppActive && readReviewState() === 'closed' && !hasOpenPopover) {
        reviewBar.dataset.visible = 'false';
        reviewBar.setAttribute('aria-hidden', 'true');
        reviewBar.innerHTML = '';
        return;
      }

      if (!isAppActive && !isReviewMode && count === 0 && !hasOpenPopover) {
        reviewBar.dataset.visible = 'false';
        reviewBar.setAttribute('aria-hidden', 'true');
        reviewBar.innerHTML = '';
        return;
      }

      reviewBar.innerHTML = `
        <button class="ai-note-review-record-btn" type="button" data-action="${isReviewMode ? 'stop-review' : 'start-review'}" data-state="${isReviewMode ? 'recording' : 'idle'}">
          <span class="ai-note-review-record-dot" aria-hidden="true"></span>
          ${isReviewMode ? 'Stop' : 'Start'}
        </button>
        ${count > 0 ? `
          <button class="ai-note-review-context-btn" type="button" data-action="copy-review-context">Copy context (${count})</button>
          <button class="ai-note-review-clear-btn" type="button" data-action="clear-review-context">Clear context</button>
        ` : ''}
        <button class="ai-note-review-close-btn" type="button" data-action="close-review-bar" aria-label="Close review controls" title="Close">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path fill="currentColor" d="M4.28 3.22 8 6.94l3.72-3.72 1.06 1.06L9.06 8l3.72 3.72-1.06 1.06L8 9.06l-3.72 3.72-1.06-1.06L6.94 8 3.22 4.28l1.06-1.06Z"/>
          </svg>
        </button>
        <div class="ai-note-review-bar-drag" role="separator" aria-label="Move review controls" title="Drag controls"></div>
      `;
      reviewBar.dataset.visible = 'true';
      reviewBar.setAttribute('aria-hidden', 'false');
      positionReviewBar();

      const startBtn = reviewBar.querySelector('[data-action="start-review"]') as HTMLButtonElement | null;
      startBtn?.addEventListener('click', () => {
        startReviewMode();
      });

      const stopBtn = reviewBar.querySelector('[data-action="stop-review"]') as HTMLButtonElement | null;
      stopBtn?.addEventListener('click', () => {
        stopReviewMode();
      });

      const copyContextBtn = reviewBar.querySelector('[data-action="copy-review-context"]') as HTMLButtonElement | null;
      if (copyContextBtn) {
        copyContextBtn.addEventListener('click', () => {
          handleCopy(copyContextBtn, buildCompleteContextText(state.commentedContexts));
        });
      }

      const clearContextBtn = reviewBar.querySelector('[data-action="clear-review-context"]') as HTMLButtonElement | null;
      if (clearContextBtn) {
        clearContextBtn.addEventListener('click', () => {
          clearCommentContexts();
          hideReviewPopover();
          renderReviewBar();
        });
      }

      const closeBarBtn = reviewBar.querySelector('[data-action="close-review-bar"]') as HTMLButtonElement;
      closeBarBtn.addEventListener('click', () => {
        writeReviewState('closed');
        isAppActive = false;
        endReviewBarDrag();
        isReviewMode = false;
        stopInspecting();
        hideReviewPopover();
        hideCommentActions();
        reviewBar.dataset.visible = 'false';
        reviewBar.setAttribute('aria-hidden', 'true');
        reviewBar.innerHTML = '';
        hideCommentedElementMarks();
      });

      const dragBarHandle = reviewBar.querySelector('.ai-note-review-bar-drag') as HTMLElement;
      dragBarHandle.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const rect = reviewBar.getBoundingClientRect();
        reviewBarDragOffset = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };
        reviewBarManualPosition = {
          left: rect.left,
          top: rect.top,
        };
        reviewBar.style.left = `${rect.left}px`;
        reviewBar.style.top = `${rect.top}px`;
        reviewBar.style.right = 'auto';
        reviewBar.style.bottom = 'auto';
        document.addEventListener('pointermove', onReviewBarDragMove);
        document.addEventListener('pointerup', endReviewBarDrag);
        document.addEventListener('pointercancel', endReviewBarDrag);
      });
    }

    function foldToolbarPanel() {
      if (!isAppActive) return;
      isFoldingToolbar = true;
      eventTarget.dispatchEvent(new CustomEvent('toggle-app', { detail: { state: false } }));
    }

    function startReviewMode() {
      writeReviewState('recording');
      isReviewMode = true;
      state.selectEnabled = true;
      state.isMultiSelect = false;
      ensureSourceCache();
      showCommentedElementMarks();
      state.isInspecting = true;
      document.body.classList.add('ai-note-inspecting');
      renderReviewBar();
    }

    function stopReviewMode() {
      persistOpenReviewComment();
      writeReviewState('paused');
      isReviewMode = false;
      stopInspecting();
      hideCommentActions();
      window.__ai_note_show_comment_marks__ = true;
      renderReviewBar();
    }

    function persistOpenReviewComment() {
      if (!activeReviewEntry || reviewPopover.dataset.visible !== 'true') return;

      const textarea = reviewPopover.querySelector('.ai-note-review-textarea') as HTMLTextAreaElement | null;
      if (!textarea) return;

      const hasExistingComment = Boolean(getCommentForEntry(activeReviewEntry));
      if (textarea.value.trim() || hasExistingComment) {
        upsertCommentContext(activeReviewEntry, textarea.value);
      }
    }

    function bindElementComment(entry: SelectedEntry, textarea: HTMLTextAreaElement) {
      const existingComment = getCommentForEntry(entry);
      textarea.value = existingComment?.instruction ?? '';
      const removeCommentBtn = panel.querySelector('[data-action="remove-comment"]') as HTMLButtonElement | null;
      if (removeCommentBtn) removeCommentBtn.disabled = !textarea.value.trim();

      textarea.addEventListener('input', () => {
        upsertCommentContext(entry, textarea.value);
        if (removeCommentBtn) removeCommentBtn.disabled = !textarea.value.trim();
      });
    }

    function openCommentEditorForElement(element: HTMLElement): boolean {
      const entry = getEntryForElement(element);
      if (!entry) return false;

      renderReviewPopover(entry);
      renderReviewBar();
      return true;
    }

    function getCommentedClickTarget(target: HTMLElement): HTMLElement | null {
      const commented = target.closest('.ai-note-commented');
      return commented instanceof HTMLElement && !isDevToolbarElement(commented)
        ? commented
        : null;
    }

    function updateContextControls() {
      const count = state.commentedContexts.length;

      panel.querySelectorAll('[data-action="copy-complete"]').forEach((button) => {
        const btn = button as HTMLButtonElement;
        btn.disabled = count === 0;
        btn.textContent = count > 0 ? `Copy complete context (${count})` : 'Copy complete context';
      });

      panel.querySelectorAll('[data-action="clear-context"]').forEach((button) => {
        (button as HTMLButtonElement).disabled = count === 0;
      });
    }

    function bindCompleteContextActions(root: ParentNode = panel) {
      root.querySelectorAll('[data-action="copy-complete"]').forEach((button) => {
        const btn = button as HTMLButtonElement;
        btn.addEventListener('click', () => {
          if (state.commentedContexts.length === 0) return;
          handleCopy(btn, buildCompleteContextText(state.commentedContexts));
        });
      });

      root.querySelectorAll('[data-action="clear-context"]').forEach((button) => {
        const btn = button as HTMLButtonElement;
        btn.addEventListener('click', () => {
          clearCommentContexts();
          renderPlaceholder();
        });
      });

      updateContextControls();
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
      const currentComment = getCommentForEntry(entry);

      const inheritedHint = isInherited
        ? `<div class="ai-note-inherited-hint">
             <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path fill="currentColor" d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM8.75 4.25a.75.75 0 0 0-1.5 0V8a.75.75 0 0 0 .375.65l2.5 1.5a.75.75 0 0 0 .75-1.3L8.75 7.55V4.25Z"/></svg>
             Source resolved to parent element
           </div>`
        : '';

      panel.innerHTML = `
        <div class="ai-note-header">
          <h2>Inspect & Clip</h2>
          <div class="ai-note-header-actions">
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn ${state.selectEnabled ? 'active' : ''}" type="button" aria-pressed="${state.selectEnabled}" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
              <button class="ai-note-toggle-btn" type="button" aria-pressed="false" data-action="toggle-multi">
                ${multiIcon}
                Multi
              </button>
            </div>
            <button class="ai-note-reinspect-btn" type="button" title="Select another element">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none"><path fill="currentColor" d="M7.9 1.5v-.4a1.1 1.1 0 0 1 2.2 0v.4a1.1 1.1 0 1 1-2.2 0Zm-6.4 8.6a1.1 1.1 0 1 0 0-2.2h-.4a1.1 1.1 0 0 0 0 2.2h.4ZM12 3.7a1.1 1.1 0 0 0 1.4-.7l.4-1.1a1.1 1.1 0 0 0-2.1-.8l-.4 1.2a1.1 1.1 0 0 0 .7 1.4Zm-9.7 7.6-1.2.4a1.1 1.1 0 1 0 .8 2.1l1-.4a1.1 1.1 0 1 0-.6-2ZM20.8 17a1.9 1.9 0 0 1 0 2.6l-1.2 1.2a1.9 1.9 0 0 1-2.6 0l-4.3-4.2-1.6 3.6a1.9 1.9 0 0 1-1.7 1.2A1.9 1.9 0 0 1 7.5 20L2.7 5a1.9 1.9 0 0 1 2.4-2.4l15 5a1.9 1.9 0 0 1 .2 3.4l-3.7 1.6 4.2 4.3ZM19 18.3 14.6 14a1.9 1.9 0 0 1 .6-3l3.2-1.5L5.1 5.1l4.3 13.3 1.5-3.2a1.9 1.9 0 0 1 3-.6l4.4 4.4.7-.7Z"/></svg>
              Re-select
            </button>
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
            <button class="ai-note-copy-btn" type="button" data-action="copy">
              <svg width="14" height="14" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9.125.8125h-6c-.14918 0-.29226.059263-.39775.164752-.10549.105488-.16475.248568-.16475.397748v1.6875H.875c-.149184 0-.292258.05926-.397748.16475C.371763 3.33274.3125 3.47582.3125 3.625v6c0 .14918.059263.29226.164752.3977.10549.1055.248564.1648.397748.1648h6c.14918 0 .29226-.0593.39775-.1648.10549-.10544.16475-.24852.16475-.3977V7.9375H9.125c.14918 0 .29226-.05926.39775-.16475.10549-.10549.16475-.24857.16475-.39775v-6c0-.14918-.05926-.29226-.16475-.397748C9.41726.871763 9.27418.8125 9.125.8125Zm-2.8125 8.25h-4.875v-4.875h4.875v4.875Zm2.25-2.25h-1.125V3.625c0-.14918-.05926-.29226-.16475-.39775-.10549-.10549-.24857-.16475-.39775-.16475H3.6875v-1.125h4.875v4.875Z"/></svg>
              Copy
            </button>
            <button class="ai-note-secondary-btn" type="button" data-action="copy-complete">Copy complete context</button>
            <button class="ai-note-danger-btn" type="button" data-action="remove-comment" ${currentComment ? '' : 'disabled'}>Delete marking</button>
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
      bindElementComment(entry, textarea);

      copyBtn.addEventListener('click', () => {
        const text = buildCopyText(state.selectedElements, textarea.value);
        handleCopy(copyBtn, text);
      });

      const removeCommentBtn = panel.querySelector('[data-action="remove-comment"]') as HTMLButtonElement | null;
      if (removeCommentBtn) {
        removeCommentBtn.addEventListener('click', () => {
          textarea.value = '';
          removeCommentContext(entry);
          removeCommentBtn.disabled = true;
        });
      }

      bindCompleteContextActions();

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
          <div class="ai-note-header-actions">
            ${count > 0 ? `<span class="ai-note-counter">${count}</span>` : ''}
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn active" type="button" aria-pressed="true" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
              <button class="ai-note-toggle-btn active" type="button" aria-pressed="true" data-action="toggle-multi">
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
                <button class="remove-btn" type="button" data-remove="${i}" aria-label="Remove selected element">&times;</button>
              </div>
            `).join('')}
          </div>
          <div class="ai-note-actions">
            <button class="ai-note-done-btn" type="button" data-action="done">
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
          <div class="ai-note-header-actions">
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn" type="button" aria-pressed="false" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
            </div>
            <button class="ai-note-reinspect-btn" type="button" title="Select elements again">
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
            <button class="ai-note-copy-btn" type="button" data-action="copy">
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
      bindInstructionDraft(textarea);

      copyBtn.addEventListener('click', () => {
        const text = buildCopyText(state.selectedElements, textarea.value);
        handleCopy(copyBtn, text);
      });

      panel.dataset.visible = 'true';
    }

    // ─── Inspector logic ──────────────────────────────────────

    function startInspecting() {
      if (!state.selectEnabled) return;
      ensureSourceCache();
      markCommentedElements();

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
      document
        .querySelectorAll('.ai-note-selected')
        .forEach((element) => element.classList.remove('ai-note-selected'));
      state.selectedElements = [];
    }

    /**
     * Resolve an element to the nearest source location, while allowing the
     * file path to be inherited from an ancestor. Astro and the Audit toolbar
     * can leave those two pieces on different elements depending on timing.
     * Shadow DOM hosts are treated as traversal parents, so custom elements can
     * still resolve to the Astro component that rendered the host.
     */
    function resolveSourceElement(element: HTMLElement) {
      let resolved: HTMLElement | null = null;
      let filePath = '';
      let location = '';
      let current: HTMLElement | null = element;
      let nearest: SourceCandidate | null = null;
      let distance = 0;

      while (current) {
        if (isDevToolbarElement(current)) break;

        const source = readSourceAnnotation(current);
        if ((source.file || source.loc) && !nearest) {
          nearest = {
            element: current,
            file: source.file,
            loc: source.loc,
            distance,
          };
        }

        const isDocumentShell = distance > 0 && ['body', 'html'].includes(current.tagName.toLowerCase());

        if (!location) {
          if (source.loc && !isDocumentShell) {
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

        current = getTraversalParent(current);
        distance++;
      }

      if (!resolved || !filePath || !location) {
        return { element, info: null, diagnostic: getNoSourceDiagnostic(element, nearest) };
      }

      return { element: resolved, info: getElementInfo(resolved, filePath, location), diagnostic: null };
    }

    function getNoSourceDiagnostic(element: HTMLElement, nearest: SourceCandidate | null): NoSourceDiagnostic {
      const root = element.getRootNode();
      const tagName = element.tagName.toLowerCase();

      let title = 'Runtime DOM element';
      let message = 'This element was likely created or rewritten by client-side JavaScript, so Astro did not attach source metadata to it.';

      if (window.__ai_note_source_cache_late__ && !nearest) {
        title = 'No cached Astro source metadata';
        message = 'Inspect & Clip could not find source metadata for this element. If this should be Astro-rendered markup, reload the page once so the page-level cache can capture metadata earlier.';
      } else if (root instanceof ShadowRoot) {
        title = 'Shadow DOM boundary';
        message = 'The selected element is inside a shadow root. The inspector tried the shadow host, but no complete Astro source metadata was found.';
      } else if (tagName === 'iframe') {
        title = 'Iframe boundary';
        message = 'The selected element is an iframe. Inspecting content inside frames requires selecting an element in that frame context.';
      } else if (nearest && (!nearest.file || !nearest.loc)) {
        title = 'Partial Astro metadata';
        message = 'Astro exposed only part of the source metadata nearby. A file and a line/column are both required to open or diff a source location.';
      }

      return {
        title,
        message,
        domPath: buildDomPath(element),
        nearest,
      };
    }

    function selectElement(element: HTMLElement) {
      clearHover();

      const { element: resolved, info, diagnostic } = resolveSourceElement(element);

      if (!info) {
        renderNoSourceInfo(element, diagnostic);
        return;
      }

      const isInherited = resolved !== element;
      const entry = {
        element,
        info,
        isInherited,
        context: getElementContextInfo(element),
      };

      if (isReviewMode) {
        clearSelection();
        element.classList.add('ai-note-selected');
        state.selectedElements = [entry];
        renderReviewPopover(entry);
        foldToolbarPanel();
        return;
      }

      if (state.isMultiSelect) {
        if (state.selectedElements.some((selected) => selected.element === element)) {
          renderMultiSelectInspecting();
          return;
        }

        // Multi-select: add to array, keep inspecting
        element.classList.add('ai-note-selected');
        state.selectedElements.push(entry);
        renderMultiSelectInspecting();
      } else {
        // Single-select: replace the active element, but keep inspecting so
        // another page click can collect the next comment immediately.
        clearSelection();
        element.classList.add('ai-note-selected');
        state.selectedElements = [entry];
        renderElementInfo(entry);
      }
    }

    function renderNoSourceInfo(element: HTMLElement, diagnostic: NoSourceDiagnostic | null) {
      panel.innerHTML = '';
      panel.dataset.visible = 'false';

      const sourceDiagnostic = diagnostic ?? getNoSourceDiagnostic(element, null);
      const tagName = element.tagName.toLowerCase();
      const classes = cleanClasses(typeof element.className === 'string' ? element.className : '');
      const nearest = sourceDiagnostic.nearest;
      const nearestFile = nearest?.file ? toRelativePath(nearest.file) : '';
      const nearestLoc = nearest?.loc ?? '';

      panel.innerHTML = `
        <div class="ai-note-header">
          <h2>Inspect & Clip</h2>
          <div class="ai-note-header-actions">
            <div class="ai-note-toggles">
              <button class="ai-note-toggle-btn active" type="button" aria-pressed="true" data-action="toggle-select">
                ${selectIcon}
                Select
              </button>
            </div>
            <button class="ai-note-reinspect-btn" type="button" title="Select another element">
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
                ${classes ? `<span class="ai-note-classes">${escapeHtml(classes)}</span>` : ''}
              </div>
            </div>
            <div class="row">
              <div class="label">Reason</div>
              <p class="ai-note-diagnostic-title">${escapeHtml(sourceDiagnostic.title)}</p>
              <p class="ai-note-help">${escapeHtml(sourceDiagnostic.message)}</p>
            </div>
            ${sourceDiagnostic.domPath ? `
              <div class="row">
                <div class="label">DOM path</div>
                <div class="ai-note-element-line">
                  <code>${escapeHtml(sourceDiagnostic.domPath)}</code>
                </div>
              </div>
            ` : ''}
            ${nearest ? `
              <div class="row">
                <div class="label">Nearest metadata</div>
                <div class="ai-note-element-line">
                  <code>${escapeHtml(nearestFile || '(missing file)')}:${escapeHtml(nearestLoc || '(missing loc)')}</code>
                  <span class="ai-note-classes">&lt;${escapeHtml(nearest.element.tagName.toLowerCase())}&gt;</span>
                </div>
              </div>
            ` : ''}
            <p class="ai-note-help">Try selecting a larger Astro-rendered wrapper, or copy this fallback context if the element is generated at runtime.</p>
          </div>
        </div>
        <div class="ai-note-actions">
          <button class="ai-note-copy-btn" type="button" data-action="copy-fallback">
            <svg width="14" height="14" viewBox="0 0 10 11" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill="currentColor" d="M9.125.8125h-6c-.14918 0-.29226.059263-.39775.164752-.10549.105488-.16475.248568-.16475.397748v1.6875H.875c-.149184 0-.292258.05926-.397748.16475C.371763 3.33274.3125 3.47582.3125 3.625v6c0 .14918.059263.29226.164752.3977.10549.1055.248564.1648.397748.1648h6c.14918 0 .29226-.0593.39775-.1648.10549-.10544.16475-.24852.16475-.3977V7.9375H9.125c.14918 0 .29226-.05926.39775-.16475.10549-.10549.16475-.24857.16475-.39775v-6c0-.14918-.05926-.29226-.16475-.397748C9.41726.871763 9.27418.8125 9.125.8125Zm-2.8125 8.25h-4.875v-4.875h4.875v4.875Zm2.25-2.25h-1.125V3.625c0-.14918-.05926-.29226-.16475-.39775-.10549-.10549-.24857-.16475-.39775-.16475H3.6875v-1.125h4.875v4.875Z"/></svg>
            Copy context
          </button>
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

      const copyFallbackBtn = panel.querySelector('[data-action="copy-fallback"]') as HTMLButtonElement;
      copyFallbackBtn.addEventListener('click', () => {
        handleCopy(copyFallbackBtn, buildNoSourceCopyText(element, sourceDiagnostic));
      });

      panel.dataset.visible = 'true';
    }

    // ─── Event handlers ───────────────────────────────────────

    function onMouseMove(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target || isDevToolbarElement(target)) return;
      if (reviewPopover.contains(target) || reviewBar.contains(target)) return;

      if (commentActions.contains(target)) {
        updateCommentActionsPosition();
        return;
      }

      const commentedTarget = getCommentedClickTarget(target);
      if (commentedTarget) {
        showCommentActions(commentedTarget);
      } else {
        hideCommentActions();
      }

      if (!state.isInspecting) return;

      if (target === state.hoverOutlineElement) return;
      clearHover();
      state.hoverOutlineElement = target;
      target.classList.add('ai-note-hover-outline');
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target || isDevToolbarElement(target)) return;
      if (reviewPopover.contains(target) || reviewBar.contains(target)) return;
      if (commentActions.contains(target)) return;

      const commentedTarget = getCommentedClickTarget(target);
      if (commentedTarget && openCommentEditorForElement(commentedTarget)) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        return;
      }

      if (!state.isInspecting) return;

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      selectElement(target);
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (reviewPopover.dataset.visible === 'true') {
          hideReviewPopover();
          renderReviewBar();
        } else if (state.isInspecting && !isReviewMode) {
          stopInspecting();
          renderPlaceholder();
        } else if (state.selectedElements.length > 0) {
          clearSelection();
          renderPlaceholder();
        }
      }
    }

    const editCommentBtn = commentActions.querySelector('[data-action="edit-comment"]') as HTMLButtonElement;
    editCommentBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const target = commentActionTarget;
      hideCommentActions();
      if (target) openCommentEditorForElement(target);
    });

    const deleteCommentBtn = commentActions.querySelector('[data-action="delete-comment"]') as HTMLButtonElement;
    deleteCommentBtn.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      const target = commentActionTarget;
      if (target) deleteCommentForElement(target);
    });

    // ─── Global listener management ───────────────────────────

    function addGlobalListeners() {
      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('click', onClick, true);
      document.addEventListener('keydown', onKeyDown);
      window.addEventListener('scroll', updateFloatingReviewUi, true);
      window.addEventListener('resize', updateFloatingReviewUi);
    }

    function removeGlobalListeners() {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', updateFloatingReviewUi, true);
      window.removeEventListener('resize', updateFloatingReviewUi);
    }

    addGlobalListeners();

    // ─── Toggle via toolbar ───────────────────────────────────

    eventTarget.addEventListener('app-toggled', (event: any) => {
      if (event.detail.state === true) {
        isAppActive = true;
        startReviewMode();
        foldToolbarPanel();
      } else {
        if (isFoldingToolbar && isReviewMode) {
          isFoldingToolbar = false;
          return;
        }
        isFoldingToolbar = false;
        if (isReviewMode) {
          stopReviewMode();
        } else {
          stopInspecting();
          isAppActive = readReviewState() !== 'closed';
          if (isAppActive) {
            showCommentedElementMarks({ reset: false });
            renderReviewBar();
          }
        }
        clearSelection();
        if (!isAppActive) renderPlaceholder();
      }
    });

    // ─── Page navigation cleanup ──────────────────────────────

    document.addEventListener('astro:after-swap', () => {
      // Re-inject global styles after page swap (head is replaced)
      if (!document.getElementById('ai-note-global-styles')) {
        document.head.appendChild(globalStyle);
      }
      removeGlobalListeners();
      stopInspecting();
      addGlobalListeners();
      refreshPageContext();

      if (isReviewMode) startInspecting();
    });

    const initialReviewState = readReviewState();
    if (initialReviewState === 'recording') {
      isAppActive = true;
      startReviewMode();
    } else if (initialReviewState === 'paused') {
      isAppActive = true;
      isReviewMode = false;
      stopInspecting();
      showCommentedElementMarks();
      renderReviewBar();
    } else if (state.commentedContexts.length > 0 && window.__ai_note_show_comment_marks__) {
      requestAnimationFrame(() => {
        ensureSourceCache();
        showCommentedElementMarks();
      });
    }

    // Do NOT start inspecting here — wait for app-toggled event.
    // Listeners are passive (guard with state.isInspecting) until then.
  },
};
