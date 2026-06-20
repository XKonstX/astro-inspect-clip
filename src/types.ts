// plugins/astro-inspect-clip/types.ts

export interface ElementInfo {
  /** Absolute file path on disk */
  filePath: string;
  /** Relative path from project root, e.g. "src/components/Header.astro" */
  relativePath: string;
  /** Line and column, e.g. "27:4" */
  location: string;
  /** HTML tag name, e.g. "NAV" */
  tagName: string;
  /** CSS class list */
  classes: string;
  /** Raw outerHTML (truncated for display) */
  htmlSnippet: string;
}

export interface ElementContextInfo {
  /** Current browser path, including search/hash when available. */
  route: string;
  /** Current document title. */
  pageTitle: string;
  /** Visible text of the selected element. */
  text: string;
  /** Relevant non-Astro data attributes on the selected element. */
  dataAttributes: string[];
  /** Nearest preceding document heading. */
  nearestHeading: string;
  /** Closest ancestor with an accessible label. */
  nearestLabelledRegion: string;
  /** Closest form label, legend, or accessible form name. */
  nearestFormContext: string;
  /** Compact path through the current DOM. */
  domPath: string;
}

export interface SourceAnnotation {
  file: string;
  loc: string;
}

export interface SourceCandidate extends SourceAnnotation {
  element: HTMLElement;
  distance: number;
}

export interface NoSourceDiagnostic {
  title: string;
  message: string;
  domPath: string;
  nearest: SourceCandidate | null;
}

export interface SelectedEntry {
  element: HTMLElement;
  info: ElementInfo;
  isInherited: boolean;
  context: ElementContextInfo;
}

export interface CommentedContextEntry {
  id: string;
  instanceKey?: string;
  filePath: string;
  relativePath: string;
  location: string;
  tagName: string;
  classes: string;
  htmlSnippet: string;
  context?: ElementContextInfo;
  instruction: string;
  isInherited: boolean;
}

export interface AppState {
  isInspecting: boolean;
  isMultiSelect: boolean;
  selectEnabled: boolean;
  selectedElements: SelectedEntry[];
  commentedContexts: CommentedContextEntry[];
  hoverOutlineElement: HTMLElement | null;
}

declare global {
  interface Window {
    __ai_note_source_cache__?: Map<HTMLElement, SourceAnnotation>;
    __ai_note_source_cache_late__?: boolean;
    __ai_note_show_comment_marks__?: boolean;
    __astro_dev_toolbar__?: {
      root?: string;
    };
  }
}
