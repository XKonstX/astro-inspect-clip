import type { CommentedContextEntry } from './types.js';

const INSTRUCTION_DRAFT_PREFIX = 'astro-inspect-clip:instruction-draft:v1';
const COMMENT_CONTEXT_PREFIX = 'astro-inspect-clip:comment-context:v1';

function getScopedStorageKey(prefix: string): string {
  const root = window.__astro_dev_toolbar__?.root;
  const scope = root ?? window.location.origin;
  return `${prefix}:${scope}:${window.location.pathname}`;
}

function getInstructionDraftKey(): string {
  return getScopedStorageKey(INSTRUCTION_DRAFT_PREFIX);
}

function getCommentContextKey(): string {
  return getScopedStorageKey(COMMENT_CONTEXT_PREFIX);
}

export function readInstructionDraft(): string {
  try {
    return window.sessionStorage.getItem(getInstructionDraftKey()) ?? '';
  } catch {
    return '';
  }
}

export function writeInstructionDraft(value: string): void {
  try {
    const key = getInstructionDraftKey();
    if (value) {
      window.sessionStorage.setItem(key, value);
    } else {
      window.sessionStorage.removeItem(key);
    }
  } catch {}
}

export function bindInstructionDraft(textarea: HTMLTextAreaElement): void {
  textarea.value = readInstructionDraft();
  textarea.addEventListener('input', () => {
    writeInstructionDraft(textarea.value);
  });
}

export function readCommentContexts(): CommentedContextEntry[] {
  try {
    const raw = window.sessionStorage.getItem(getCommentContextKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCommentedContextEntry);
  } catch {
    return [];
  }
}

export function writeCommentContexts(entries: CommentedContextEntry[]): void {
  try {
    const key = getCommentContextKey();
    if (entries.length > 0) {
      window.sessionStorage.setItem(key, JSON.stringify(entries));
    } else {
      window.sessionStorage.removeItem(key);
    }
  } catch {}
}

function isCommentedContextEntry(value: unknown): value is CommentedContextEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === 'string'
    && typeof entry.filePath === 'string'
    && typeof entry.relativePath === 'string'
    && typeof entry.location === 'string'
    && typeof entry.tagName === 'string'
    && typeof entry.classes === 'string'
    && typeof entry.htmlSnippet === 'string'
    && typeof entry.instruction === 'string'
    && typeof entry.isInherited === 'boolean';
}
