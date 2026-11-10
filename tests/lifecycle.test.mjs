import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pinnedUrl, receiptState, reviewId } from '../web/lifecycle.mjs';

const config = JSON.parse(readFileSync(new URL('../web/config.json', import.meta.url)));
test('derives the same identifier as the live Studio transaction', async () => {
  assert.equal(await reviewId(config.manifest, config.sha256),
    '0d4f43c877037da41a83f86bf352cd3fff8394dda742ada792572d0427c939cb');
});
test('requires immutable GitHub evidence', () => {
  assert.equal(pinnedUrl(config.manifest), true);
  assert.equal(pinnedUrl(config.manifest.replace(config.sourceCommit, 'main')), false);
  assert.equal(pinnedUrl(config.manifest + '?raw=true'), false);
});
test('separates accepted state from finalized execution', () => {
  assert.match(receiptState({statusName:'ACCEPTED'}), /Pending/);
  assert.match(receiptState({statusName:'FINALIZED', txExecutionResultName:'FINISHED_WITH_ERROR'}), /failed/);
  assert.match(receiptState({statusName:'FINALIZED', txExecutionResultName:'FINISHED_WITH_RETURN'}), /succeeded/);
  assert.match(receiptState(undefined), /Waiting/);
});
