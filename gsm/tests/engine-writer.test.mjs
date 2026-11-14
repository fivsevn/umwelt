import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { writerSource, assignGuestName } from '../tools/engine/writer-input.js';
import { scheduleParticipation } from '../tools/engine/participation.js';

test('writer input excludes editorial review while preserving the selected source text', () => {
  const source = { path: 'docs/writing.md', text: '# 写作\n\n守宫自己的处境。\n\n## 形成一条发言\n实际可见的事情。\n\n## 审读\nPRIVATE_EDITOR_REVIEW\n\n## 现实素材改编\n保留误会、兴趣和关系。\n' };
  const selected = writerSource(source, { sections: ['形成一条发言', '现实素材改编'] });
  for (const text of ['守宫自己的处境。', '实际可见的事情。', '保留误会、兴趣和关系。']) assert.ok(selected.text.includes(text));
  assert.doesNotMatch(selected.text, /PRIVATE_EDITOR_REVIEW|## 审读/);
  assert.match(source.text, /PRIVATE_EDITOR_REVIEW/);
  assert.throws(() => writerSource(source, { sections: ['不存在的章节'] }), /missing requested sections/);
});

test('the local GSM writing source gives writers gecko adaptation without the editor chapters', async () => {
  const text = await readFile(new URL('../docs/writing.md', import.meta.url), 'utf8');
  const selected = writerSource({ path: 'docs/writing.md', text }, { sections: ['形成一条发言', '现实素材改编'] });
  assert.match(selected.text, /守宫/);
  assert.doesNotMatch(selected.text, /## 审读|## 配图/);
  assert.ok(selected.text.length < text.length);
});

test('guest names remain stable identities unrelated to the next topic and avoid occupied names', () => {
  const identity = { author: 'guest-gecko-identity', seed: 'gsm-operation' };
  const first = assignGuestName(identity);
  assert.equal(assignGuestName({ ...identity, text: '今天看见一面玻璃', topic: '玻璃' }), first);
  assert.equal(assignGuestName({ ...identity, text: '和邻居吵了一架', topic: '邻居' }), first);
  assert.notEqual(assignGuestName({ ...identity, occupiedNames: [first] }).normalize('NFKC').toLowerCase(), first.normalize('NFKC').toLowerCase());
});

test('soft participation retains usual hours and occasional appearances without inventing an excuse', () => {
  const options = { seed: 'gsm-soft-hours', author: 'gecko404', version: 2, timezone: 'Asia/Shanghai',
    windows: [{ days: [1, 2, 3, 4, 5, 6, 7], start: '19:00', end: '21:00' }],
    windowStart: '2026-11-13T19:00:00.000Z', now: '2026-11-14T19:00:00.000Z' };
  const modes = new Set();
  for (let index = 0; index < 160; index++) {
    const result = scheduleParticipation({ ...options, postId: 'gsm-time-' + index });
    assert.equal(result.status, 'ready');
    assert.equal(result.reason, undefined);
    assert.ok(Date.parse(result.createdAt) >= Date.parse(options.windowStart));
    assert.ok(Date.parse(result.createdAt) <= Date.parse(options.now));
    assert.deepEqual(scheduleParticipation({ ...options, postId: 'gsm-time-' + index }), result);
    modes.add(result.mode);
  }
  assert.ok(modes.has('usual') && modes.has('occasional'));
  assert.equal(scheduleParticipation({ ...options, postId: 'after-parent', after: '2026-11-14T20:00:00Z' }).status, 'unavailable');
});
