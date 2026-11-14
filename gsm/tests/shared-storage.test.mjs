import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, mkdtemp, cp, mkdir, writeFile, rm, access } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { loadContent, buildFeed, ingestBatch, validateContent, socialRoot } from '../tools/engine/content.js';
import { readUserDocuments } from '../tools/engine/user-documents.js';
import { readThreadPackages, writeThreadBatch, cancelPendingBatch, parsePostDocument } from '../tools/engine/thread-packages.js';
import { parsePublicFeed } from '../tools/engine/verify-live.js';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
async function snapshot(root, folders = ['posts', 'users', 'assets/avatars', 'assets/emotes']) {
  const result = {};
  async function visit(path) {
    for (const entry of await readdir(join(root, path), { withFileTypes: true })) {
      const relative = path + '/' + entry.name;
      if (entry.isDirectory()) await visit(relative);
      else result[relative] = hash(await readFile(join(root, relative)));
    }
  }
  for (const folder of folders) await visit(folder);
  for (const path of ['data/feed.mjs', 'accounts.json']) result[path] = hash(await readFile(join(root, path)));
  return result;
}
async function fixture(t) {
  const work = await mkdtemp(join(tmpdir(), 'gsm-storage-'));
  t.after(() => rm(work, { recursive: true, force: true }));
  const root = join(work, 'gsm');
  await mkdir(root);
  for (const path of ['posts', 'users', 'assets', 'docs', 'environment', 'data', 'accounts.json', 'publication.json']) {
    await cp(join(socialRoot, path), join(root, path), { recursive: true });
  }
  return { root, work };
}
const batchOf = posts => ({ version: 1, id: 'gsm-storage-test', mode: 'daily', posts });
const postOf = (id, changes = {}) => ({ id, author: 'gecko404', createdAt: new Date(Date.now() - 1000).toISOString(),
  replyTo: null, text: '测试用内容，只写入隔离临时目录。', likes: 0, canon: 'derivative', media: [], ...changes });

async function verifyPreservedReadAndRebuild(root) {
  const before = await snapshot(root);
  const original = parsePublicFeed(await readFile(join(root, 'data/feed.mjs'), 'utf8'));
  const { feed, registry, legacyPosts, files } = await loadContent(root);
  const ids = posts => posts.map(post => post.id).sort();
  assert.deepEqual(ids(feed.posts), ids(original.posts));
  // Both native YAML archives and later canonical packages are authoritative.
  // Classify their actual source metadata rather than assuming every saved post
  // still belongs to the pre-migration format.
  const nativeIds = [], canonicalPosts = [];
  for (const path of files) {
    const source = await readFile(path, 'utf8');
    const metadata = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(source)?.[1];
    assert.ok(metadata, path);
    if (/^author: /m.test(metadata)) canonicalPosts.push(parsePostDocument(source, path));
    else {
      assert.match(metadata, /^username: /m, path);
      nativeIds.push(basename(path) === 'index.md' ? basename(dirname(path)) : basename(path, '.md'));
    }
  }
  assert.deepEqual(ids(legacyPosts), nativeIds.sort());
  assert.deepEqual([...nativeIds, ...ids(canonicalPosts)].sort(), ids(original.posts));
  for (const archived of [...legacyPosts, ...canonicalPosts]) {
    assert.deepEqual(feed.posts.find(post => post.id === archived.id), archived, archived.id);
  }
  for (const saved of original.posts) {
    const post = feed.posts.find(post => post.id === saved.id);
    assert.ok(post, saved.id);
    assert.equal(post.author, saved.author);
    assert.equal(Date.parse(post.createdAt), saved.createdAt);
    assert.equal(post.replyTo, saved.replyTo ?? null);
    assert.equal(post.likes, saved.likes);
    assert.deepEqual(post.media.map(image => ({ src: '/gsm/' + image.src, alt: image.alt })),
      saved.blocks.zh.filter(block => block.type === 'image').map(({ src, alt }) => ({ src, alt })));
  }
  for (const id of ['backpackgecko', 'gedageda', 'isopodafugue']) {
    const user = registry.users.find(user => user.id === id);
    assert.equal(user.aiScope, 'none'); assert.equal(user.kind, 'admin');
    assert.equal(user.allowPosts, false); assert.equal(user.allowReplies, false);
  }
  const material = await readUserDocuments(root);
  assert.equal(material.profiles.gecko404.notes, await readFile(join(root, 'users/gecko404/profile.md'), 'utf8'));
  await buildFeed(root);
  assert.deepEqual(await snapshot(root), before);
  await assert.rejects(access(join(root, 'data/feed.json')), { code: 'ENOENT' });
  return { feed, legacyPosts, canonicalPosts };
}

