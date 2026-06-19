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
