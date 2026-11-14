import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { drawRootBudget, drawPostChoices, drawThreadReplyCount, drawResearchWindows, drawResearchMaintenance, validateLottery } from '../tools/engine/lottery.js';

// Frozen from the reviewed upstream main. Runtime never reads another checkout.
const reference = JSON.parse(readFileSync(new URL('./fixtures/engine-port-reference.json', import.meta.url), 'utf8'));
const policy = () => JSON.parse(readFileSync(new URL('../publication.json', import.meta.url), 'utf8'));

test('GSM reduces original root count while retaining the complete reference lottery and reply policy', () => {
  const actual = policy();
  validateLottery(actual.lottery);
  assert.deepEqual(actual.lottery.rootBudget, { min: 1, max: 2 });
  assert.deepEqual({ ...actual.lottery, rootBudget: reference.lottery.rootBudget }, reference.lottery);
  assert.deepEqual(actual.replyLottery, reference.replyLottery);
  assert.equal(actual.maxBatchPosts, 120);
});

test('media, author, motivation, negativity, reply, research and maintenance draws replay the reference system', () => {
  const actual = policy();
  const draws = Array.from({ length: 64 }, (_, index) => ({
    choices: drawPostChoices({ seed: 'gsm-port-' + index, postId: 'post-' + index,
      replyTo: index % 2 ? 'parent-post' : null, lottery: actual.lottery }),
    replies: drawThreadReplyCount({ seed: 'gsm-port-' + index, rootId: 'post-' + index, replyLottery: actual.replyLottery }),
    research: drawResearchWindows({ seed: 'gsm-port-' + index, lottery: actual.lottery }),
    maintenance: drawResearchMaintenance({ seed: 'gsm-port-' + index, lottery: actual.lottery,
      documents: [{ path: 'environment/research-comments.md', updatedAt: '2026-11-01T00:00:00Z' },
        { path: 'environment/research-negative.md', updatedAt: '2026-11-14T00:00:00Z' }],
      now: Date.parse('2026-11-15T00:00:00Z') })
  }));
  assert.equal(createHash('sha256').update(JSON.stringify(draws)).digest('hex'),
    '9a2b6d4e3490b68047b5f1ba5cad18f73cc8cf381668a5810c89b1fd177c72c6');
});

test('the smaller original budget remains a stable independent draw without capping replies at three', () => {
  const actual = policy(), roots = new Set(), replies = new Set();
  for (let index = 0; index < 512; index++) {
    const seed = 'gsm-count-range-' + index;
    const budget = drawRootBudget(seed, actual.lottery);
    assert.equal(drawRootBudget(seed, actual.lottery), budget);
    roots.add(budget);
    const count = drawThreadReplyCount({ seed, rootId: 'root-post', replyLottery: actual.replyLottery });
    assert.equal(drawThreadReplyCount({ seed, rootId: 'root-post', replyLottery: actual.replyLottery }), count);
    replies.add(count);
  }
  assert.deepEqual([...roots].sort(), [1, 2]);
  assert.ok(replies.has(0));
  assert.ok([...replies].some(count => count > 20), 'large discussions remain possible under the same reply lottery');
});