test('native and canonical identities, reply relationships, media and files survive read and rebuild exactly', async t => {
  const { root } = await fixture(t);
  await verifyPreservedReadAndRebuild(root);
});

test('new canonical root and native-thread reply render, retry and keep old source bytes', async t => {
  const { root, work } = await fixture(t), before = await snapshot(root);
  const createdAt = new Date(Date.now() - 1000).toISOString();
  const month = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit' }).format(new Date(createdAt)).replace('-', '/');
  const rootId = 'gsm-storage-new-root';
  const image = `posts/${month}/${rootId}/media/test.webp`;
  await mkdir(dirname(join(root, image)), { recursive: true });
  await cp(join(root, 'assets/avatars/gecko404.webp'), join(root, image));
  const posts = [postOf(rootId, { createdAt, text: '', media: [{ src: image, alt: '隔离测试图', kind: 'image' }] }),
    postOf('gsm-storage-new-reply', { createdAt, replyTo: '20261019-161754-6c3cd8bd2e', text: 'username: 这仍然是正文，不能被识别为旧配置。' })];
  const input = join(work, 'batch.json'); await writeFile(input, JSON.stringify(batchOf(posts)));
  assert.equal((await ingestBatch(input, { root, reviewed: true })).status, 'archived');
  assert.equal((await ingestBatch(input, { root, reviewed: true })).status, 'already-archived');
  const archive = await readThreadPackages(root);
  assert.ok(archive.files.includes(join(root, 'posts/2026/10/20261019-161754-6c3cd8bd2e/replies/gsm-storage-new-reply.md')));
  assert.deepEqual(archive.batches.flatMap(batch => batch.posts).find(post => post.id === rootId), posts[0]);
  const source = await readFile(join(root, 'data/feed.mjs'), 'utf8');
  const runtime = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  const visible = runtime.posts.find(post => post.id === rootId);
  assert.equal(visible.createdAt, Date.parse(createdAt));
  assert.equal(visible.blocks.zh.length, 1); assert.equal(visible.blocks.zh[0].type, 'image');
  assert.equal(visible.blocks.zh[0].src, '/gsm/' + image);
  const verified = await verifyPreservedReadAndRebuild(root);
  for (const post of posts) {
    assert.deepEqual(verified.canonicalPosts.find(item => item.id === post.id), post);
    assert.equal(verified.legacyPosts.some(item => item.id === post.id), false);
  }
  for (const [path, digest] of Object.entries(before)) {
    if (['data/feed.mjs'].includes(path)) continue;
    assert.equal(hash(await readFile(join(root, path))), digest, path);
  }
  await writeFile(input, JSON.stringify(batchOf([{ ...posts[0], text: '修改已归档内容' }])));
  await assert.rejects(ingestBatch(input, { root, reviewed: true }), /different content/);
});

