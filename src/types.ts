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

export interface SelectedEntry {
  element: HTMLElement;
  info: ElementInfo;
  isInherited: boolean;
}

export interface AppState {
  isInspecting: boolean;
  isMultiSelect: boolean;
  selectEnabled: boolean;
  selectedElements: SelectedEntry[];
  hoverOutlineElement: HTMLElement | null;
}
