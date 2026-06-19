import assert from 'node:assert/strict';
import test from 'node:test';
import { installWindow, makeContext } from './helpers.ts';
import {
  readCommentContexts,
  readReviewState,
  writeCommentContexts,
  writeReviewState,
} from '../src/storage.ts';

test('review state survives root availability changes until explicitly closed', () => {
  const win = installWindow({ root: '/repo' });

  writeReviewState('recording');
  assert.equal(readReviewState(), 'recording');

  win.__astro_dev_toolbar__ = undefined;
  assert.equal(readReviewState(), 'recording');

  writeReviewState('closed');
  assert.equal(readReviewState(), 'closed');
});

test('review state is shared across page paths', () => {
  const win = installWindow({ root: '/repo', pathname: '/first' });

  writeReviewState('paused');
  win.location.pathname = '/second';

  assert.equal(readReviewState(), 'paused');
});

test('comment contexts persist only entries with real instructions', () => {
  installWindow({ root: '/repo' });

  writeCommentContexts([
    makeContext({ id: 'empty', instruction: '' }),
    makeContext({ id: 'commented', instruction: 'Keep this visible.' }),
  ]);

  assert.deepEqual(
    readCommentContexts().map((context) => [context.id, context.instruction]),
    [['commented', 'Keep this visible.']],
  );
});

test('comment contexts are scoped to the current page path', () => {
  const win = installWindow({ root: '/repo', pathname: '/first' });

  writeCommentContexts([
    makeContext({ id: 'first-page-comment', instruction: 'Only on first page.' }),
  ]);

  win.location.pathname = '/second';
  assert.deepEqual(readCommentContexts(), []);

  writeCommentContexts([
    makeContext({ id: 'second-page-comment', instruction: 'Only on second page.' }),
  ]);

  assert.deepEqual(
    readCommentContexts().map((context) => context.id),
    ['second-page-comment'],
  );

  win.location.pathname = '/first';
  assert.deepEqual(
    readCommentContexts().map((context) => context.id),
    ['first-page-comment'],
  );
});