test('author accounts and legacy asset exemptions cannot be used by new AI posts', async t => {
  const { root, work } = await fixture(t), input = join(work, 'batch.json');
  await writeFile(input, JSON.stringify(batchOf([postOf('gsm-reserved-test', { author: 'gedageda' })])));
  await assert.rejects(ingestBatch(input, { root, reviewed: true, ai: true }), /Administrator accounts require manual/);
  const data = await loadContent(root);
  const historical = data.legacyPosts.find(post => post.media.some(image => image.src.includes('/assets/')));
  assert.ok(historical);
  const forged = postOf('gsm-new-invalid-media', { media: historical.media });
  assert.throws(() => validateContent(data.registry, [...data.batches, batchOf([forged])], data.policy,
    { siteEmotes: data.siteEmotes, localization: data.localization, legacyPosts: data.legacyPosts }), /Invalid media path/);
});

test('pending canonical import remains hidden and hash-checked cancellation preserves history', async t => {
  const { root } = await fixture(t), before = await snapshot(root);
  const post = postOf('gsm-storage-pending'), batch = batchOf([post]);
  // A completed write gives the exact content and hash; emulate interruption
  // immediately before commit by restoring its pending journal.
  const archive = await readThreadPackages(root);
  const written = await writeThreadBatch(root, batch, archive.batches);
  const path = written.files[0].slice(root.length + 1);
  const canonical = value => Array.isArray(value) ? '[' + value.map(canonical).join(',') + ']' : value && typeof value === 'object'
    ? '{' + Object.keys(value).sort().map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}' : JSON.stringify(value);
  const pending = { version: 1, id: batch.id, batchDigest: hash(canonical(batch)), files: [{ path, sha256: hash(await readFile(written.files[0])) }] };
  await writeFile(join(root, '.publish-pending.json'), JSON.stringify(pending));
  await assert.rejects(loadContent(root), /unfinished update/);
  assert.equal((await readThreadPackages(root)).batches.flatMap(batch => batch.posts).some(item => item.id === post.id), false);
  assert.equal((await cancelPendingBatch(root, { id: batch.id })).count, 1);
  assert.deepEqual(await snapshot(root), before);
});

test('returning native guest keeps its biography and registered emotes use GSM assets', async t => {
  const { root, work } = await fixture(t);
  const prior = await readThreadPackages(root);
  const guest = 'guest-boxlid27', biography = '在隔离测试中保留的既有简介。';
  for (const file of prior.files) {
    const source = await readFile(file, 'utf8');
    if (source.includes('username: ' + guest + '\n')) {
      await writeFile(file, source.replace(/(guest:\n  name: [^\n]+)\n/, '$1\n  bio: ' + biography + '\n'));
    }
  }
  const src = 'assets/emotes/gsm/test.webp';
  await cp(join(root, 'assets/avatars/gecko404.webp'), join(root, src));
  await writeFile(join(root, 'assets/emotes/gsm/manifest.json'), JSON.stringify({ version: 1, name: 'GSM', items: [
    { id: 'test', name: '测试表情', src, alt: '测试表情' }
  ] }));
  const known = (await loadContent(root)).feed.users.find(user => user.id === guest);
  assert.equal(known.bio, biography);
  const reply = postOf('gsm-returning-guest-test', { author: guest, guest: { name: known.name },
    replyTo: '20261019-161754-6c3cd8bd2e', text: '', media: [{ src, alt: '测试表情', kind: 'emote', fit: 'contain' }] });
  const input = join(work, 'returning.json'); await writeFile(input, JSON.stringify(batchOf([reply])));
  await ingestBatch(input, { root, reviewed: true });
  const source = await readFile(join(root, 'data/feed.mjs'), 'utf8');
  const runtime = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  assert.equal(runtime.profiles[guest].bio, biography);
  assert.equal(runtime.posts.find(post => post.id === reply.id).blocks.zh[0].src, '/gsm/' + src);
  const manifest = JSON.parse(await readFile(join(root, '.publishing/public.json'), 'utf8'));
  assert.ok(manifest.includes('gsm/' + src));
  const verified = await verifyPreservedReadAndRebuild(root);
  assert.deepEqual(verified.canonicalPosts.find(post => post.id === reply.id), reply);
});
