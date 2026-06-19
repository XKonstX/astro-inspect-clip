import assert from 'node:assert/strict';
import test from 'node:test';
import { findCommentForEntry, getCommentId } from '../src/comment-context.ts';
import { makeContext, makeEntry } from './helpers.ts';

test('comment lookup prefers exact id for unchanged elements', () => {
  const entry = makeEntry();
  const instanceKey = 'button.cta:nth-of-type(1)';
  const context = makeContext({ id: getCommentId(entry, instanceKey), instanceKey });

  assert.equal(findCommentForEntry([context], entry, instanceKey), context);
});

test('comment lookup falls back to instance and source after reload', () => {
  const entry = makeEntry();
  const context = makeContext({
    id: 'old-id-from-before-reload',
    instanceKey: 'button.cta:nth-of-type(1)',
  });

  assert.equal(findCommentForEntry([context], entry, 'button.cta:nth-of-type(1)'), context);
});

test('comment lookup falls back to same source when instance key changed', () => {
  const entry = makeEntry();
  const context = makeContext({
    id: 'old-id-from-before-reload',
    instanceKey: 'old-fingerprint',
  });

  assert.equal(findCommentForEntry([context], entry, 'new-fingerprint'), context);
});
