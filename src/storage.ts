import type { CommentedContextEntry } from './types.js';

const INSTRUCTION_DRAFT_PREFIX = 'astro-inspect-clip:instruction-draft:v1';
const COMMENT_CONTEXT_PREFIX = 'astro-inspect-clip:comment-context:v1';
const REVIEW_STATE_PREFIX = 'astro-inspect-clip:review-state:v1';

export type ReviewState = 'closed' | 'paused' | 'recording';

function getScopedStorageKey(prefix: string, scope: string, pathScoped = true): string {
  if (!pathScoped) return `${prefix}:${scope}`;
  return `${prefix}:${scope}:${window.location.pathname}`;
}

function getStorageScopes(): string[] {
  return Array
    .from(new Set([
      window.__astro_dev_toolbar__?.root,
      window.location.origin,
    ]))
    .filter((scope): scope is string => Boolean(scope));
}

function getStorageKeys(prefix: string, options: { pathScoped?: boolean } = {}): string[] {
  const pathScoped = options.pathScoped ?? true;
  return Array.from(new Set([
    ...getStorageScopes().map((scope) => getScopedStorageKey(prefix, scope, pathScoped)),
    ...(pathScoped ? findStoredStorageKeys(prefix, { pathScoped }) : []),
  ]));
}

function findStoredStorageKeys(prefix: string, options: { pathScoped?: boolean } = {}): string[] {
  const keys: string[] = [];
  const storagePrefix = `${prefix}:`;
  const pathnameSuffix = `:${window.location.pathname}`;
  const pathScoped = options.pathScoped ?? true;

  for (let i = 0; i < window.sessionStorage.length; i++) {
    const key = window.sessionStorage.key(i);
    if (
      key?.startsWith(storagePrefix)
      && (pathScoped ? key.endsWith(pathnameSuffix) : !key.endsWith(pathnameSuffix))
    ) {
      keys.push(key);
    }
  }

  return keys;
}

export function readInstructionDraft(): string {
  try {
    for (const key of getStorageKeys(INSTRUCTION_DRAFT_PREFIX)) {
      const value = window.sessionStorage.getItem(key);
      if (value) return value;
    }
  } catch {
    // Ignore unavailable storage.
  }

  return '';
}

export function writeInstructionDraft(value: string): void {
  try {
    for (const key of getStorageKeys(INSTRUCTION_DRAFT_PREFIX)) {
      if (value) {
        window.sessionStorage.setItem(key, value);
      } else {
        window.sessionStorage.removeItem(key);
      }
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
    for (const key of getStorageKeys(COMMENT_CONTEXT_PREFIX)) {
      const raw = window.sessionStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) continue;

      const entries = parsed
        .filter(isCommentedContextEntry)
        .filter((entry) => entry.instruction.trim());
      if (entries.length > 0) return entries;
    }
  } catch {
    // Ignore unavailable or malformed storage.
  }

  return [];
}

export function writeCommentContexts(entries: CommentedContextEntry[]): void {
  try {
    const persistedEntries = entries.filter((entry) => entry.instruction.trim());
    const value = JSON.stringify(persistedEntries);

    for (const key of getStorageKeys(COMMENT_CONTEXT_PREFIX)) {
      if (persistedEntries.length > 0) {
        window.sessionStorage.setItem(key, value);
      } else {
        window.sessionStorage.removeItem(key);
      }
    }
  } catch {}
}

export function readReviewState(): ReviewState {
  try {
    for (const key of getStorageKeys(REVIEW_STATE_PREFIX, { pathScoped: false })) {
      const value = window.sessionStorage.getItem(key);
      if (value === 'paused' || value === 'recording') return value;
    }
  } catch {
    // Ignore unavailable storage.
  }

  return 'closed';
}

export function writeReviewState(value: ReviewState): void {
  try {
    for (const key of getStorageKeys(REVIEW_STATE_PREFIX, { pathScoped: false })) {
      if (value === 'closed') {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, value);
      }
    }
  } catch {}
}

function isCommentedContextEntry(value: unknown): value is CommentedContextEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return typeof entry.id === 'string'
    && (entry.instanceKey === undefined || typeof entry.instanceKey === 'string')
    && typeof entry.filePath === 'string'
    && typeof entry.relativePath === 'string'
    && typeof entry.location === 'string'
    && typeof entry.tagName === 'string'
    && typeof entry.classes === 'string'
    && typeof entry.htmlSnippet === 'string'
    && (entry.context === undefined || isElementContextInfo(entry.context))
    && typeof entry.instruction === 'string'
    && typeof entry.isInherited === 'boolean';
}

function isElementContextInfo(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const context = value as Record<string, unknown>;

  return typeof context.route === 'string'
    && typeof context.pageTitle === 'string'
    && typeof context.text === 'string'
    && Array.isArray(context.dataAttributes)
    && context.dataAttributes.every((item) => typeof item === 'string')
    && typeof context.nearestHeading === 'string'
    && typeof context.nearestLabelledRegion === 'string'
    && typeof context.nearestFormContext === 'string'
    && typeof context.domPath === 'string';
}
