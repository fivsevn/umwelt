import test from 'node:test';
import assert from 'node:assert/strict';
import {createThreads} from '../threads.mjs';
import {posts as publishedPosts} from '../data/feed.mjs';

const post = (id, createdAt, replyTo) => ({id, createdAt, ...(replyTo === undefined ? {} : {replyTo})});
const ids = list => list.map(item => item.id);

test('groups replies even when they precede their parents and preserves feed root order', () => {
  const nested = post('nested', 40, 'first'), rootB = post('root-b', 20);
  const second = post('second', 30, 'root-a'), rootA = post('root-a', 10), first = post('first', 25, 'root-a');
  const model = createThreads([nested, rootB, second, rootA, first]);
  assert.deepEqual(ids(model.roots), ['root-b', 'root-a']);
  assert.deepEqual(ids(model.commentsFor('root-a')), ['first', 'second', 'nested']);
  assert.deepEqual(ids(model.commentsFor('nested')), ['first', 'second', 'nested']);
  assert.equal(model.rootFor('nested'), rootA);
  assert.equal(model.parentFor('nested'), first);
  assert.equal(model.parentFor('first'), rootA);
  assert.equal(model.countFor('root-a'), 3);
  assert.equal(model.countFor('first'), 1);
  assert.equal(model.countFor('second'), 0);
  assert.equal(model.countFor('root-b'), 0);
});

test('orders comments by time and stable ID without mutating the source or exposing a mutable comment list', () => {
  const values = [post('z', 20, 'root'), post('root', 10), post('a', 20, 'root')].map(Object.freeze);
  Object.freeze(values);
  const model = createThreads(values), firstRead = model.commentsFor('root');
  assert.deepEqual(ids(firstRead), ['a', 'z']);
  firstRead.reverse();
  assert.deepEqual(ids(model.commentsFor('root')), ['a', 'z']);
  assert.deepEqual(ids(values), ['z', 'root', 'a']);
  assert.equal(model.byId.get('z'), values[0]);
  assert.equal(model.byId.get('z').replyTo, 'root');
});

test('unknown IDs and prototype-like IDs cannot resolve to another author or discussion', () => {
  const root = post('__proto__', 10), reply = post('constructor', 20, '__proto__');
  const model = createThreads([reply, root]);
  assert.equal(model.rootFor('constructor'), root);
  assert.equal(model.parentFor('constructor'), root);
  assert.equal(model.byId.get('__proto__'), root);
  for (const id of ['missing', 'toString', undefined, null]) {
    assert.equal(model.rootFor(id), null);
    assert.equal(model.parentFor(id), null);
    assert.deepEqual(model.commentsFor(id), []);
    assert.equal(model.countFor(id), 0);
  }
});

test('missing parents and their dependent chains stay independent instead of borrowing another root', () => {
  const values = [post('child', 30, 'orphan'), post('orphan', 20, 'gone'), post('healthy', 10), post('valid', 40, 'healthy')];
  const model = createThreads(values);
  assert.deepEqual(ids(model.roots), ['child', 'orphan', 'healthy']);
  for (const id of ['child', 'orphan']) {
    assert.equal(model.rootFor(id), model.byId.get(id));
    assert.equal(model.parentFor(id), null);
    assert.equal(model.countFor(id), 0);
    assert.deepEqual(model.commentsFor(id), []);
  }
  assert.deepEqual(ids(model.commentsFor('healthy')), ['valid']);
  assert.equal(values[0].replyTo, 'orphan');
});

test('cycles, self-replies and their dependents are isolated without losing healthy discussions', () => {
  const values = [post('a', 10, 'b'), post('b', 20, 'c'), post('c', 30, 'a'), post('dependent', 40, 'b'), post('self', 50, 'self'), post('root', 1), post('reply', 60, 'root')];
  const model = createThreads(values);
  assert.deepEqual(ids(model.roots), ['a', 'b', 'c', 'dependent', 'self', 'root']);
  for (const id of ['a', 'b', 'c', 'dependent', 'self']) {
    assert.equal(model.rootFor(id).id, id);
    assert.equal(model.parentFor(id), null);
    assert.equal(model.countFor(id), 0);
  }
  assert.deepEqual(ids(model.commentsFor('root')), ['reply']);
});

test('empty inputs, invalid entries and duplicate IDs are deterministic', () => {
  assert.deepEqual(createThreads(null).roots, []);
  assert.deepEqual(createThreads().commentsFor('missing'), []);
  const first = post('same', 20), duplicate = post('same', 10, 'missing');
  const model = createThreads([null, undefined, {}, {id: ''}, {id: 3}, first, duplicate]);
  assert.deepEqual(model.roots, [first]);
  assert.equal(model.byId.get('same'), first);
});

test('a deep reply chain is counted without a recursive stack or touching post objects', () => {
  const values = Array.from({length: 5000}, (_, index) => Object.freeze(post(`post-${index}`, index, index ? `post-${index - 1}` : null))).reverse();
  const model = createThreads(values);
  assert.equal(model.roots.length, 1);
  assert.equal(model.rootFor('post-4999').id, 'post-0');
  assert.equal(model.countFor('post-0'), 4999);
  assert.equal(model.countFor('post-2500'), 2499);
  assert.equal(model.commentsFor('post-4999').length, 4999);
});

test('the published feed partitions into roots and their actual complete discussions', () => {
  const model = createThreads(publishedPosts);
  const grouped = model.roots.flatMap(root => [root, ...model.commentsFor(root.id)]);
  assert.equal(grouped.length, publishedPosts.length);
  assert.equal(new Set(grouped.map(item => item.id)).size, publishedPosts.length);
  for (const value of publishedPosts) {
    assert.ok(model.rootFor(value.id));
    if (value.replyTo) assert.equal(model.parentFor(value.id)?.id, value.replyTo);
  }
});
