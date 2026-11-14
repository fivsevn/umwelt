import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateSiteKaomoji, scanLocalizedPost } from '../tools/engine/localization.js';

const catalog = validateSiteKaomoji(JSON.parse(await readFile(new URL('../assets/emotes/kaomoji.json', import.meta.url), 'utf8')));

test('the complete gecko kaomoji catalog survives localization as standalone and mixed reactions', () => {
  assert.equal(catalog.items.length, 41);
  for (const item of catalog.items) {
    for (const text of [item.text, `前面说的事 ${item.text} 我还在想。`, `${item.text}${item.text}`]) {
      const post = { text, media: [] }, before = structuredClone(post);
      assert.deepEqual(scanLocalizedPost(post, { kaomoji: catalog }), [], item.id + ': ' + text);
      assert.deepEqual(post, before, 'checking a gecko reaction does not rewrite the draft');
    }
  }
});

test('registering gecko reactions does not whitelist L0 faces or retired generic faces', () => {
  for (const text of ['0[·_·]', '0[·_·]bbb', '│0[·_·]', '(·ω·)', '(¬_¬)', '(T_T)', '(^▽^)']) {
    assert.ok(scanLocalizedPost({ text, media: [] }, { kaomoji: catalog }).length > 0, text);
  }
  const literal = { text: '普通公式 (1 + 2)、版本 2.0 和文件名照常保留。', media: [] };
  assert.deepEqual(scanLocalizedPost(literal, { kaomoji: catalog }), []);
});
