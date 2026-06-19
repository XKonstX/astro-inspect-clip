import type { CommentedContextEntry, SelectedEntry } from './types.js';

export function getCommentId(entry: SelectedEntry, instanceKey: string): string {
  return [
    entry.info.filePath,
    entry.info.location,
    entry.element.tagName.toLowerCase(),
    instanceKey,
  ].join('::');
}

export function findCommentForEntry(
  contexts: CommentedContextEntry[],
  entry: SelectedEntry,
  instanceKey: string,
): CommentedContextEntry | undefined {
  const id = getCommentId(entry, instanceKey);
  const tagName = entry.element.tagName.toLowerCase();

  return contexts.find((context) => context.id === id)
    ?? contexts.find((context) =>
      context.instanceKey
      && context.instanceKey === instanceKey
      && context.filePath === entry.info.filePath
      && context.location === entry.info.location
      && context.tagName === tagName
    )
    ?? contexts.find((context) => isSameCommentSource(context, entry));
}

export function isSameCommentSource(context: CommentedContextEntry, entry: SelectedEntry): boolean {
  return context.filePath === entry.info.filePath
    && context.location === entry.info.location
    && context.tagName === entry.element.tagName.toLowerCase();
}
